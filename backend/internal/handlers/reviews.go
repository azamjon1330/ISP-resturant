package handlers

import (
	"net/http"
	"strings"

	"youit-backend/internal/database"
	"youit-backend/internal/models"

	"github.com/gin-gonic/gin"
)

// GetReviews — public, returns up to 30 latest reviews for landing page display.
func GetReviews(c *gin.Context) {
	rows, err := database.DB.Query(
		`SELECT id, COALESCE(order_id,0), COALESCE(order_code,''),
		        COALESCE(customer_id,0), customer_name, rating, COALESCE(comment,''), created_at
		 FROM reviews ORDER BY created_at DESC LIMIT 30`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var out []models.Review
	for rows.Next() {
		var r models.Review
		rows.Scan(&r.ID, &r.OrderID, &r.OrderCode, &r.CustomerID, &r.CustomerName, &r.Rating, &r.Comment, &r.CreatedAt)
		out = append(out, r)
	}
	if out == nil {
		out = []models.Review{}
	}
	c.JSON(http.StatusOK, out)
}

// CreateReview — authenticated customer submits a review for a completed order.
func CreateReview(c *gin.Context) {
	customerID := c.GetInt("customer_id")
	code := strings.ToUpper(strings.TrimSpace(c.Param("code")))

	var body struct {
		Rating  int    `json:"rating" binding:"required,min=1,max=5"`
		Comment string `json:"comment"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Rating (1-5) is required"})
		return
	}

	// Verify the order belongs to this customer and is served
	var orderID int
	var status string
	err := database.DB.QueryRow(
		`SELECT id, status FROM orders WHERE order_code=$1 AND customer_id=$2`,
		code, customerID,
	).Scan(&orderID, &status)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}
	if status != "served" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Order not completed yet"})
		return
	}

	// Reject duplicate reviews
	var existing int
	database.DB.QueryRow(`SELECT COUNT(*) FROM reviews WHERE order_id=$1`, orderID).Scan(&existing)
	if existing > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Already reviewed"})
		return
	}

	// Fetch customer name
	var firstName, lastName string
	database.DB.QueryRow(
		`SELECT first_name, COALESCE(last_name,'') FROM customers WHERE id=$1`, customerID,
	).Scan(&firstName, &lastName)
	name := firstName
	if lastName != "" {
		name += " " + lastName
	}

	var review models.Review
	err = database.DB.QueryRow(
		`INSERT INTO reviews (order_id, order_code, customer_id, customer_name, rating, comment)
		 VALUES ($1,$2,$3,$4,$5,$6)
		 RETURNING id, order_id, order_code, customer_id, customer_name, rating, COALESCE(comment,''), created_at`,
		orderID, code, customerID, name, body.Rating, body.Comment,
	).Scan(&review.ID, &review.OrderID, &review.OrderCode, &review.CustomerID,
		&review.CustomerName, &review.Rating, &review.Comment, &review.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, review)
}
