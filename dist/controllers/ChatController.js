"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessages = exports.getConversations = exports.createOrGetConversation = exports.sendMessage = void 0;
const Message_1 = __importDefault(require("../models/Message"));
const Conversation_1 = __importDefault(require("../models/Conversation"));
const socket_1 = require("../socket");
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
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { conversationId, text } = req.body;
    const sender = req.user.id;
    // 🔥 get conversation
    const conversation = yield Conversation_1.default.findById(conversationId);
    if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
    }
    // 🔥 find receiver
    const receiverId = conversation.participants.find((p) => p.toString() !== sender);
    const message = yield Message_1.default.create({
        conversationId,
        sender,
        text
    });
    yield Conversation_1.default.findByIdAndUpdate(conversationId, {
        lastMessage: text,
        lastMessageAt: new Date()
    });
    const io = (0, socket_1.getIO)();
    io.to(sender).emit("receive_message", message);
    io.to(receiverId.toString()).emit("receive_message", message);
    res.json({ success: true, message });
});
exports.sendMessage = sendMessage;
const createOrGetConversation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const senderId = req.user.id; // from auth middleware
        const { receiverId } = req.body;
        if (!receiverId) {
            return res.status(400).json({ message: "receiverId required" });
        }
        // 🔍 Check if conversation already exists
        let conversation = yield Conversation_1.default.findOne({
            participants: { $all: [senderId, receiverId] },
        });
        // 🆕 If not found → create new
        if (!conversation) {
            conversation = yield Conversation_1.default.create({
                participants: [senderId, receiverId],
            });
        }
        return res.json(conversation);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
exports.createOrGetConversation = createOrGetConversation;
const getConversations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const conversations = yield Conversation_1.default.find({
            participants: userId,
        })
            .sort({ updatedAt: -1 })
            .populate("participants", "name image");
        // Format response (very important)
        const formatted = conversations.map((conv) => {
            const otherUser = conv.participants.find((p) => p._id.toString() !== userId);
            return {
                _id: conv._id,
                user: otherUser,
                lastMessage: conv.lastMessage,
                lastMessageAt: conv.lastMessageAt,
            };
        });
        res.json(formatted);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message, status: false });
    }
});
exports.getConversations = getConversations;
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;
        // Mark messages as seen (only those NOT sent by me)
        yield Message_1.default.updateMany({
            conversationId,
            sender: { $ne: userId }, // messages from other user
            seen: false
        }, {
            $set: { seen: true }
        });
        const messages = yield Message_1.default.find({ conversationId })
            .sort({ createdAt: 1 });
        res.json({ success: true, messages });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
exports.getMessages = getMessages;
