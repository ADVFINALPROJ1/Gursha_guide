# Deployment Notes

## Render Blueprint

This repo includes `render.yaml` for Render Blueprint deployment. Render Blueprints define services, databases, and environment variables in a YAML file at the repo root.

In Render:

1. Open the Render dashboard.
2. Create a new Blueprint.
3. Connect this GitHub repo.
4. Choose `render.yaml`.
5. Fill the prompted environment variables.

The Blueprint creates:

```bash
gursha-guide-api
gursha-guide
gursha-guide-db
```

Use these values when Render prompts for environment variables:

```bash
CLIENT_URL=https://your-frontend-render-url.onrender.com
VITE_API_BASE_URL=https://your-backend-render-url.onrender.com/api
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

The backend runs `backend/scripts/init-db.js` before deploys to apply `database/schema.sql`.

## Backend Environment Variables

Set these on the backend hosting provider:

```bash
PORT=5002
DATABASE_URL=postgresql://user:password@host:5432/gursha_guide?sslmode=require
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=https://your-frontend-domain.com
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Use the database URL from the production PostgreSQL provider. Do not commit real secrets.

## Image Uploads

Review and receipt image uploads use Cloudinary. Create a Cloudinary account, then set these backend environment variables:

```bash
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Uploaded review images are stored in the `gursha-guide/reviews` folder. Receipt images are stored in `gursha-guide/receipts`.

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

## Docker

For a local containerized setup, run:

```bash
cp .env.example .env
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

The Docker Compose database uses the local development values from `.env` and initializes from `database/schema.sql` on first startup. Do not commit real secrets in `.env`.

To recreate the database from scratch, run:

```bash
docker compose down -v
docker compose up --build
```
