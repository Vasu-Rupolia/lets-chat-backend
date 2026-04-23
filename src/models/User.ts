import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  gender: "male" | "female" | "other";
  dob: Date;
  mobile_number?: string;
  skills?: string[];
  about: string;
  image?: string | null;
  resetToken: String,
  resetTokenExpiry: Date,
}

// const schema = new mongoose.Schema<IUser>({
//   name: String,
//   email: { type: String, unique: true },
//   password: String,
//   gender: {
//     type: String,
//     enum: ["male", "female", "other"]
//   },
//   dob: Date,
//   mobile_number: String,
//   skills: [String],
//   about: String,
//   image: String,
// }, { timestamps: true });

const schema = new mongoose.Schema<IUser>(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    dob: Date,
    mobile_number: String,
    skills: {
      type: [String],
      default: [],
    },
    about: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: null,
    },
    resetToken: {
      type: String,
      default: null,
    },
    resetTokenExpiry: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", schema);