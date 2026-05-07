package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func Connect() {
	dsn := fmt.Sprintf(
		"host=%s port=%s dbname=%s user=%s password=%s sslmode=disable",
		getEnv("DB_HOST", "localhost"),
		getEnv("DB_PORT", "5432"),
		getEnv("DB_NAME", "youit_cafe"),
		getEnv("DB_USER", "youit_user"),
		getEnv("DB_PASSWORD", "youit_pass_2024"),
	)

	var err error
	DB, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("Failed to open DB: %v", err)
	}

	if err = DB.Ping(); err != nil {
		log.Fatalf("Failed to connect to DB: %v", err)
	}

	DB.SetMaxOpenConns(25)
	DB.SetMaxIdleConns(10)
	log.Println("Database connected")
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
