# Session Table Information

## ✅ Automatic Table Creation

**Good news!** You **DO NOT** need to manually create the session table. 

The `express-mysql-session` package automatically creates a table called `sessions` in your database when the server starts for the first time.

## How It Works

1. When your server starts, `express-mysql-session` checks if the `sessions` table exists
2. If it doesn't exist, it automatically creates it with the following structure:
   - `session_id` (VARCHAR) - Primary key
   - `expires` (BIGINT) - Expiration timestamp
   - `data` (TEXT) - Session data (stored as JSON)

## What You Need to Do

**Nothing!** Just make sure:
1. Your database connection is configured correctly in `.env`
2. The database user has CREATE TABLE permissions
3. The database specified in `DB_NAME` exists

## Verify It's Working

After starting your server, you can check if the table was created:

```sql
SHOW TABLES LIKE 'sessions';
```

Or check the table structure:

```sql
DESCRIBE sessions;
```

## Session Storage Location

Sessions are stored in your MySQL database (`postman` database by default) in a table called `sessions`. This means:
- ✅ Sessions persist across server restarts
- ✅ Sessions are shared if you run multiple server instances
- ✅ Sessions are secure (stored server-side, not in cookies)
- ✅ Sessions automatically expire (cleaned up by the package)

## Manual Cleanup (Optional)

The package automatically cleans up expired sessions, but if you want to manually clean them:

```sql
DELETE FROM sessions WHERE expires < UNIX_TIMESTAMP(NOW()) * 1000;
```

## Troubleshooting

If sessions aren't working:
1. Check database connection in `.env`
2. Verify database user has CREATE TABLE permissions
3. Check server logs for any errors
4. Ensure the database exists

