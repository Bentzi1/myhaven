# Database Schema

This directory is the source of truth for backend-owned MySQL schema changes.

## Structure

- `migrations/`: Versioned SQL migrations applied in order.

## Current Status

- `001_initial_auth_schema.sql` defines the first authentication-focused schema:
  - registered users
  - linked OAuth providers
  - registered sessions
  - guest sessions
  - policy versions
  - policy acceptances

- `002_story_management_schema.sql` adds story-management data structures:
  - stories with registered or guest-session ownership
  - story privacy scan audit records
  - story revision history
  - story hugs
  - compatibility import from the legacy anonymous story schema when those older tables are present

Comment and unread-tracking tables remain deferred until those product rules are finalized.
