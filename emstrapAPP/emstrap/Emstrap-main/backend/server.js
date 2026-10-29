import dns from "node:dns";
import "dotenv/config";
import connectDB from "./src/config/db.js";
import app from "./app.js";
import http from "http";
import { initSocket } from "./src/sockets/socket.js";
import { ensureDefaultAdminUser } from "./src/utils/adminAuth.js";

console.log("SERVER STARTED FROM:", import.meta.url);
console.log("NODE_ENV =", process.env.NODE_ENV || "development");
console.log("EMAIL_USER =", process.env.EMAIL_USER ? process.env.EMAIL_USER : "(not set)");
console.log("EMAIL_PASS =", process.env.EMAIL_PASS ? "********" : "(not set)");

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (dnsErr) {
  console.warn("Custom DNS servers could not be set:", dnsErr.message);
}

const server = http.createServer(app);
initSocket(server);

// Bind to assigned port or default to 5000
let PORT = Number(process.env.PORT) || 5000;

const handleServerError = (error) => {
  if (error.code === "EADDRINUSE" && process.env.NODE_ENV !== "production") {
    console.warn(`⚠️ Port ${PORT} is busy. Trying ${PORT + 1}...`);
    PORT++;
    setTimeout(() => {
      server.listen(PORT);
    }, 1000);
  } else {
    console.error("❌ Server error:", error.message);
    process.exit(1);
  }
};

server.on("error", handleServerError);

const startServer = async () => {
  try {
    await connectDB();
    await ensureDefaultAdminUser();

    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});
