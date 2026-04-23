import mongoose, { Document, Types } from "mongoose";

export interface IFriend extends Document {
  user1: Types.ObjectId;
  user2: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new mongoose.Schema<IFriend>(
  {
    user1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    user2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// prevent duplicates
schema.index({ user1: 1, user2: 1 }, { unique: true });

// optional helpers
schema.statics.areFriends = async function (userA: string, userB: string) {
  const [first, second] = [userA, userB].sort();

  const exists = await this.findOne({ user1: first, user2: second });
  return !!exists;
};

export default mongoose.model<IFriend>("Friend", schema);