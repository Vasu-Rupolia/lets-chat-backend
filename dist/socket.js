"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let io;
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: "http://85.121.120.156:3000",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });
    const onlineUsers = new Map();
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);
        socket.on("join", (userId) => {
            if (!userId)
                return;
            socket.join(userId);
        });
        socket.on("send_message", (data) => {
            io.to(data.receiver).emit("receive_message", data);
        });
        socket.on("typing", ({ sender, receiver }) => {
            socket.to(receiver).emit("typing", { sender });
        });
        socket.on("stop_typing", ({ sender, receiver }) => {
            socket.to(receiver).emit("stop_typing", { sender });
        });
        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io)
        throw new Error("Socket not initialized");
    return io;
};
exports.getIO = getIO;
