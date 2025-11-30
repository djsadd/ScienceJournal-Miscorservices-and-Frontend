-- Migration: add membership flags for council and collegium
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_council_member BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_collegium_member BOOLEAN DEFAULT FALSE;

UPDATE user_profiles SET is_council_member = FALSE WHERE is_council_member IS NULL;
UPDATE user_profiles SET is_collegium_member = FALSE WHERE is_collegium_member IS NULL;

ALTER TABLE user_profiles ALTER COLUMN is_council_member SET NOT NULL;
ALTER TABLE user_profiles ALTER COLUMN is_collegium_member SET NOT NULL;
