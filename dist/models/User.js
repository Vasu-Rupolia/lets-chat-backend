"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
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
const schema = new mongoose_1.default.Schema({
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
}, { timestamps: true });
exports.default = mongoose_1.default.model("User", schema);
