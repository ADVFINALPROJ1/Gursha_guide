# Database Setup

For a fresh local PostgreSQL database, create the database first:

```bash
createdb gursha_guide
```

Then run the current schema:

```bash
psql -U postgres -d gursha_guide -f database/schema.sql
```

The other SQL files in this folder are incremental scripts for older local databases. They assume the base `users`, `restaurants`, and `reviews` tables already exist.

If you already have an older database, run only the incremental files that match the missing feature columns/tables.
