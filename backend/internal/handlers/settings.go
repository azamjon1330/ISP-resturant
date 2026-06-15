package handlers

import (
	"net/http"

	"youit-backend/internal/database"
	"github.com/gin-gonic/gin"
)

// GetSettings returns all restaurant settings (public).
func GetSettings(c *gin.Context) {
	rows, err := database.DB.Query(`SELECT key, value FROM restaurant_settings`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	settings := map[string]string{}
	for rows.Next() {
		var k, v string
		rows.Scan(&k, &v)
		settings[k] = v
	}
	c.JSON(http.StatusOK, settings)
}

// UpdateSetting — admin only: upsert a key/value pair.
func UpdateSetting(c *gin.Context) {
	var body struct {
		Key   string `json:"key" binding:"required"`
		Value string `json:"value" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "key and value required"})
		return
	}

	_, err := database.DB.Exec(
		`INSERT INTO restaurant_settings (key, value) VALUES ($1, $2)
		 ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
		body.Key, body.Value,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
