package handlers

import (
	"database/sql"
	"net/http"
	"os"
	"time"

	"youit-backend/internal/database"
	"youit-backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type CustomerRegisterReq struct {
	Name     string `json:"name"     binding:"required"`
	LastName string `json:"last_name"`
	Phone    string `json:"phone"    binding:"required"`
	Password string `json:"password" binding:"required"`
}

type CustomerLoginReq struct {
	Phone    string `json:"phone"    binding:"required"`
	Password string `json:"password" binding:"required"`
}

func CustomerRegister(c *gin.Context) {
	var req CustomerRegisterReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ma'lumotlar noto'g'ri"})
		return
	}
	if len(req.Password) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Parol kamida 6 ta belgidan iborat bo'lishi kerak"})
		return
	}

	var existingID int
	err := database.DB.QueryRow(`SELECT id FROM customers WHERE phone=$1`, req.Phone).Scan(&existingID)
	if err != sql.ErrNoRows {
		c.JSON(http.StatusConflict, gin.H{"error": "Bu telefon raqam allaqachon ro'yxatdan o'tgan"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Xato yuz berdi"})
		return
	}

	var customerID int
	err = database.DB.QueryRow(
		`INSERT INTO customers (name, last_name, phone, password_hash) VALUES ($1,$2,$3,$4) RETURNING id`,
		req.Name, req.LastName, req.Phone, string(hash),
	).Scan(&customerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	token, _ := generateCustomerToken(customerID, req.Name, req.Phone)
	c.JSON(http.StatusCreated, gin.H{
		"token": token,
		"customer": models.Customer{
			ID:       customerID,
			Name:     req.Name,
			LastName: req.LastName,
			Phone:    req.Phone,
		},
	})
}

func CustomerLogin(c *gin.Context) {
	var req CustomerLoginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ma'lumotlar noto'g'ri"})
		return
	}

	var customerID int
	var name, lastName, hash string
	err := database.DB.QueryRow(
		`SELECT id, name, COALESCE(last_name,''), password_hash FROM customers WHERE phone=$1`,
		req.Phone,
	).Scan(&customerID, &name, &lastName, &hash)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Telefon yoki parol noto'g'ri"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Telefon yoki parol noto'g'ri"})
		return
	}

	token, _ := generateCustomerToken(customerID, name, req.Phone)
	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"customer": models.Customer{
			ID:       customerID,
			Name:     name,
			LastName: lastName,
			Phone:    req.Phone,
		},
	})
}

func generateCustomerToken(customerID int, name, phone string) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "youit_jwt_secret_key_2024"
	}
	claims := jwt.MapClaims{
		"customer_id": customerID,
		"name":        name,
		"phone":       phone,
		"role":        "customer",
		"exp":         time.Now().Add(30 * 24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}
