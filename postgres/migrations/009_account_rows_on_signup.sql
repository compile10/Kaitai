-- Every account has a user_settings row and an account_progress row from the
-- moment it is created, so reads never fall back to defaults. A trigger covers
-- every way an account is made (Better Auth signup and createUser,
-- scripts/seed-admin.mjs) and runs in the same transaction as the user insert.

CREATE FUNCTION create_account_rows() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO user_settings (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO account_progress (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER account_rows_on_user_insert
  AFTER INSERT ON "user"
  FOR EACH ROW EXECUTE FUNCTION create_account_rows();

-- Accounts created before this migration.
INSERT INTO user_settings (user_id)
SELECT id FROM "user"
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO account_progress (user_id)
SELECT id FROM "user"
ON CONFLICT (user_id) DO NOTHING;
