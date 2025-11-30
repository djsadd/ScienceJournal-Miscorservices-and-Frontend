-- Initial schema for user profile service
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    full_name VARCHAR NOT NULL,
    phone VARCHAR,
    organization VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    preferred_language VARCHAR(8) NOT NULL DEFAULT 'en',
    roles TEXT[] DEFAULT ARRAY['author']
);

CREATE TABLE IF NOT EXISTS user_articles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES user_profiles(id) ON DELETE CASCADE,
    article_id INTEGER NOT NULL,
    role VARCHAR DEFAULT 'author'
);

CREATE TABLE IF NOT EXISTS user_reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES user_profiles(id) ON DELETE CASCADE,
    review_id INTEGER NOT NULL
);
