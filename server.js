import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import tyresRouter from "./routes/tyres.js";
import brandsRouter from "./routes/brands.js";
import bookingsRouter from "./routes/bookings.js";
import quotesRouter from "./routes/quotes.js";
import authRouter from "./routes/auth.js";
import subadminsRouter from "./routes/subadmins.js";
import errorsRouter from "./routes/errors.js";
import analyticsRouter from "./routes/analytics.js";
import faqsRouter from "./routes/faqs.js";
import servicesRouter from "./routes/services.js";
import leadsRouter from "./routes/leads.js";
import paymentsRouter from "./routes/payments.js";
import settingsRouter from "./routes/settings.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

import { supabase } from "./config/supabase.js";

// Middleware - permissive CORS for production & deployment environments
app.use(cors({
  origin: true, // Allow any requesting origin
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Root Welcome Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Sadguru Tyres & Mobility Solutions - Backend API Server is running",
    status: "healthy",
    endpoints: {
      health: "/api/health",
      tyres: "/api/tyres",
      brands: "/api/brands",
      services: "/api/services",
      bookings: "/api/bookings",
      leads: "/api/leads",
      quotes: "/api/quotes",
      settings: "/api/settings"
    },
    timestamp: new Date().toISOString()
  });
});

// Health check with live Supabase Database verification
app.get(["/api/health", "/health"], async (req, res) => {
  let dbStatus = "Unknown";
  let dbError = null;

  try {
    const { data, error } = await supabase.from("service_bookings").select("id").limit(1);
    if (error) {
      dbStatus = "Database Query Error: " + error.message;
      dbError = error.message;
    } else {
      dbStatus = "Connected (Supabase OK)";
    }
  } catch (err) {
    dbStatus = "Database Connection Failed";
    dbError = err.message;
  }

  res.json({
    status: "OK",
    service: "Sadguru Tyres API Server",
    database: dbStatus,
    dbError,
    timestamp: new Date().toISOString(),
  });
});

// Helper to mount routers under both /api/... and root /... for flexibility
const mountRouters = (prefix = "") => {
  app.use(`${prefix}/tyres`, tyresRouter);
  app.use(`${prefix}/brands`, brandsRouter);
  app.use(`${prefix}/bookings`, bookingsRouter);
  app.use(`${prefix}/quotes`, quotesRouter);
  app.use(`${prefix}/admin`, authRouter);
  app.use(`${prefix}/admin/subadmins`, subadminsRouter);
  app.use(`${prefix}/admin/errors`, errorsRouter);
  app.use(`${prefix}/admin/analytics`, analyticsRouter);
  app.use(`${prefix}/faqs`, faqsRouter);
  app.use(`${prefix}/services`, servicesRouter);
  app.use(`${prefix}/leads`, leadsRouter);
  app.use(`${prefix}/admin/payments`, paymentsRouter);
  app.use(`${prefix}/settings`, settingsRouter);
  app.use(`${prefix}/admin/settings`, settingsRouter);
};

// Mount under both standard /api and direct root
mountRouters("/api");
mountRouters("");

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `API Route not found: ${req.method} ${req.url}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled API Error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

// Start Server with Automatic Port Fallback (in local development)
const startServer = (portToTry) => {
  const server = app.listen(portToTry, () => {
    console.log(`=======================================================`);
    console.log(`🚀 SADGURU TYRES BACKEND API RUNNING ON PORT ${portToTry}`);
    console.log(`🌐 Base URL: http://localhost:${portToTry}/api`);
    console.log(`=======================================================`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`⚠️ Port ${portToTry} is in use. Trying port ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error("Server error:", err);
    }
  });
};

if (!process.env.VERCEL) {
  startServer(Number(PORT));
}

export default app;
