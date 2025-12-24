# GitHub Copilot / AI agent instructions for RhizaCore

Purpose: help AI agents be productive in this mixed React + SQL/migration repo.

- Quick overview: This repository contains a React/TSDX/Vite front-end (see `package.json`, `src/` and `index.html`) plus a large collection of raw SQL migration and repair scripts for the server/database layer (many `.sql` files at repo root). The DB side expects PostgreSQL (RLS is used extensively) and the frontend uses Vite (`npm run dev|dev:https`) for local development.

- Where to look first:
  - Frontend app and scripts: [package.json](package.json) — use `npm install`, `npm run dev` or `npm run dev:https` and `npm run build`.
  - Database layout and canonical schema: [schema.sql](schema.sql) and [complete_schema.sql](complete_schema.sql).
  - Migration guides and safety: `COMPLETE_MIGRATION_GUIDE.md`, `MIGRATION_SAFETY_GUIDE.md`, and `SPONSOR_GATE_GUIDE.md`.
  - Stepwise migrations: `step1_check_state.sql` → `step2_create_table.sql` → `step3_create_functions.sql` → `step4_add_indexes_policies.sql` → `step5_initialize_periods.sql` → `step6_final_test.sql`.

- High-level architecture notes (from repo patterns):
  - The repo is split into two main concerns: a client-side React SPA (Vite-based) and a set of server-side database migrations/scripts (Postgres SQL files). They are not integrated via a migration framework — migrations are plain `.sql` files intended to be inspected and applied manually or via a custom process.
  - Row Level Security (RLS) policies are present and fixed by multiple scripts (`fix_rls_policies.sql`, `simple_rls_fix.sql`, `emergency_rls_fix.sql`); be cautious when applying SQL changes — tests and safety guides exist.
  - Referral, rewards and mining subsystems are implemented in SQL (look for `daily_rewards`, `referral`, `free_mining` files and related MDs). These files contain business logic embedded as SQL functions and procedures.

- Developer workflows & commands (concrete):
  - Frontend dev: `npm install` then `npm run dev` (or `npm run dev:https` to use mkcert for HTTPS). See [README.md](README.md) for mkcert notes.
  - Build for production: `npm run build` then `npm run deploy` (deploy uses `gh-pages` as configured in `package.json`).
  - Linting: `npm run lint` and `npm run lint:fix`.
  - DB migrations: there is no single CLI; follow the guides (`COMPLETE_MIGRATION_GUIDE.md`) and apply the numbered steps in order. Prefer test/rollback SQL files first (e.g., `test_free_mining_migration.sql`, `rollback_free_mining_migration.sql`).

- Project-specific conventions and patterns (important for automated edits):
  - File naming: migration and fix scripts use clear prefixes: `add_`, `fix_`, `setup_`, `regenerate_`, `test_`, `safe_`, `rollback_` — preserve intent when refactoring or renaming.
  - Sequenced migrations: `step1_`–`step6_` represent an ordered deployment path. Do not reorder or merge without updating the migration guide and tests.
  - Safety-first files exist: check for `SAFE`/`safe_` and `rollback_` counterparts before modifying stateful migrations.
  - SQL functions store business logic: changes to data flows (reward calculation, referral tree) will live in SQL files (e.g., `daily_rewards_system.sql`, `earnings_calculator_test.js` for reference).

- Integration points & external dependencies to be aware of:
  - Supabase / Postgres: `@supabase/supabase-js` is in `package.json` and many SQL files target Postgres features (RLS, functions, triggers).
  - TON / blockchain tooling: many `@ton/*` and `ton` deps indicate TON integrations in the front-end.
  - Particle and third-party wallets: `@particle-network/*` and `@tonconnect` packages are present — front-end auth and wallet flows rely on these.

- How AI agents should operate in this repo (do / don't):
  - DO: Prefer small, focused changes; for DB edits, propose patch + SQL diff + an ordered deployment note referencing `stepX_*.sql` and `COMPLETE_MIGRATION_GUIDE.md`.
  - DO: When touching SQL migration logic, add a corresponding `test_*.sql` or update an existing test file and include rollback steps.
  - DO NOT: Apply global refactors across many SQL files or auto-format SQL without preserving intent and safety comments — these files often contain manual safety checks.
  - DO: Use `README.md`, `COMPLETE_MIGRATION_GUIDE.md`, and `MIGRATION_SAFETY_GUIDE.md` as canonical sources of intent before changing migration ordering.

- Examples of useful quick tasks for an AI agent:
  - Add a small helper SQL function and provide a `test_*.sql` demonstrating expected behavior; include rollback SQL.
  - Update front-end translation or config files and run `npm run dev` locally to verify startup.
  - Create a short script to apply a non-destructive read-only migration (SELECT checks) to validate assumptions before applying DML.

- Where to document further questions or run tests:
  - Frontend: run `npm run dev` and inspect console for runtime errors.
  - DB: the repo contains diagnostic SQL (`simple_diagnostic.sql`, `diagnose_table_structure.sql`) — use them to collect DB state before changing migrations.

If any section is unclear or you want more detail on the DB migration workflow or frontend build/deploy steps, tell me which area to expand and I will iterate.
