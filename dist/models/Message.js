"use strict";
// import mongoose, { Document } from "mongoose";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// export interface IMessage extends Document {
//   sender: string;
//   receiver: string;
//   message: string;
// }
// const schema = new mongoose.Schema<IMessage>({
//   sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//   receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//   message: String,
// }, { timestamps: true });
// export default mongoose.model<IMessage>("Message", schema);
const mongoose_1 = __importDefault(require("mongoose"));
const messageSchema = new mongoose_1.default.Schema({
    conversationId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Conversation"
    },
    sender: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User"
    },
    text: String,
    seen: { type: Boolean, default: false }
}, { timestamps: true });
exports.default = mongoose_1.default.model("Message", messageSchema);
