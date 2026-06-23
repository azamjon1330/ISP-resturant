package handlers

import (
	"database/sql"
	"net/http"
	"os"
	"strconv"
	"time"

	"youit-backend/internal/database"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var userID int
	var role string
	err := database.DB.QueryRow(
		`SELECT id, role FROM admin_users WHERE username = $1 AND password_hash = crypt($2, password_hash)`,
		req.Username, req.Password,
	).Scan(&userID, &role)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный логин или пароль"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error"})
		return
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "youit_jwt_secret_key_2024"
	}

	// Staff sessions live longer than admin (24h) so cashiers / kitchen
	// tablets stay logged in across a work day without re-entering the PIN.
	exp := time.Now().Add(24 * time.Hour)
	if role != "admin" {
		exp = time.Now().Add(30 * 24 * time.Hour)
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  userID,
		"username": req.Username,
		"role":     role,
		"exp":      exp.Unix(),
	})

	tokenStr, err := token.SignedString([]byte(secret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":    tokenStr,
		"role":     role,
		"username": req.Username,
	})
}

// Me returns the current staff account behind the token. Panels call this on
// load to confirm the token saved on the device is still valid and to read the
// real, up-to-date role (so a deleted or re-roled account is rejected).
func Me(c *gin.Context) {
	uid, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	// JWT numeric claims arrive as float64.
	var userID int
	switch v := uid.(type) {
	case float64:
		userID = int(v)
	case int:
		userID = v
	default:
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	var id int
	var username, role string
	err := database.DB.QueryRow(
		`SELECT id, username, role FROM admin_users WHERE id = $1`, userID,
	).Scan(&id, &username, &role)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Account not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"id": id, "username": username, "role": role})
}

/* ─── Staff (login) management — admin only ─── */

var allowedRoles = map[string]bool{"admin": true, "cashier": true, "kitchen": true}

type staffCreateRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Role     string `json:"role" binding:"required"`
}

type staffUpdateRequest struct {
	Password string `json:"password"`
	Role     string `json:"role"`
}

// ListStaff returns all staff logins (never the password hashes).
func ListStaff(c *gin.Context) {
	rows, err := database.DB.Query(
		`SELECT id, username, role, created_at FROM admin_users ORDER BY created_at ASC, id ASC`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error"})
		return
	}
	defer rows.Close()

	staff := []gin.H{}
	for rows.Next() {
		var id int
		var username, role string
		var createdAt time.Time
		if err := rows.Scan(&id, &username, &role, &createdAt); err != nil {
			continue
		}
		staff = append(staff, gin.H{
			"id": id, "username": username, "role": role, "created_at": createdAt,
		})
	}
	c.JSON(http.StatusOK, staff)
}

// CreateStaff adds a new login with a bcrypt-hashed password.
func CreateStaff(c *gin.Context) {
	var req staffCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Логин, парол ва роль киритилиши шарт"})
		return
	}
	if !allowedRoles[req.Role] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
		return
	}

	var id int
	err := database.DB.QueryRow(
		`INSERT INTO admin_users (username, password_hash, role)
		 VALUES ($1, crypt($2, gen_salt('bf')), $3) RETURNING id`,
		req.Username, req.Password, req.Role,
	).Scan(&id)
	if err != nil {
		// Unique violation on username
		c.JSON(http.StatusConflict, gin.H{"error": "Бундай логин аллақачон мавжуд"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"id": id, "username": req.Username, "role": req.Role})
}

// UpdateStaff changes the role and/or resets the password of a login.
func UpdateStaff(c *gin.Context) {
	id := c.Param("id")
	var req staffUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if req.Role != "" {
		if !allowedRoles[req.Role] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
			return
		}
		if _, err := database.DB.Exec(`UPDATE admin_users SET role = $1 WHERE id = $2`, req.Role, id); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error"})
			return
		}
	}
	if req.Password != "" {
		if _, err := database.DB.Exec(
			`UPDATE admin_users SET password_hash = crypt($1, gen_salt('bf')) WHERE id = $2`,
			req.Password, id,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// DeleteStaff removes a login. You cannot delete your own account, and the
// last remaining admin cannot be removed (prevents lock-out).
func DeleteStaff(c *gin.Context) {
	id := c.Param("id")

	if cur, ok := c.Get("user_id"); ok {
		var curID int
		switch v := cur.(type) {
		case float64:
			curID = int(v)
		case int:
			curID = v
		}
		if strconv.Itoa(curID) == id {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Ўз ҳисобингизни ўчира олмайсиз"})
			return
		}
	}

	var role string
	if err := database.DB.QueryRow(`SELECT role FROM admin_users WHERE id = $1`, id).Scan(&role); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
		return
	}
	if role == "admin" {
		var admins int
		database.DB.QueryRow(`SELECT COUNT(*) FROM admin_users WHERE role = 'admin'`).Scan(&admins)
		if admins <= 1 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Охирги админни ўчириб бўлмайди"})
			return
		}
	}

	if _, err := database.DB.Exec(`DELETE FROM admin_users WHERE id = $1`, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}
