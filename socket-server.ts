import http from "http";
import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Message from "@/models/Message";

dotenv.config();

const PORT = 4000;
const MONGO_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://nihal:nihal@cluster0.oz0lft4.mongodb.net/dating-app";

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("Mongo connection error:", err);
    process.exit(1);
  }
})();

const server = http.createServer();

const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use((socket, next) => {
  const userId = socket.handshake.auth.userId;
  if (!userId) return next(new Error("UserId required"));
  socket.data.userId = userId;
  next();
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.data.userId}`);

  // Save and broadcast user message + AI reply sequence
  socket.on("send_message", async (data) => {
    const { message } = data;
    if (!message) return;

    const userId = socket.data.userId;
    const aiBotId = "ai_bot";

    try {
      // Save user's message (receiver = AI bot)
      await Message.create({ sender: userId, receiver: aiBotId, message });

      socket.emit("receive_message", {
        sender: userId,
        receiver: aiBotId,
        message,
      });

      // Simulate AI reply here (replace with real AI logic)
      const aiReply = `AI reply to: "${message}"`;

      // Save AI reply (sender = AI bot, receiver = user)
      await Message.create({
        sender: aiBotId,
        receiver: userId,
        message: aiReply,
      });

      socket.emit("receive_message", {
        sender: aiBotId,
        receiver: userId,
        message: aiReply,
      });
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  // Send conversation history with AI bot on demand
  socket.on("get_conversation", async (partnerId) => {
    if (!partnerId) return;

    try {
      const messages = await Message.find({
        $or: [
          { sender: socket.data.userId, receiver: partnerId },
          { sender: partnerId, receiver: socket.data.userId },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      socket.emit("conversation", messages.reverse());
    } catch (err) {
      console.error("Error fetching conversation:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.data.userId}`);
  });
});

server.listen(PORT, () => {
  console.log(`Socket.io server running on http://localhost:${PORT}`);
});
