const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const Message = require("./models/Message");

dotenv.config();

const app = express();
const server = http.createServer(app);

// 🔥 Track online users (username -> socketId)
let onlineUsers = {};

// DB
connectDB();

// Middleware
app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "Protected data accessed",
    user: req.user
  });
});

// 🔥 SOCKET LOGIC
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // 👉 User joins with username
  socket.on("join", (username) => {
    socket.username = username; // store on socket
    onlineUsers[username] = socket.id;

    console.log("Online users:", onlineUsers);

    // Broadcast updated list
    io.emit("onlineUsers", Object.keys(onlineUsers));
  });

  // 👉 Private message
  socket.on("sendPrivateMessage", async ({ text, sender, receiver }) => {
    try {
      const newMessage = new Message({ text, user: sender });
      await newMessage.save();

      const receiverSocket = onlineUsers[receiver];

      // send to receiver
      if (receiverSocket) {
        io.to(receiverSocket).emit("receiveMessage", {
          text,
          user: sender
        });
      }

      // also send back to sender
      socket.emit("receiveMessage", {
        text,
        user: sender
      });

    } catch (error) {
      console.log(error);
    }
  });

  // 👉 Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    if (socket.username) {
      delete onlineUsers[socket.username];
      io.emit("onlineUsers", Object.keys(onlineUsers));
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong" });
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});