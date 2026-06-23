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
		// ── Extensions ────────────────────────────────────────────────────────
		`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,

		// ── Core tables (CREATE IF NOT EXISTS — idempotent on re-deploy) ─────

		`CREATE TABLE IF NOT EXISTS menu_items (
			id          SERIAL PRIMARY KEY,
			name        VARCHAR(255) NOT NULL,
			description TEXT,
			price       DECIMAL(10,2) NOT NULL,
			cost_price  DECIMAL(10,2) DEFAULT 0,
			category    VARCHAR(100) DEFAULT 'Asosiy taomlar',
			image_url   TEXT,
			available   BOOLEAN DEFAULT true,
			created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS orders (
			id                   SERIAL PRIMARY KEY,
			order_code           VARCHAR(6) UNIQUE NOT NULL,
			total_price          DECIMAL(10,2) NOT NULL DEFAULT 0,
			discount_amount      DECIMAL(10,2) DEFAULT 0,
			final_price          DECIMAL(10,2) NOT NULL DEFAULT 0,
			status               VARCHAR(20) DEFAULT 'pending',
			card_code            VARCHAR(20),
			note                 TEXT,
			customer_first_name  VARCHAR(100),
			customer_last_name   VARCHAR(100),
			customer_phone       VARCHAR(30),
			delivery_type        VARCHAR(20) DEFAULT 'pickup',
			delivery_address     TEXT,
			delivery_lat         DOUBLE PRECISION,
			delivery_lng         DOUBLE PRECISION,
			created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS order_items (
			id           SERIAL PRIMARY KEY,
			order_id     INTEGER REFERENCES orders(id) ON DELETE CASCADE,
			menu_item_id INTEGER REFERENCES menu_items(id),
			quantity     INTEGER NOT NULL DEFAULT 1,
			unit_price   DECIMAL(10,2) NOT NULL,
			item_name    VARCHAR(255) NOT NULL
		)`,

		`CREATE TABLE IF NOT EXISTS referral_agents (
			id                       SERIAL PRIMARY KEY,
			code                     VARCHAR(7) UNIQUE NOT NULL,
			name                     VARCHAR(255) NOT NULL,
			phone                    VARCHAR(20),
			gold_card_code           VARCHAR(20) UNIQUE NOT NULL,
			regular_card_count       INTEGER DEFAULT 20,
			discount_amount          DECIMAL(10,2) DEFAULT 20000,
			bonus_threshold          INTEGER DEFAULT 10,
			referral_bonus_threshold INTEGER DEFAULT 20,
			gold_card_uses           INTEGER DEFAULT 0,
			referral_card_total_uses INTEGER DEFAULT 0,
			total_bonus_earned       INTEGER DEFAULT 0,
			is_active                BOOLEAN DEFAULT true,
			created_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS referral_cards (
			id         SERIAL PRIMARY KEY,
			agent_id   INTEGER REFERENCES referral_agents(id) ON DELETE CASCADE,
			card_code  VARCHAR(20) UNIQUE NOT NULL,
			card_type  VARCHAR(10) NOT NULL CHECK (card_type IN ('gold', 'regular')),
			use_count  INTEGER DEFAULT 0,
			is_active  BOOLEAN DEFAULT true,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS card_transactions (
			id               SERIAL PRIMARY KEY,
			card_id          INTEGER REFERENCES referral_cards(id),
			order_id         INTEGER REFERENCES orders(id),
			agent_id         INTEGER REFERENCES referral_agents(id),
			discount_applied DECIMAL(10,2) DEFAULT 0,
			created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS agent_bonuses (
			id          SERIAL PRIMARY KEY,
			agent_id    INTEGER REFERENCES referral_agents(id),
			bonus_type  VARCHAR(20) NOT NULL CHECK (bonus_type IN ('gold_meal', 'referral_meal')),
			amount      DECIMAL(10,2) DEFAULT 0,
			description TEXT,
			used        BOOLEAN DEFAULT false,
			created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS admin_users (
			id            SERIAL PRIMARY KEY,
			username      VARCHAR(100) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			role          VARCHAR(20) DEFAULT 'admin',
			created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS expenses (
			id          SERIAL PRIMARY KEY,
			description VARCHAR(255) NOT NULL,
			amount      DECIMAL(10,2) NOT NULL,
			category    VARCHAR(100) DEFAULT 'Umumiy',
			created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS customers (
			id            SERIAL PRIMARY KEY,
			phone         VARCHAR(30) UNIQUE NOT NULL,
			first_name    VARCHAR(100) NOT NULL DEFAULT '',
			last_name     VARCHAR(100) DEFAULT '',
			password_hash VARCHAR(255),
			created_at    TIMESTAMPTZ DEFAULT NOW()
		)`,

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

		`CREATE TABLE IF NOT EXISTS promo_discount (
			id              SERIAL PRIMARY KEY,
			code            VARCHAR(40) UNIQUE NOT NULL,
			discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
			discount_type   VARCHAR(10) DEFAULT 'amount',
			is_active       BOOLEAN DEFAULT true,
			usage_limit     INT DEFAULT 0,
			use_count       INT DEFAULT 0,
			valid_until     TIMESTAMP NULL,
			created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS vip_cards (
			id         SERIAL PRIMARY KEY,
			code       VARCHAR(40) UNIQUE NOT NULL,
			first_name VARCHAR(100) NOT NULL,
			last_name  VARCHAR(100) DEFAULT '',
			is_active  BOOLEAN DEFAULT true,
			use_count  INT DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS couriers (
			id           SERIAL PRIMARY KEY,
			phone        VARCHAR(20) UNIQUE NOT NULL,
			first_name   VARCHAR(100) NOT NULL,
			last_name    VARCHAR(100),
			pin          VARCHAR(20) NOT NULL,
			is_active    BOOLEAN DEFAULT TRUE,
			current_lat  DOUBLE PRECISION,
			current_lng  DOUBLE PRECISION,
			last_seen_at TIMESTAMP,
			created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		// ── Additive columns (safe to re-run with IF NOT EXISTS) ─────────────
		`ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id)`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_id INTEGER NULL REFERENCES couriers(id) ON DELETE SET NULL`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_first_name VARCHAR(100)`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_last_name  VARCHAR(100)`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone      VARCHAR(30)`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_type    VARCHAR(20) DEFAULT 'pickup'`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lat     DOUBLE PRECISION`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lng     DOUBLE PRECISION`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS note             TEXT`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS card_code        VARCHAR(20)`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount  DECIMAL(10,2) DEFAULT 0`,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS final_price      DECIMAL(10,2) DEFAULT 0`,
		`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS expense_type VARCHAR(20) DEFAULT 'one_time'`,
		`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false`,
		`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0`,
		`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS markup_percent DECIMAL(5,2) DEFAULT 0`,
		`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS food_cost DECIMAL(10,2) DEFAULT 0`,
		`ALTER TABLE promo_discount ADD COLUMN IF NOT EXISTS discount_type VARCHAR(10) DEFAULT 'amount'`,

		// ── Inventory & recipes ───────────────────────────────────────────────
		`CREATE TABLE IF NOT EXISTS ingredients (
			id                  SERIAL PRIMARY KEY,
			name                VARCHAR(255) NOT NULL,
			category            VARCHAR(100) DEFAULT 'Umumiy',
			measurement_unit    VARCHAR(20)  NOT NULL,
			quantity            DECIMAL(12,3) NOT NULL DEFAULT 0,
			unit_price          DECIMAL(10,2) NOT NULL DEFAULT 0,
			low_stock_threshold DECIMAL(12,3) DEFAULT 5,
			created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS ingredient_purchases (
			id                 SERIAL PRIMARY KEY,
			ingredient_id      INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
			quantity_purchased DECIMAL(12,3) NOT NULL,
			unit_price         DECIMAL(10,2) NOT NULL,
			total_cost         DECIMAL(12,2) NOT NULL,
			notes              TEXT,
			created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS recipe_items (
			id            SERIAL PRIMARY KEY,
			menu_item_id  INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
			ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
			quantity_used DECIMAL(12,3) NOT NULL,
			unit          VARCHAR(20)   NOT NULL,
			UNIQUE(menu_item_id, ingredient_id)
		)`,

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

		// ── Reviews ──────────────────────────────────────────────────────────
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

		// ── Restaurant settings (pickup location, etc.) ───────────────────────
		`CREATE TABLE IF NOT EXISTS restaurant_settings (
			key   VARCHAR(100) PRIMARY KEY,
			value TEXT NOT NULL
		)`,
		`INSERT INTO restaurant_settings (key, value) VALUES ('pickup_lat', '41.2995') ON CONFLICT (key) DO NOTHING`,
		`INSERT INTO restaurant_settings (key, value) VALUES ('pickup_lng', '69.2401') ON CONFLICT (key) DO NOTHING`,
		`INSERT INTO restaurant_settings (key, value) VALUES ('pickup_address', 'Toshkent, O''zbekiston') ON CONFLICT (key) DO NOTHING`,

		// ── Product categories (with photo) ───────────────────────────────────
		`CREATE TABLE IF NOT EXISTS categories (
			id         SERIAL PRIMARY KEY,
			name       VARCHAR(100) UNIQUE NOT NULL,
			image_url  TEXT,
			sort_order INTEGER DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		// ── Trigger: auto-update orders.updated_at ────────────────────────────
		`CREATE OR REPLACE FUNCTION update_updated_at()
		 RETURNS TRIGGER AS $$
		 BEGIN
		     NEW.updated_at = CURRENT_TIMESTAMP;
		     RETURN NEW;
		 END;
		 $$ LANGUAGE plpgsql`,

		// DROP before CREATE so re-deploys don't error on "trigger already exists"
		`DROP TRIGGER IF EXISTS orders_updated_at ON orders`,
		`CREATE TRIGGER orders_updated_at
		 BEFORE UPDATE ON orders
		 FOR EACH ROW EXECUTE FUNCTION update_updated_at()`,

		// ── Default admin account (login: 914751330 / pass: 12345678) ─────────
		`INSERT INTO admin_users (username, password_hash, role)
		 VALUES ('914751330', crypt('12345678', gen_salt('bf')), 'admin')
		 ON CONFLICT (username) DO NOTHING`,

		// ── Default promo code ────────────────────────────────────────────────
		`INSERT INTO promo_discount (code, discount_amount, discount_type, is_active)
		 VALUES ('PROMO-MAIN', 15000, 'amount', true)
		 ON CONFLICT (code) DO NOTHING`,
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
