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

Story, comment, and unread-tracking tables should be added in later migrations once their product rules are finalized.
