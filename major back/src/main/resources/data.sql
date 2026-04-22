-- Clean slate (optional, only if you want to reset on every restart)
-- DELETE FROM transactions;
-- DELETE FROM products;
-- DELETE FROM green_projects;
-- DELETE FROM users;

-- Products
INSERT INTO products (name, price, tax, image, category)
VALUES
('Smartphone Pro', 50000, 50, 'https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=1965&auto=format&fit=crop', 'Electronics'),
('Laptop Ultra', 80000, 150, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=2071&auto=format&fit=crop', 'Electronics'),
('Air Conditioner', 35000, 200, 'https://images.unsplash.com/photo-1627992499295-80271b531b69?q=80&w=1964&auto=format&fit=crop', 'Home Goods');

-- Green Projects
INSERT INTO green_projects (name, type, cost, description, progress, image)
VALUES
('Reforestation Drive', 'Reforestation', 500000, 'Planting 10,000 native trees.', 75, 'http://googleusercontent.com/file_content/1'),
('Solar Panels for Schools', 'Solar Energy', 800000, 'Providing clean energy to 20 schools.', 40, 'http://googleusercontent.com/file_content/2');

-- Users
INSERT INTO users (wallet_address, display_name)
VALUES
('0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2', 'Sample User 1'),
('0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db', 'Sample User 2');

-- Transactions (timestamp will be auto-set by @CreationTimestamp)
INSERT INTO transactions (tx_id, user_id, amount, product,transaction_timestamp)
VALUES
('0x123...abc', 1, 50, 'Smartphone Pro',NOW()),
('0x789...ghi', 2, 150, 'Laptop Ultra',NOW());
