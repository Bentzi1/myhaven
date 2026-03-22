-- Initial authentication schema for MyHaven.
-- This migration covers:
-- - registered users
-- - linked OAuth providers
-- - registered sessions
-- - guest sessions
-- - policy versions
-- - policy acceptances

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NULL,
  signup_method VARCHAR(32) NOT NULL,
  email_verified_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  CONSTRAINT chk_users_signup_method
    CHECK (signup_method IN ('manual', 'google'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS auth_providers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  provider_name VARCHAR(32) NOT NULL,
  provider_user_id VARCHAR(191) NOT NULL,
  provider_email VARCHAR(255) NULL,
  provider_email_verified TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_auth_providers_identity (provider_name, provider_user_id),
  KEY idx_auth_providers_user_id (user_id),
  CONSTRAINT fk_auth_providers_user_id
    FOREIGN KEY (user_id) REFERENCES users (id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sessions (
  id CHAR(36) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  session_token_hash CHAR(64) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  last_activity_at DATETIME NULL,
  revoked_at DATETIME NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(512) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sessions_token_hash (session_token_hash),
  KEY idx_sessions_user_id (user_id),
  KEY idx_sessions_status_expires_at (status, expires_at),
  CONSTRAINT fk_sessions_user_id
    FOREIGN KEY (user_id) REFERENCES users (id)
      ON DELETE CASCADE
      ON UPDATE CASCADE,
  CONSTRAINT chk_sessions_status
    CHECK (status IN ('active', 'revoked', 'expired'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS guest_sessions (
  id CHAR(36) NOT NULL,
  session_token_hash CHAR(64) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  last_activity_at DATETIME NULL,
  revoked_at DATETIME NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(512) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_guest_sessions_token_hash (session_token_hash),
  KEY idx_guest_sessions_status_expires_at (status, expires_at),
  CONSTRAINT chk_guest_sessions_status
    CHECK (status IN ('active', 'revoked', 'expired'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS policy_versions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  version_label VARCHAR(64) NOT NULL,
  tos_checksum CHAR(64) NOT NULL,
  privacy_checksum CHAR(64) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_policy_versions_version_label (version_label)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS policy_acceptances (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  policy_version_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  guest_session_id CHAR(36) NULL,
  accepted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_policy_acceptances_user_version (policy_version_id, user_id),
  UNIQUE KEY uq_policy_acceptances_guest_version (policy_version_id, guest_session_id),
  KEY idx_policy_acceptances_user_id (user_id),
  KEY idx_policy_acceptances_guest_session_id (guest_session_id),
  CONSTRAINT fk_policy_acceptances_policy_version_id
    FOREIGN KEY (policy_version_id) REFERENCES policy_versions (id)
      ON DELETE CASCADE
      ON UPDATE CASCADE,
  CONSTRAINT fk_policy_acceptances_user_id
    FOREIGN KEY (user_id) REFERENCES users (id)
      ON DELETE CASCADE
      ON UPDATE CASCADE,
  CONSTRAINT fk_policy_acceptances_guest_session_id
    FOREIGN KEY (guest_session_id) REFERENCES guest_sessions (id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
