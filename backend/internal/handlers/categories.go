package handlers

import (
	"net/http"

	"youit-backend/internal/database"

	"github.com/gin-gonic/gin"
)

type categoryRequest struct {
	Name      string `json:"name" binding:"required"`
	ImageURL  string `json:"image_url"`
	SortOrder int    `json:"sort_order"`
}

// GetCategories — public list of product categories with their photos.
func GetCategories(c *gin.Context) {
	rows, err := database.DB.Query(
		`SELECT id, name, COALESCE(image_url,''), COALESCE(sort_order,0)
		 FROM categories ORDER BY sort_order ASC, name ASC`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error"})
		return
	}
	defer rows.Close()

	out := []gin.H{}
	for rows.Next() {
		var id, sort int
		var name, img string
		if err := rows.Scan(&id, &name, &img, &sort); err != nil {
			continue
		}
		out = append(out, gin.H{"id": id, "name": name, "image_url": img, "sort_order": sort})
	}
	c.JSON(http.StatusOK, out)
}

// CreateCategory — admin: add a category with an optional photo (data URL).
func CreateCategory(c *gin.Context) {
	var req categoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nomi kiritilishi shart"})
		return
	}
	var id int
	err := database.DB.QueryRow(
		`INSERT INTO categories (name, image_url, sort_order) VALUES ($1, $2, $3) RETURNING id`,
		req.Name, req.ImageURL, req.SortOrder,
	).Scan(&id)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Bunday kategoriya allaqachon mavjud"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"id": id, "name": req.Name, "image_url": req.ImageURL, "sort_order": req.SortOrder})
}

// UpdateCategory — admin: rename, change photo, reorder. Renaming a category
// also relabels every menu item that used the old name, so nothing is orphaned.
func UpdateCategory(c *gin.Context) {
	id := c.Param("id")
	var req categoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var oldName string
	if err := database.DB.QueryRow(`SELECT name FROM categories WHERE id=$1`, id).Scan(&oldName); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Topilmadi"})
		return
	}

	if _, err := database.DB.Exec(
		`UPDATE categories SET name=$1, image_url=$2, sort_order=$3 WHERE id=$4`,
		req.Name, req.ImageURL, req.SortOrder, id,
	); err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Bunday kategoriya allaqachon mavjud"})
		return
	}

	if oldName != req.Name {
		database.DB.Exec(`UPDATE menu_items SET category=$1 WHERE category=$2`, req.Name, oldName)
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// DeleteCategory — admin: remove a category (menu items keep their text label).
func DeleteCategory(c *gin.Context) {
	id := c.Param("id")
	if _, err := database.DB.Exec(`DELETE FROM categories WHERE id=$1`, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}
