// index.js - Updated main server file
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Route imports
import productRouter from "./routes/product.route.js";
import customerRouter from "./routes/customer.route.js";
import orderRouter from "./routes/order.route.js";
import webhookRouter from "./routes/webhook.route.js";
import analyticsRouter from "./routes/analytics.route.js";
import authRouter from "./routes/auth.route.js";

// // Middleware imports
// import { authMiddleware } from "./middleware/auth.middleware.js";
import { tenantMiddleware } from "./middleware/tenant.middleware.js";

// Scheduler import
import DataSyncScheduler from "./scheduler/dataSync.js";

const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3001", "http://localhost:5174"],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Basic route
app.get("/", (req, res) => {
  res.json({
    message: "Xeno FDE Internship Assignment - Shopify Data Ingestion & Insights Service",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      products: "/api/product",
      customers: "/api/customer",
      orders: "/api/order",
      analytics: "/api/analytics",
      webhooks: "/webhooks"
    }
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use("/api/auth", authRouter);

// Protected routes (require authentication and tenant context)
app.use("/api/product",  tenantMiddleware, productRouter);
app.use("/api/customer" , tenantMiddleware, customerRouter);
app.use("/api/order",  tenantMiddleware, orderRouter);
app.use("/api/analytics", tenantMiddleware, analyticsRouter);

// Webhook routes (no auth required, but include tenant context)
app.use("/webhooks", webhookRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
  
  res.status(500).json({
    error: "Internal server error",
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard available at: http://localhost:${PORT}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🪝 Webhooks URL: http://localhost:${PORT}/webhooks`);
  
  // Start the data sync scheduler
  DataSyncScheduler.start();
  console.log("⏰ Data sync scheduler started");
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});