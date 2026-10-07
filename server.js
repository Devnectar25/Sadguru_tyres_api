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

// Middleware
app.use(cors());
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
      settings: "/api/settings"
    },
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "Sadguru Tyres API Server",
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use("/api/tyres", tyresRouter);
app.use("/api/brands", brandsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/quotes", quotesRouter);
app.use("/api/admin", authRouter);
app.use("/api/admin/subadmins", subadminsRouter);
app.use("/api/admin/errors", errorsRouter);
app.use("/api/admin/analytics", analyticsRouter);
app.use("/api/faqs", faqsRouter);
app.use("/api/services", servicesRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/admin/payments", paymentsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/admin/settings", settingsRouter);

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
