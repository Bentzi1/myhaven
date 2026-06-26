-- Delete story-management rows with invalid actor ownership.
-- This supersedes the earlier normalization approach: if a row does not
-- belong to exactly one actor type, it is removed instead of reassigned.

SET @orphan_guest_session_id := CONVERT(
  '00000000-0000-4000-8000-000000000004'
  USING utf8mb4
) COLLATE utf8mb4_0900_ai_ci;

DELETE FROM story_hugs
WHERE (user_id IS NULL AND guest_session_id IS NULL)
   OR (user_id IS NOT NULL AND guest_session_id IS NOT NULL)
   OR guest_session_id = @orphan_guest_session_id;

DELETE FROM story_privacy_scans
WHERE (user_id IS NULL AND guest_session_id IS NULL)
   OR (user_id IS NOT NULL AND guest_session_id IS NOT NULL)
   OR guest_session_id = @orphan_guest_session_id;

DELETE FROM stories
WHERE (author_user_id IS NULL AND author_guest_session_id IS NULL)
   OR (author_user_id IS NOT NULL AND author_guest_session_id IS NOT NULL)
   OR author_guest_session_id = @orphan_guest_session_id;

DELETE FROM guest_sessions
WHERE id = @orphan_guest_session_id;
