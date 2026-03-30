-- Story management schema for MyHaven.
-- This migration covers:
-- - story ownership
-- - publish-state storage
-- - privacy scan audit records
-- - hug reactions
-- - revision history for edit and moderation traceability
-- - compatibility import for the legacy anonymous stories schema

SET @legacy_stories_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'stories'
    AND column_name = 'author_token'
);

SET @legacy_story_hugs_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'story_hugs'
    AND column_name = 'hugger_token'
);

SET @legacy_stories_backup_exists := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'legacy_stories_002'
);

SET @legacy_story_hugs_backup_exists := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'legacy_story_hugs_002'
);

SET @sql := IF(
  @legacy_story_hugs_exists = 1 AND @legacy_story_hugs_backup_exists = 0,
  'RENAME TABLE story_hugs TO legacy_story_hugs_002',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  @legacy_stories_exists = 1 AND @legacy_stories_backup_exists = 0,
  'RENAME TABLE stories TO legacy_stories_002',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @legacy_stories_backup_exists := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'legacy_stories_002'
);

SET @legacy_story_hugs_backup_exists := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'legacy_story_hugs_002'
);

CREATE TABLE IF NOT EXISTS stories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  legacy_story_id INT UNSIGNED NULL,
  author_user_id BIGINT UNSIGNED NULL,
  author_guest_session_id CHAR(36) NULL,
  title VARCHAR(160) NOT NULL,
  tag_label VARCHAR(64) NULL,
  body TEXT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'published',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  hidden_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_stories_legacy_story_id (legacy_story_id),
  KEY idx_stories_author_user_status_published_at (
    author_user_id,
    status,
    published_at
  ),
  KEY idx_stories_author_guest_status_published_at (
    author_guest_session_id,
    status,
    published_at
  ),
  KEY idx_stories_status_published_at (status, published_at),
  CONSTRAINT fk_stories_author_user_id
    FOREIGN KEY (author_user_id) REFERENCES users (id)
      ON DELETE CASCADE
      ON UPDATE CASCADE,
  CONSTRAINT fk_stories_author_guest_session_id
    FOREIGN KEY (author_guest_session_id) REFERENCES guest_sessions (id)
      ON DELETE CASCADE
      ON UPDATE CASCADE,
  CONSTRAINT chk_stories_status
    CHECK (status IN ('published', 'deleted', 'hidden', 'flagged'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS story_privacy_scans (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  story_id BIGINT UNSIGNED NULL,
  user_id BIGINT UNSIGNED NULL,
  guest_session_id CHAR(36) NULL,
  result_status VARCHAR(16) NOT NULL,
  summary TEXT NULL,
  findings_json JSON NULL,
  scanned_text_checksum CHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_story_privacy_scans_story_id_created_at (story_id, created_at),
  KEY idx_story_privacy_scans_user_id_created_at (user_id, created_at),
  KEY idx_story_privacy_scans_guest_session_id_created_at (
    guest_session_id,
    created_at
  ),
  CONSTRAINT fk_story_privacy_scans_story_id
    FOREIGN KEY (story_id) REFERENCES stories (id)
      ON DELETE SET NULL
      ON UPDATE CASCADE,
  CONSTRAINT fk_story_privacy_scans_user_id
    FOREIGN KEY (user_id) REFERENCES users (id)
      ON DELETE CASCADE
      ON UPDATE CASCADE,
  CONSTRAINT fk_story_privacy_scans_guest_session_id
    FOREIGN KEY (guest_session_id) REFERENCES guest_sessions (id)
      ON DELETE CASCADE
      ON UPDATE CASCADE,
  CONSTRAINT chk_story_privacy_scans_result_status
    CHECK (result_status IN ('pass', 'warning', 'block'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS story_revisions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  story_id BIGINT UNSIGNED NOT NULL,
  revision_number INT UNSIGNED NOT NULL,
  title VARCHAR(160) NOT NULL,
  tag_label VARCHAR(64) NULL,
  body TEXT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'published',
  privacy_scan_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_story_revisions_story_revision (story_id, revision_number),
  KEY idx_story_revisions_story_id_created_at (story_id, created_at),
  KEY idx_story_revisions_privacy_scan_id (privacy_scan_id),
  CONSTRAINT fk_story_revisions_story_id
    FOREIGN KEY (story_id) REFERENCES stories (id)
      ON DELETE CASCADE
      ON UPDATE CASCADE,
  CONSTRAINT fk_story_revisions_privacy_scan_id
    FOREIGN KEY (privacy_scan_id) REFERENCES story_privacy_scans (id)
      ON DELETE SET NULL
      ON UPDATE CASCADE,
  CONSTRAINT chk_story_revisions_status
    CHECK (status IN ('published', 'deleted', 'hidden', 'flagged'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS story_hugs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  story_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  guest_session_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_story_hugs_story_user (story_id, user_id),
  UNIQUE KEY uq_story_hugs_story_guest_session (story_id, guest_session_id),
  KEY idx_story_hugs_story_id (story_id),
  KEY idx_story_hugs_user_id (user_id),
  KEY idx_story_hugs_guest_session_id (guest_session_id),
  CONSTRAINT fk_story_hugs_story_id
    FOREIGN KEY (story_id) REFERENCES stories (id)
      ON DELETE CASCADE
      ON UPDATE CASCADE,
  CONSTRAINT fk_story_hugs_user_id
    FOREIGN KEY (user_id) REFERENCES users (id)
      ON DELETE CASCADE
      ON UPDATE CASCADE,
  CONSTRAINT fk_story_hugs_guest_session_id
    FOREIGN KEY (guest_session_id) REFERENCES guest_sessions (id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TEMPORARY TABLE IF NOT EXISTS legacy_guest_sessions_002 (
  legacy_token VARCHAR(64) NOT NULL,
  guest_session_id CHAR(36) NOT NULL,
  first_seen_at DATETIME NOT NULL,
  PRIMARY KEY (legacy_token),
  UNIQUE KEY uq_legacy_guest_sessions_002_id (guest_session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET @sql := IF(
  @legacy_stories_backup_exists = 1,
  'INSERT INTO legacy_guest_sessions_002 (
      legacy_token,
      guest_session_id,
      first_seen_at
    )
    SELECT
      author_token,
      UUID(),
      MIN(created_at)
    FROM legacy_stories_002
    GROUP BY author_token
    ON DUPLICATE KEY UPDATE
      first_seen_at = LEAST(first_seen_at, VALUES(first_seen_at))',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  @legacy_story_hugs_backup_exists = 1,
  'INSERT INTO legacy_guest_sessions_002 (
      legacy_token,
      guest_session_id,
      first_seen_at
    )
    SELECT
      hugger_token,
      UUID(),
      MIN(created_at)
    FROM legacy_story_hugs_002
    GROUP BY hugger_token
    ON DUPLICATE KEY UPDATE
      first_seen_at = LEAST(first_seen_at, VALUES(first_seen_at))',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @legacy_import_exists := IF(
  @legacy_stories_backup_exists = 1 OR @legacy_story_hugs_backup_exists = 1,
  1,
  0
);

SET @sql := IF(
  @legacy_import_exists = 1,
  'INSERT INTO guest_sessions (
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
      lgs.guest_session_id,
      SHA2(CONCAT(''legacy-story-session:'', lgs.legacy_token), 256),
      ''expired'',
      lgs.first_seen_at,
      lgs.first_seen_at,
      lgs.first_seen_at,
      lgs.first_seen_at,
      NULL,
      ''legacy-story-import''
    FROM legacy_guest_sessions_002 lgs
    LEFT JOIN guest_sessions gs ON gs.id = lgs.guest_session_id
    WHERE gs.id IS NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  @legacy_stories_backup_exists = 1,
  'INSERT INTO stories (
      legacy_story_id,
      author_user_id,
      author_guest_session_id,
      title,
      tag_label,
      body,
      status,
      created_at,
      updated_at,
      published_at,
      deleted_at,
      hidden_at
    )
    SELECT
      ls.id,
      NULL,
      lgs.guest_session_id,
      CASE
        WHEN CHAR_LENGTH(TRIM(REPLACE(REPLACE(ls.content, CHAR(13), '' ''), CHAR(10), '' ''))) > 0
          THEN LEFT(TRIM(REPLACE(REPLACE(ls.content, CHAR(13), '' ''), CHAR(10), '' '')), 160)
        ELSE CONCAT(''Imported story #'', ls.id)
      END,
      ''#reflections'',
      ls.content,
      CASE
        WHEN ls.deleted_at IS NOT NULL THEN ''deleted''
        WHEN ls.status = ''published'' THEN ''published''
        ELSE ''hidden''
      END,
      ls.created_at,
      COALESCE(ls.deleted_at, ls.created_at),
      ls.created_at,
      ls.deleted_at,
      NULL
    FROM legacy_stories_002 ls
    INNER JOIN legacy_guest_sessions_002 lgs ON lgs.legacy_token = ls.author_token
    LEFT JOIN stories s ON s.legacy_story_id = ls.id
    WHERE s.id IS NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  @legacy_story_hugs_backup_exists = 1,
  'INSERT INTO story_hugs (
      story_id,
      user_id,
      guest_session_id,
      created_at
    )
    SELECT
      s.id,
      NULL,
      lgs.guest_session_id,
      lsh.created_at
    FROM legacy_story_hugs_002 lsh
    INNER JOIN stories s ON s.legacy_story_id = lsh.story_id
    INNER JOIN legacy_guest_sessions_002 lgs ON lgs.legacy_token = lsh.hugger_token
    LEFT JOIN story_hugs sh
      ON sh.story_id = s.id
     AND sh.guest_session_id = lgs.guest_session_id
    WHERE sh.id IS NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  @legacy_stories_backup_exists = 1,
  'INSERT INTO story_revisions (
      story_id,
      revision_number,
      title,
      tag_label,
      body,
      status,
      privacy_scan_id,
      created_at
    )
    SELECT
      s.id,
      1,
      s.title,
      s.tag_label,
      s.body,
      s.status,
      NULL,
      s.created_at
    FROM stories s
    LEFT JOIN story_revisions sr
      ON sr.story_id = s.id
     AND sr.revision_number = 1
    WHERE s.legacy_story_id IS NOT NULL
      AND sr.id IS NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

DROP TEMPORARY TABLE IF EXISTS legacy_guest_sessions_002;
