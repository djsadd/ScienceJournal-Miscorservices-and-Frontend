ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS reviewer_science_fields TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS reviewer_science_other VARCHAR;
