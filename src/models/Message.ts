// import mongoose, { Document } from "mongoose";

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

import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation"
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  text: String,
  seen: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("Message", messageSchema);