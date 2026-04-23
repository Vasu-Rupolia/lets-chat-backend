import { Request, Response } from "express";
import Message from "../models/Message";
import Conversation from "../models/Conversation";
import { getIO } from "../socket";

// export const sendMessage = async (req: any, res: any) => {
//   const { conversationId, text } = req.body;
//   const sender = req.user.id;

//   const message = await Message.create({
//     conversationId,
//     sender,
//     text
//   });

//   // update conversation
//   await Conversation.findByIdAndUpdate(conversationId, {
//     lastMessage: text,
//     lastMessageAt: new Date()
//   });

//   const io = getIO();

//   io.to(sender).emit("receive_message", message);
//   io.to(receiverId).emit("receive_message", message);

//   res.json({ success: true, message });
// };

export const sendMessage = async (req: any, res: any) => {
  const { conversationId, text } = req.body;
  const sender = req.user.id;

  // 🔥 get conversation
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    return res.status(404).json({ message: "Conversation not found" });
  }

  // 🔥 find receiver
  const receiverId = conversation.participants.find(
    (p: any) => p.toString() !== sender
  );

  const message = await Message.create({
    conversationId,
    sender,
    text
  });

  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: text,
    lastMessageAt: new Date()
  });

  const io = getIO();

  io.to(sender).emit("receive_message", message);
  io.to(receiverId!.toString()).emit("receive_message", message);

  res.json({ success: true, message });
};

export const createOrGetConversation = async (req:any, res:any) => {
  try {
    const senderId = req.user.id; // from auth middleware
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: "receiverId required" });
    }

    // 🔍 Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    // 🆕 If not found → create new
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    return res.json(conversation);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getConversations = async (req: any, res: any) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .sort({ updatedAt: -1 })
      .populate("participants", "name image");

    // Format response (very important)
    const formatted = conversations.map((conv) => {
      const otherUser = conv.participants.find(
        (p) => p._id.toString() !== userId
      );

      return {
        _id: conv._id,
        user: otherUser,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
      };
    });

    res.json(formatted);

  } catch (err:any) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message, status: false });
  }
};

export const getMessages = async (req:any, res:any) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Mark messages as seen (only those NOT sent by me)
    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: userId }, // messages from other user
        seen: false
      },
      {
        $set: { seen: true }
      }
    );

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 });

    res.json({ success: true, messages });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};