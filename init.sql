-- YouIt Cafe Database Schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Menu items
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) DEFAULT 'Основные блюда',
    image_url TEXT,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_code VARCHAR(6) UNIQUE NOT NULL,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    card_code VARCHAR(20),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER REFERENCES menu_items(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    item_name VARCHAR(255) NOT NULL
);

-- Referral agents
CREATE TABLE referral_agents (
    id SERIAL PRIMARY KEY,
    code VARCHAR(7) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    gold_card_code VARCHAR(20) UNIQUE NOT NULL,
    regular_card_count INTEGER DEFAULT 20,
    discount_amount DECIMAL(10,2) DEFAULT 20000,
    bonus_threshold INTEGER DEFAULT 10,
    referral_bonus_threshold INTEGER DEFAULT 20,
    gold_card_uses INTEGER DEFAULT 0,
    referral_card_total_uses INTEGER DEFAULT 0,
    total_bonus_earned INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Referral cards
CREATE TABLE referral_cards (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER REFERENCES referral_agents(id) ON DELETE CASCADE,
    card_code VARCHAR(20) UNIQUE NOT NULL,
    card_type VARCHAR(10) NOT NULL CHECK (card_type IN ('gold', 'regular')),
    use_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Card transactions
CREATE TABLE card_transactions (
    id SERIAL PRIMARY KEY,
    card_id INTEGER REFERENCES referral_cards(id),
    order_id INTEGER REFERENCES orders(id),
    agent_id INTEGER REFERENCES referral_agents(id),
    discount_applied DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent bonuses log
CREATE TABLE agent_bonuses (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER REFERENCES referral_agents(id),
    bonus_type VARCHAR(20) NOT NULL CHECK (bonus_type IN ('gold_meal', 'referral_meal')),
    amount DECIMAL(10,2) DEFAULT 0,
    description TEXT,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin users
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses (расходы)
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) DEFAULT 'Общие',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Default admin (login: 914751330, password: 12345678)
INSERT INTO admin_users (username, password_hash, role)
VALUES ('914751330', crypt('12345678', gen_salt('bf')), 'admin');

-- Sample menu
INSERT INTO menu_items (name, description, price, category) VALUES
('Ош (Плов)', 'Традиционный узбекский плов с рисом, морковью и бараниной', 35000, 'Основные блюда'),
('Самса', 'Хрустящая слоёная выпечка с мясом и луком', 8000, 'Выпечка'),
('Лагман', 'Суп с домашней лапшой и тушёным мясом', 28000, 'Супы'),
('Манты', 'Паровые пельмени с мясом и луком', 25000, 'Основные блюда'),
('Шурпа', 'Наваристый суп из баранины с овощами', 30000, 'Супы'),
('Шашлык (порция)', 'Мясо на углях, подаётся с лепёшкой', 45000, 'Гриль'),
('Димлама', 'Тушёное мясо с овощами в казане', 32000, 'Основные блюда'),
('Нон (лепёшка)', 'Свежеиспечённая тандырная лепёшка', 5000, 'Выпечка'),
('Чайник зелёного чая', 'Ароматный зелёный чай', 7000, 'Напитки'),
('Компот', 'Домашний компот из сухофруктов', 6000, 'Напитки'),
('Мастава', 'Рисовый суп с мясом и овощами', 26000, 'Супы'),
('Бешбармак', 'Мясо с домашней лапшой и луком', 38000, 'Основные блюда');
