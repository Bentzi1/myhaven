-- Normalize ownership data for story-management records.
-- MySQL 8.4 does not allow CHECK constraints on columns used by foreign-key
-- referential actions, and this database user cannot create triggers while
-- binary logging requires elevated routine privileges. The application layer
-- enforces exactly-one actor writes; this migration repairs existing rows so
-- startup is not blocked by dirty legacy data.

SET @orphan_guest_session_id := '00000000-0000-4000-8000-000000000004';
SET @orphan_guest_session_token_hash := SHA2(
  CONCAT('system:story-orphan-actor:', @orphan_guest_session_id),
  256
);

INSERT INTO guest_sessions (
  id,
  session_token_hash,
  status,
  issued_at,
  expires_at,
  last_activity_at,
  revoked_at,
  ip_address,
  user_agent
)
SELECT
  @orphan_guest_session_id,
  @orphan_guest_session_token_hash,
  'expired',
  UTC_TIMESTAMP(),
  UTC_TIMESTAMP(),
  UTC_TIMESTAMP(),
  UTC_TIMESTAMP(),
  NULL,
  'story-actor-constraint-migration'
WHERE EXISTS (
  SELECT 1
  FROM stories
  WHERE author_user_id IS NULL
    AND author_guest_session_id IS NULL
)
OR EXISTS (
  SELECT 1
  FROM story_privacy_scans
  WHERE user_id IS NULL
    AND guest_session_id IS NULL
)
ON DUPLICATE KEY UPDATE
  status = 'expired',
  expires_at = UTC_TIMESTAMP(),
  revoked_at = UTC_TIMESTAMP();

UPDATE stories
SET author_guest_session_id = NULL
WHERE author_user_id IS NOT NULL
  AND author_guest_session_id IS NOT NULL;

UPDATE stories
SET author_guest_session_id = @orphan_guest_session_id
WHERE author_user_id IS NULL
  AND author_guest_session_id IS NULL;

DELETE sh
FROM story_hugs sh
INNER JOIN story_hugs keeper
  ON keeper.story_id = sh.story_id
 AND keeper.user_id = sh.user_id
 AND keeper.id < sh.id
WHERE sh.user_id IS NOT NULL
  AND sh.guest_session_id IS NOT NULL;

UPDATE story_hugs
SET guest_session_id = NULL
WHERE user_id IS NOT NULL
  AND guest_session_id IS NOT NULL;

DELETE FROM story_hugs
WHERE user_id IS NULL
  AND guest_session_id IS NULL;

UPDATE story_privacy_scans sps
INNER JOIN stories s ON s.id = sps.story_id
SET
  sps.user_id = s.author_user_id,
  sps.guest_session_id = s.author_guest_session_id
WHERE sps.user_id IS NULL
  AND sps.guest_session_id IS NULL;

UPDATE story_privacy_scans
SET guest_session_id = NULL
WHERE user_id IS NOT NULL
  AND guest_session_id IS NOT NULL;

UPDATE story_privacy_scans
SET guest_session_id = @orphan_guest_session_id
WHERE user_id IS NULL
  AND guest_session_id IS NULL;
