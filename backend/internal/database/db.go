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
	runMigrations()
}

func runMigrations() {
	migrations := []string{
		// ── Customer accounts (phone-based, no password) ──────────────────────
		`CREATE TABLE IF NOT EXISTS customers (
			id         SERIAL PRIMARY KEY,
			phone      VARCHAR(30) UNIQUE NOT NULL,
			first_name VARCHAR(100) NOT NULL DEFAULT '',
			last_name  VARCHAR(100) DEFAULT '',
			created_at TIMESTAMPTZ DEFAULT NOW()
		)`,

		// Customer saved addresses
		`CREATE TABLE IF NOT EXISTS customer_addresses (
			id          SERIAL PRIMARY KEY,
			customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
			label       VARCHAR(100) DEFAULT 'Manzil',
			address     TEXT NOT NULL,
			lat         DOUBLE PRECISION,
			lng         DOUBLE PRECISION,
			is_default  BOOLEAN DEFAULT false,
			created_at  TIMESTAMPTZ DEFAULT NOW()
		)`,

		// Link orders to a customer
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id)`,

		// ── Expenses columns ──────────────────────────────────────────────────
		`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS expense_type VARCHAR(20) DEFAULT 'one_time'`,
		`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false`,

		// Food cost + markup on menu items
		`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS markup_percent DECIMAL(5,2) DEFAULT 0`,
		`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS food_cost DECIMAL(10,2) DEFAULT 0`,

		// Ingredients warehouse
		`CREATE TABLE IF NOT EXISTS ingredients (
			id                  SERIAL PRIMARY KEY,
			name                VARCHAR(255) NOT NULL,
			category            VARCHAR(100) DEFAULT 'Умумий',
			measurement_unit    VARCHAR(20)  NOT NULL,
			quantity            DECIMAL(12,3) NOT NULL DEFAULT 0,
			unit_price          DECIMAL(10,2) NOT NULL DEFAULT 0,
			low_stock_threshold DECIMAL(12,3) DEFAULT 5,
			created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		// Ingredient purchase history
		`CREATE TABLE IF NOT EXISTS ingredient_purchases (
			id                 SERIAL PRIMARY KEY,
			ingredient_id      INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
			quantity_purchased DECIMAL(12,3) NOT NULL,
			unit_price         DECIMAL(10,2) NOT NULL,
			total_cost         DECIMAL(12,2) NOT NULL,
			notes              TEXT,
			created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		// Recipe items
		`CREATE TABLE IF NOT EXISTS recipe_items (
			id            SERIAL PRIMARY KEY,
			menu_item_id  INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
			ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
			quantity_used DECIMAL(12,3) NOT NULL,
			unit          VARCHAR(20)   NOT NULL,
			UNIQUE(menu_item_id, ingredient_id)
		)`,

		// Customer reviews for completed orders
		`CREATE TABLE IF NOT EXISTS reviews (
			id            SERIAL PRIMARY KEY,
			order_id      INTEGER REFERENCES orders(id) ON DELETE SET NULL,
			order_code    VARCHAR(20),
			customer_id   INTEGER REFERENCES customers(id) ON DELETE SET NULL,
			customer_name VARCHAR(150),
			rating        SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
			comment       TEXT,
			created_at    TIMESTAMPTZ DEFAULT NOW()
		)`,
		`CREATE UNIQUE INDEX IF NOT EXISTS reviews_order_id_unique ON reviews(order_id)`,

		// Inventory movement log
		`CREATE TABLE IF NOT EXISTS inventory_logs (
			id               SERIAL PRIMARY KEY,
			ingredient_id    INTEGER REFERENCES ingredients(id) ON DELETE SET NULL,
			ingredient_name  VARCHAR(255),
			order_id         INTEGER REFERENCES orders(id) ON DELETE SET NULL,
			menu_item_id     INTEGER REFERENCES menu_items(id) ON DELETE SET NULL,
			quantity_change  DECIMAL(12,3) NOT NULL,
			action           VARCHAR(50)   NOT NULL,
			notes            TEXT,
			created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
	}

	for _, q := range migrations {
		if _, err := DB.Exec(q); err != nil {
			log.Printf("Migration warning: %v", err)
		}
	}
	log.Println("Migrations applied")
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
