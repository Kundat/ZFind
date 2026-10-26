
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");

const opportunitiesRouter = require("./routes/opportunities");
const scamRouter = require("./routes/scam");

const app = express();

// Allow the frontend to connect using either local address.
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      process.env.FRONTEND_ORIGIN
    ].filter(Boolean)
  })
);

app.use(express.json({ limit: "100kb" }));

// API welcome route
app.get("/", (_req, res) => {
  res.json({
    name: "ZFind API",
    message: "Welcome to the ZFind API."
  });
});

// Check API and database connection
app.get("/api/health", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT DATABASE() AS database_name"
    );

    res.json({
      status: "success",
      message: "API and database connected.",
      database: rows[0].database_name
    });
  } catch (error) {
    console.error("Health check failed:", error.message);

    res.status(500).json({
      status: "error",
      message:
        "Database connection failed. Check backend/.env and that MySQL is running."
    });
  }
});

// API routes
app.use("/api/opportunities", opportunitiesRouter);
app.use("/api/scam", scamRouter);

// Handle unexpected errors
app.use((err, _req, res, _next) => {
  console.error("Server error:", err.message);

  res.status(500).json({
    error: "An unexpected server error occurred."
  });
});

// Start server
const PORT = Number(process.env.PORT || 5000);

app.listen(PORT, () => {
  console.log(`ZFind API running at http://localhost:${PORT}`);
});
