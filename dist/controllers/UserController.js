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
exports.forgotPassword = exports.getFriends = exports.getFriendRequests = exports.acceptFriendRequest = exports.sendFriendRequest = exports.updateUser = exports.getUserProfile = exports.searchUser = exports.getSkillMatchedUsersList = exports.getUsersList = void 0;
const User_1 = __importDefault(require("../models/User"));
const FriendRequest_1 = __importDefault(require("../models/FriendRequest"));
const Friend_1 = __importDefault(require("../models/Friend"));
const socket_1 = require("../socket");
const crypto_1 = __importDefault(require("crypto"));
const mailer_1 = require("../utils/mailer");
// export const getUsersList: any = async (req: AuthRequest, res: Response) => {
//   try {
//     const page = Number(req.query.page) || 1;
//     const limit = Number(req.query.limit) || 10;
//     const skip = (page - 1) * limit;
//     const total = await User.countDocuments({
//       _id: { $ne: req.user?.id }
//     });
//     const users = await User.find({ _id: { $ne: req.user?.id } })
//       .skip(skip)
//       .limit(limit);
//     return res.status(200).json({
//       message: "List retrieved successfully",
//       data: users,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit)
//       },
//       success: true
//     });
//   } catch (error: any) {
//     return res.status(500).json({
//       message: "Server error",
//       error: error.message
//     });
//   }
// };
const getUsersList = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const currentUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        // Get users (exclude self)
        const users = yield User_1.default.find({ _id: { $ne: currentUserId } })
            .skip(skip)
            .limit(limit)
            .lean();
        const sentRequests = yield FriendRequest_1.default.find({
            sender: currentUserId,
            status: "pending",
        }).select("receiver");
        const sentSet = new Set(sentRequests.map((r) => r.receiver.toString()));
        const receivedRequests = yield FriendRequest_1.default.find({
            receiver: currentUserId,
            status: "pending",
        }).select("sender");
        const receivedSet = new Set(receivedRequests.map((r) => r.sender.toString()));
        const me = String(currentUserId);
        const friends = yield Friend_1.default.find({
            $or: [
                { user1: currentUserId },
                { user2: currentUserId },
            ],
        }).lean();
        const friendSet = new Set();
        friends.forEach((f) => {
            const user1 = String(f.user1);
            const user2 = String(f.user2);
            if (user1 === me) {
                friendSet.add(user2);
            }
            else {
                friendSet.add(user1);
            }
        });
        console.log("CURRENT USER:", currentUserId);
        console.log("FRIENDS:", friends);
        console.log("FRIEND SET:", Array.from(friendSet));
        // Attach flags
        const usersWithFlags = users.map((user) => {
            const id = user._id.toString();
            return Object.assign(Object.assign({}, user), { hasSentRequest: sentSet.has(id), hasReceivedRequest: receivedSet.has(id), isFriend: friendSet.has(id) });
        });
        const total = yield User_1.default.countDocuments({
            _id: { $ne: currentUserId },
        });
        return res.status(200).json({
            message: "List retrieved successfully",
            data: usersWithFlags,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            success: true,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
});
exports.getUsersList = getUsersList;
//----------------------------------------------------------------------------------------------------
const getSkillMatchedUsersList = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const currentUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const currentUser = yield User_1.default.findById(currentUserId);
        if (!currentUser) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }
        const currentSkills = currentUser.skills || [];
        const query = {
            _id: { $ne: currentUserId },
            skills: { $in: currentSkills }
        };
        const total = yield User_1.default.countDocuments(query);
        const users = yield User_1.default.find(query)
            .skip(skip)
            .limit(limit);
        return res.status(200).json({
            message: "Users with matching skills",
            data: users,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            success: true
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});
exports.getSkillMatchedUsersList = getSkillMatchedUsersList;
//----------------------------------------------------------------------------------------------------
const searchUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const q = req.query.q;
        if (!q) {
            return res.json({
                message: "No query",
                data: [],
                success: true
            });
        }
        const users = yield User_1.default.find({
            $or: [
                { name: { $regex: q, $options: "i" } },
                { email: { $regex: q, $options: "i" } }
            ]
        })
            .select("-password")
            .limit(10);
        return res.status(200).json({
            message: "Users searched",
            data: users,
            success: true
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});
exports.searchUser = searchUser;
//----------------------------------------------------------------------------------------------------
const getUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.default.findById(req.params.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({
            message: "User profile retrieved successfully",
            data: user,
            success: true,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});
exports.getUserProfile = getUserProfile;
//----------------------------------------------------------------------------------------------------
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        let { name, email, mobile_number, about, skills, } = req.body;
        let parsedSkills = [];
        if (skills) {
            try {
                parsedSkills = JSON.parse(skills);
            }
            catch (_a) {
                return res.status(400).json({ message: "Invalid skills format" });
            }
        }
        if (email) {
            email = email.toLowerCase();
            const existingUser = yield User_1.default.findOne({
                email,
                _id: { $ne: userId }, // exclude current user
            });
            if (existingUser) {
                return res.status(400).json({ message: "Email already in use" });
            }
        }
        const updateData = {};
        if (name)
            updateData.name = name;
        if (email)
            updateData.email = email;
        if (mobile_number)
            updateData.mobile_number = mobile_number;
        if (about !== undefined)
            updateData.about = about;
        if (skills)
            updateData.skills = parsedSkills;
        if (req.file) {
            updateData.image = req.file.filename;
        }
        const updatedUser = yield User_1.default.findByIdAndUpdate(userId, updateData, { new: true }).select("-password");
        return res.status(200).json({
            message: "Profile updated successfully",
            data: updatedUser,
            success: true,
        });
    }
    catch (err) {
        return res.status(500).json({
            message: "Server error",
            error: err.message,
        });
    }
});
exports.updateUser = updateUser;
//----------------------------------------------------------------------------------------------------
// export const sendFriendRequest = async (req: Request, res: Response) => {
//   try {
//     const sender = (req as any).user.id;
//     const { receiver } = req.body;
//     if (sender === receiver) {
//       return res.status(400).json({ message: "You cannot send request to yourself" });
//     }
//     // Check existing request
//     const existing = await FriendRequest.findOne({
//       $or: [
//         { sender, receiver },
//         { sender: receiver, receiver: sender }
//       ]
//     });
//     if (existing) {
//       return res.status(400).json({ message: "Request already exists" });
//     }
//     const request = await FriendRequest.create({
//       sender,
//       receiver,
//       status: "pending"
//     });
//     const io = getIO();
//     io.to(receiver).emit("friend_request_received", {
//       sender
//     });
//     return res.status(201).json({
//       message: "Friend request sent",
//       data: request,
//       success: true
//     });
//   } catch (error) {
//     return res.status(500).json({
//       message: "Server error",
//       error: (error as Error).message
//     });
//   }
// };
const mongoose_1 = __importDefault(require("mongoose"));
const sendFriendRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const sender = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { receiver } = req.body;
        if (!sender || !receiver) {
            return res.status(400).json({ message: "Invalid request data" });
        }
        if (sender === receiver) {
            return res.status(400).json({ message: "You cannot send request to yourself" });
        }
        // Convert to ObjectId
        const senderId = new mongoose_1.default.Types.ObjectId(sender);
        const receiverId = new mongoose_1.default.Types.ObjectId(receiver);
        // Check existing request
        const existing = yield FriendRequest_1.default.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ]
        });
        if (existing) {
            return res.status(400).json({ message: "Request already exists" });
        }
        const request = yield FriendRequest_1.default.create({
            sender: senderId,
            receiver: receiverId,
            status: "pending"
        });
        const io = (0, socket_1.getIO)();
        io.to(receiver.toString()).emit("friend_request_received", {
            _id: request._id,
            sender: {
                _id: sender,
                name: (_b = req.user) === null || _b === void 0 ? void 0 : _b.name,
                image: (_c = req.user) === null || _c === void 0 ? void 0 : _c.image
            }
        });
        return res.status(201).json({
            message: "Friend request sent",
            data: request,
            success: true
        });
    }
    catch (error) {
        console.error("Friend request error:", error); // VERY IMPORTANT
        return res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
});
exports.sendFriendRequest = sendFriendRequest;
//----------------------------------------------------------------------------------------------------
const acceptFriendRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { requestId } = req.body;
        const request = yield FriendRequest_1.default.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }
        if (request.receiver.toString() !== userId) {
            return res.status(403).json({ message: "Not authorized" });
        }
        // mark as accepted (optional if you delete it)
        request.status = "accepted";
        yield request.save();
        // CREATE FRIENDSHIP CORRECTLY
        yield Friend_1.default.create({
            user1: request.sender,
            user2: request.receiver,
        });
        return res.status(201).json({
            message: "Friend request accepted",
            success: true,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
});
exports.acceptFriendRequest = acceptFriendRequest;
//----------------------------------------------------------------------------------------------------
const getFriendRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const requests = yield FriendRequest_1.default.find({
            receiver: userId,
            status: "pending"
        })
            .populate("sender", "name email image") // get sender details
            .sort({ createdAt: -1 });
        return res.status(200).json({
            message: "Friend requests fetched",
            data: requests,
            success: true
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
});
exports.getFriendRequests = getFriendRequests;
//----------------------------------------------------------------------------------------------------
const getFriends = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const friends = yield Friend_1.default.find({
            $or: [{ user1: userId }, { user2: userId }],
        })
            .populate("user1 user2", "name image email")
            .lean();
        const formatted = friends.map((f) => {
            const friend = f.user1._id.toString() === userId
                ? f.user2
                : f.user1;
            return {
                _id: friend._id,
                name: friend.name,
                image: friend.image,
                email: friend.email
            };
        });
        return res.json({
            success: true,
            data: formatted,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
});
exports.getFriends = getFriends;
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const user = yield User_1.default.findOne({ email });
        // Always return success (security best practice)
        if (!user) {
            return res.json({ msg: "If email exists, reset link sent" });
        }
        // generate token
        const token = crypto_1.default.randomBytes(32).toString("hex");
        user.resetToken = token;
        user.resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 15);
        yield user.save();
        const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;
        yield (0, mailer_1.sendResetEmail)(email, resetLink);
        res.json({ msg: "If email exists, reset link sent" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Something went wrong", status: false, error: err.message });
    }
});
exports.forgotPassword = forgotPassword;
