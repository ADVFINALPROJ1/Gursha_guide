ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);

ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);

-- Example test data:
-- UPDATE restaurants
-- SET latitude = 9.0300, longitude = 38.7400
-- WHERE id = 1;

-- UPDATE restaurants
-- SET latitude = 9.0100, longitude = 38.7600
-- WHERE id = 2;

-- UPDATE restaurants
-- SET latitude = 9.0200, longitude = 38.7500
-- WHERE id = 3;
