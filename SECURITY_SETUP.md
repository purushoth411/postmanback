# Security Configuration Guide

## Environment Variables Setup

Create a `.env` file in the root directory (`postmanback`) with the following variables:

```env
# Server Configuration
PORT=5500
NODE_ENV=development

# Frontend URL (for CORS) - Update this to your production frontend URL
FRONTEND_URL=http://localhost:5173

# Database Configuration
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=your_database_password
DB_NAME=postman
DB_TIMEZONE=Asia/Kolkata

# Session Secret (IMPORTANT: Change this in production!)
# Generate a strong random string using:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=your-secret-key-change-this-in-production-use-a-random-string
```

## Important Security Notes

1. **Never commit `.env` file to version control** - It contains sensitive information
2. **Change SESSION_SECRET** - Generate a strong random string for production
3. **Update FRONTEND_URL** - Set this to your production frontend URL when deploying
4. **Use strong database passwords** - Don't use empty passwords in production
5. **Set NODE_ENV=production** - When deploying to production

## Security Features Implemented

✅ Session-based authentication (no JWT)
✅ Password hashing with bcrypt
✅ Rate limiting (prevents brute force attacks)
✅ CORS protection (allows only your frontend)
✅ Security headers (XSS, CSRF protection)
✅ Protected API routes (authentication required)
✅ Database credentials in environment variables

## CORS Configuration

**Important:** CORS only affects browser requests. It will NOT block API testing in your Postman clone. The CORS configuration allows your frontend to make requests, but doesn't interfere with the actual API testing functionality.

## Frontend Updates Needed

You'll need to update your frontend to:
1. Send credentials with fetch requests: `fetch(url, { credentials: 'include' })` ✅ **DONE**
2. Handle session-based authentication ✅ **DONE**
3. Call `/api/users/logout` when logging out ✅ **DONE**

## SQL Injection & XSS Protection

### SQL Injection Protection ✅
- **Parameterized Queries**: All database queries use parameterized statements (`?` placeholders)
- **Input Validation**: Express-validator checks input types and formats
- **Input Sanitization**: Removes dangerous characters and scripts

### XSS (Cross-Site Scripting) Protection ✅
- **Input Sanitization**: Automatically removes `<script>` tags and `javascript:` protocols
- **Helmet.js**: Sets security headers to prevent XSS attacks
- **Content Security Policy**: Configured to block inline scripts
- **Cookie Security**: HttpOnly cookies prevent JavaScript access to session cookies

### How It Works
1. **Input Sanitization Middleware**: Runs on every request, cleaning user input
2. **Validation Middleware**: Validates data types, lengths, and formats before processing
3. **Parameterized Queries**: MySQL driver uses prepared statements (already implemented in your models)

### Important Note
Since this is a Postman clone, we allow most characters in API request bodies (URLs, headers, etc.) to enable testing various APIs. However:
- User-facing fields (names, emails) are strictly validated
- Script tags and event handlers are removed
- Database queries use parameterized statements (safe from SQL injection)

