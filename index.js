require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const socket = require("./socket");
const cors = require("cors");
const db = require("./config/db");
const logger = require("./logger");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
app.use(bodyParser.json());
const server = http.createServer(app);

const io = socket.init(server);

// Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow Socket.IO
}));

// CORS Configuration - Allow your frontend origin
// This won't block API testing in your Postman clone
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173", // Your React app URL
  credentials: true, // Allow cookies/sessions
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Session Configuration
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "postman",
  clearExpired: true,
  checkExpirationInterval: 900000, // 15 minutes
  expiration: 86400000, // 24 hours
});

app.use(
  session({
    key: "session_cookie_name",
    secret: process.env.SESSION_SECRET || "your-secret-key-change-this-in-production",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 86400000, // 24 hours
      httpOnly: true, // Prevents XSS attacks
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "lax", // CSRF protection
    },
  })
);

// Rate Limiting - Prevent brute force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: { status: false, message: "Too many login attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: { status: false, message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Input sanitization middleware (prevents XSS and basic injection attempts)
const sanitizeInput = require('./middleware/sanitize');
app.use(sanitizeInput);



const userRoutes = require('./routes/userRoutes');

const apiRoutes = require('./routes/apiRoutes');
const authMiddleware = require('./middleware/auth');

// Public routes (no authentication required)
app.use('/api/users', loginLimiter, userRoutes); // Rate limit login attempts

// Protected routes (authentication required)

app.use('/api/api', apiLimiter, authMiddleware, apiRoutes);



// Global Handlers
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1); // Optional: shutdown
});



const PORT = process.env.PORT || 5500;

server.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`)
     logger.info(`Server running on port ${PORT}`);
})

