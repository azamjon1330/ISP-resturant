package main

import (
	"log"
	"os"

	"youit-backend/internal/database"
	"youit-backend/internal/handlers"
	"youit-backend/internal/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	database.Connect()

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// WebSocket
	r.GET("/ws", handlers.WSHandler)

	// Public routes
	api := r.Group("/api")
	{
		api.POST("/auth/login", handlers.Login)
		api.GET("/menu", handlers.GetMenu)
		api.GET("/orders/:code", handlers.GetOrderByCode)
		api.POST("/orders", handlers.CreateOrder)
		api.GET("/orders", handlers.GetOrders)
		api.PATCH("/orders/:id/status", handlers.UpdateOrderStatus)
		api.POST("/cards/scan", handlers.ScanCard)
		api.GET("/agents/code/:code", handlers.GetAgentByCode)
		api.GET("/agents/code/:code/history", handlers.GetAgentHistory)
	}

	// Admin routes (protected)
	admin := r.Group("/api/admin")
	admin.Use(middleware.AdminAuth())
	{
		admin.GET("/menu", handlers.GetMenu)
		admin.POST("/menu", handlers.CreateMenuItem)
		admin.PUT("/menu/:id", handlers.UpdateMenuItem)
		admin.DELETE("/menu/:id", handlers.DeleteMenuItem)
		admin.PATCH("/menu/:id/availability", handlers.ToggleMenuItemAvailability)

		admin.GET("/orders", handlers.GetOrders)
		admin.GET("/analytics", handlers.GetAnalytics)
		admin.POST("/expenses", handlers.CreateExpense)
		admin.GET("/expenses", handlers.GetExpenses)

		admin.GET("/agents", handlers.GetAgents)
		admin.POST("/agents", handlers.CreateAgent)
		admin.GET("/agents/:id", handlers.GetAgentDetail)
		admin.GET("/agents/:id/bonuses", handlers.GetAgentBonuses)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("YouIt Backend running on :%s", port)
	r.Run(":" + port)
}
