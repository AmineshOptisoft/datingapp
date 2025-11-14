import next from "next";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const port = parseInt(process.env.PORT || "3000");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

async function main() {
  await app.prepare();

  // Create HTTP server for Next.js and Socket.io
  const server = http.createServer(async (req, res) => {
    await handle(req, res);
  });

  // Create Socket.io server
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Socket.io authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: Token required"));
    }
    try {
      const payload: any = jwt.verify(token, JWT_SECRET);
      socket.data.userId = payload.userId;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // Socket.io connection and event handlers
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.data.userId}`);

    // Join personal room
    socket.join(socket.data.userId);

    // Handle send message
    socket.on("send_message", async (data) => {
      const { message } = data;
      console.log("Received message:", message);

      // Echo user message
      socket.emit("receive_message", { sender: "user", message });

      // Call AI API route for reply
      try {
        const aiRes = await fetch(`http://localhost:${port}/api/ai-chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });
        const aiData = await aiRes.json();

        socket.emit("receive_message", {
          sender: "ai",
          message: aiData.reply || "Sorry I can't answer right now.",
        });
      } catch (error) {
        console.error("AI response error:", error);
        socket.emit("receive_message", {
          sender: "ai",
          message: "AI error. Please try again later.",
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.data.userId}`);
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
