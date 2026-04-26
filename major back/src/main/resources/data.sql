-- Products (Using PostgreSQL safe inserts)
INSERT INTO products (id, name, price, tax, image, category)
VALUES
(1, 'Smartphone Pro', 50000, 50, 'https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=1965&auto=format&fit=crop', 'Electronics'),
(2, 'Laptop Ultra', 80000, 150, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=2071&auto=format&fit=crop', 'Electronics'),
(3, 'Air Conditioner', 35000, 200, 'https://images.unsplash.com/photo-1627992499295-80271b531b69?q=80&w=1964&auto=format&fit=crop', 'Home Goods')
ON CONFLICT (id) DO NOTHING;

-- Green Projects
INSERT INTO green_projects (id, name, type, cost, description, progress, image, location)
VALUES
(1, 'Reforestation Drive', 'Reforestation', 500000, 'Planting 10,000 native trees.', 75, 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=2026', 'Karnataka, India'),
(2, 'Solar Panels for Schools', 'Solar Energy', 800000, 'Providing clean energy to 20 schools.', 40, 'https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?auto=format&fit=crop&q=80&w=2070', 'Rajasthan, India')
ON CONFLICT (id) DO NOTHING;

-- Users
INSERT INTO users (id, wallet_address, display_name)
VALUES
(1, '0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2', 'Sample User 1'),
(2, '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db', 'Sample User 2')
ON CONFLICT (id) DO NOTHING;

-- Transactions
INSERT INTO transactions (id, tx_id, user_id, amount, product, transaction_timestamp)
VALUES
(1, '0x123...abc', 1, 50, 'Smartphone Pro', NOW()),
(2, '0x789...ghi', 2, 150, 'Laptop Ultra', NOW())
ON CONFLICT (id) DO NOTHING;
