-- Account preferences move from the preferences jsonb to one column each, so
-- the database default is the only default. A new preference is a new column
-- with a DEFAULT, which Postgres applies to existing rows.

ALTER TABLE user_settings
  ADD COLUMN show_word_translations boolean NOT NULL DEFAULT true;

UPDATE user_settings
SET show_word_translations = (preferences ->> 'showWordTranslations')::boolean
WHERE jsonb_typeof(preferences -> 'showWordTranslations') = 'boolean';

ALTER TABLE user_settings DROP COLUMN preferences;
