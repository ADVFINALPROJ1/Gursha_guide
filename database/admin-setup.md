# Admin Setup

The app only shows restaurant management links to users with `role = 'admin'`.

First, register a normal user through the app. Then promote that user by phone number.

## Docker Local Setup

Replace `YOUR_PHONE_NUMBER` with the phone number used during registration:

```bash
docker compose exec db psql -U postgres -d gursha_guide -c "UPDATE users SET role = 'admin' WHERE phone_number = 'YOUR_PHONE_NUMBER';"
```

Confirm the user is now an admin:

```bash
docker compose exec db psql -U postgres -d gursha_guide -c "SELECT id, full_name, phone_number, role FROM users;"
```

Log out of the app, then log back in. The admin navigation links should appear.

## Production Setup

Use the production database URL from the hosting provider:

```bash
psql "$DATABASE_URL" -c "UPDATE users SET role = 'admin' WHERE phone_number = 'YOUR_PHONE_NUMBER';"
```

Confirm the role:

```bash
psql "$DATABASE_URL" -c "SELECT id, full_name, phone_number, role FROM users;"
```

Do not commit production database URLs or secrets.
