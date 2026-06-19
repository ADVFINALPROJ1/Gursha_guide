-- Run this only if reviews.rating is currently an integer column.
-- It allows ratings like 4.7 while keeping values between 1 and 5.

ALTER TABLE reviews
ALTER COLUMN rating TYPE NUMERIC(2,1)
USING rating::numeric(2,1);

ALTER TABLE reviews
DROP CONSTRAINT IF EXISTS reviews_rating_check;

ALTER TABLE reviews
ADD CONSTRAINT reviews_rating_check
CHECK (rating >= 1 AND rating <= 5);
