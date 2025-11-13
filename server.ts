import "./loadEnv";
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import dbConnect from "./lib/db";
import Message from "./models/Message";
const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store online users
const onlineUsers = new Map<string, string>(); // userId -> socketId

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Initialize Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    socket.on("message:send", async (data) => {
      // data: { senderId, message }
      try {
        // Call Next.js API route for AI response
        const response = await fetch("http://localhost:3000/api/ai-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: data.message }),
        });

        const { reply } = await response.json();

        // Send reply back to user
        socket.emit("message:receive", {
          sender: "ai",
          message: reply,
          createdAt: new Date().toISOString(),
        });
      } catch (error) {
        socket.emit("message:receive", {
          sender: "ai",
          message: "AI error: Could not get reply.",
          createdAt: new Date().toISOString(),
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
