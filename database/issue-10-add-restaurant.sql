-- Issue 10 does not require a restaurants table schema change.
-- The restaurants table should already include:
-- id, name, location, description, image_url, created_at

-- Optional local setup: after creating or registering an admin user,
-- promote that user so they can access the add restaurant page.
UPDATE users
SET role = 'admin'
WHERE phone_number = '0911223344';
