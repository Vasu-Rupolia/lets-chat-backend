import { Server } from "socket.io";

let io: Server;

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: "http://85.121.120.156:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // const onlineUsers = new Map();
  const onlineUsers = new Map<string, string>(); 

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

     socket.on("join", (userId: string) => {
       if (!userId) return;
       socket.join(userId);
       onlineUsers.set(userId, socket.id);
        socket.emit("online_users_list", Array.from(onlineUsers.keys()));
        
        // broadcast to everyone
        // io.emit("user_online", userId);
        socket.broadcast.emit("user_online", userId);
     });

    socket.on("send_message", (data: any) => {
      io.to(data.receiver).emit("receive_message", data);
    });

    socket.on("typing", ({ sender, receiver }) => {
      io.to(receiver).emit("typing", { sender });
    });

    socket.on("stop_typing", ({ sender, receiver }) => {
      io.to(receiver).emit("stop_typing", { sender });
    });

    //  socket.on("disconnect", () => {
    //    console.log("User disconnected:", socket.id);
    //  });

    socket.on("disconnect", () => {
      let disconnectedUserId: string | null = null;

      for (let [userId, sockId] of onlineUsers.entries()) {
        if (sockId === socket.id) {
          disconnectedUserId = userId;
          onlineUsers.delete(userId);
          break;
        }
      }

      if (disconnectedUserId) {
        io.emit("user_offline", disconnectedUserId);
      }

      console.log("User disconnected:", socket.id);
    });
    
  });
};

export const getIO = () => {
  if (!io) throw new Error("Socket not initialized");
  return io;
};
