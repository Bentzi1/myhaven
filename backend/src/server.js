const express = require("express");
const cors = require("cors");
const { checkDatabaseConnection } = require("./db");

const app = express();
const port = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173"
  })
);
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "backend"
  });
});

app.get("/api/health/db", async (_request, response) => {
  try {
    await checkDatabaseConnection();

    response.json({
      status: "ok",
      service: "backend",
      database: "mysql"
    });
  } catch (error) {
    response.status(503).json({
      status: "error",
      service: "backend",
      database: "mysql",
      message: error.message
    });
  }
});

app.get("/api/message", (_request, response) => {
  response.json({
    message: "Hola pelotudo, Hello from the Node backend"
  });
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
