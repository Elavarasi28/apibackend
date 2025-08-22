import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI!);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};
const allowedOrigins = [
  "http://localhost:3000",   // React default
  /^http:\/\/localhost:\d+$/, // ✅ any localhost port (5173, 5177, etc.)
  process.env.FRONTEND_URL   // ✅ production URL from .env
];


// ✅ Connect to database
connectDB();

// ✅ Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow mobile apps / curl

    // Check against allowed origins
    if (
      allowedOrigins.includes(origin) ||
      allowedOrigins.some(o => o instanceof RegExp && o.test(origin))
    ) {
      callback(null, true);
    } else {
      callback(new Error(`❌ CORS blocked: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ✅ Basic test route
app.get("/", (req, res) => {
  res.json({ 
    message: "✅ Backend is running 🚀",
    timestamp: new Date().toISOString()
  });
});

// ✅ Health check route
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK",
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    timestamp: new Date().toISOString()
  });
});

// ✅ Import and use auth routes (we'll create this separately)
import authRoutes from "./routes/authRoutes";
app.use("/api/auth", authRoutes);

// ✅ 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ 
    message: `Route ${req.originalUrl} not found` 
  });
});

// ✅ Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("❌ Error:", err.message);
  res.status(500).json({ 
    message: "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ✅ Start server with error handling
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ Port ${PORT} is already in use!`);
    console.log(`💡 Solutions:`);
    console.log(`   1. Kill the process using port ${PORT}`);
    console.log(`   2. Use a different port in your .env file`);
    console.log(`   3. Run: netstat -ano | findstr :${PORT} to find the process`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});