import express from "express";
import http from "http";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import chatRoutes from "./routes/chat.routes";

import { initSocket } from "./socket";

dotenv.config();

const app = express();

// ✅ create server first
const server = http.createServer(app);

initSocket(server);

app.use(cors({
  origin: "http://85.121.120.156:3000",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));

mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => console.log("MongoDB connected"))
  .catch(console.error);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
