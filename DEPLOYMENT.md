# Deployment Notes

## Backend Environment Variables

Set these on the backend hosting provider:

```bash
PORT=5002
DATABASE_URL=postgresql://user:password@host:5432/gursha_guide?sslmode=require
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=https://your-frontend-domain.com
```

Use the database URL from the production PostgreSQL provider. Do not commit real secrets.

## Frontend Environment Variables

Set this on the frontend hosting provider:

```bash
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

For local development, copy `frontend/.env.example` to `frontend/.env` and keep the localhost value.

## Database

For a fresh PostgreSQL database, run:

```bash
psql "$DATABASE_URL" -f database/schema.sql
```

The files in `database/issue-*.sql` are incremental scripts for older databases.

## First Admin User

Register a user through the app first, then promote that user in the database.

For Docker local setup:

```bash
docker compose exec db psql -U postgres -d gursha_guide -c "UPDATE users SET role = 'admin' WHERE phone_number = 'YOUR_PHONE_NUMBER';"
```

For production:

```bash
psql "$DATABASE_URL" -c "UPDATE users SET role = 'admin' WHERE phone_number = 'YOUR_PHONE_NUMBER';"
```

See `database/admin-setup.md` for the full admin setup flow.

## Docker

For a local containerized setup, run:

```bash
docker compose up --build
```

The app will be available at:

```bash
http://localhost:8080
```

The backend API is available at:

```bash
http://localhost:5002
```

The Docker Compose database uses local development credentials and initializes from `database/schema.sql` on first startup. To recreate the database from scratch, remove the `postgres_data` volume before starting again.
