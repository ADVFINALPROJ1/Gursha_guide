ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS upvotes INT DEFAULT 0;

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS downvotes INT DEFAULT 0;

CREATE TABLE IF NOT EXISTS review_votes (
  id SERIAL PRIMARY KEY,
  review_id INT REFERENCES reviews(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (review_id, user_id)
);
