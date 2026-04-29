import User from "../models/User";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import FriendRequest from "../models/FriendRequest";
import Friend from "../models/Friend";
import { getIO } from "../socket";
import crypto from "crypto";
import { sendResetEmail } from "../utils/mailer";

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

export const getUsersList: any = async (req: AuthRequest, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const currentUserId = req.user?.id;

    // Get users (exclude self)
    const users = await User.find({ _id: { $ne: currentUserId } })
      .skip(skip)
      .limit(limit)
      .lean();

    const sentRequests = await FriendRequest.find({
      sender: currentUserId,
      status: "pending",
    }).select("receiver");

    const sentSet = new Set(
      sentRequests.map((r) => r.receiver.toString())
    );

    const receivedRequests = await FriendRequest.find({
      receiver: currentUserId,
      status: "pending",
    }).select("sender");

    const receivedSet = new Set(
      receivedRequests.map((r) => r.sender.toString())
    );

    const me = String(currentUserId);

    const friends = await Friend.find({
      $or: [
        { user1: currentUserId },
        { user2: currentUserId },
      ],
    }).lean();

    const friendSet = new Set<string>();

    friends.forEach((f: any) => {
      const user1 = String(f.user1);
      const user2 = String(f.user2);

      if (user1 === me) {
        friendSet.add(user2);
      } else {
        friendSet.add(user1);
      }
    });

    console.log("CURRENT USER:", currentUserId);
    console.log("FRIENDS:", friends);
    console.log("FRIEND SET:", Array.from(friendSet));

    // Attach flags
    const usersWithFlags = users.map((user: any) => {
      const id = user._id.toString();

      return {
        ...user,
        hasSentRequest: sentSet.has(id),
        hasReceivedRequest: receivedSet.has(id),
        isFriend: friendSet.has(id),
      };
    });

    const total = await User.countDocuments({
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

  } catch (error: any) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

//----------------------------------------------------------------------------------------------------

export const getSkillMatchedUsersList: any = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.id;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(currentUserId);

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

    const total = await User.countDocuments(query);

    const users = await User.find(query)
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

  } catch (error: any) {
    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

//----------------------------------------------------------------------------------------------------

export const searchUser: any = async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;

    if (!q) {
      return res.json({
        message: "No query",
        data: [],
        success: true
      });
    }

    const users = await User.find({
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

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: (error as Error).message
    });
  }
};

//----------------------------------------------------------------------------------------------------

export const getUserProfile:any = async(req: Request, res: Response) => {
    try {
        
        const user = await User.findById(req.params.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "User profile retrieved successfully",
            data: user,
            success: true,
        });
        
    } catch (error) {
        res.status(500).json({ message: "Server error", error: (error as Error).message });
    }
}

//----------------------------------------------------------------------------------------------------

export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    let {
      name,
      email,
      mobile_number,
      about,
      skills,
    } = req.body;

    let parsedSkills: string[] = [];
    if (skills) {
      try {
        parsedSkills = JSON.parse(skills);
      } catch {
        return res.status(400).json({ message: "Invalid skills format" });
      }
    }

    if (email) {
      email = email.toLowerCase();

      const existingUser = await User.findOne({
        email,
        _id: { $ne: userId }, // exclude current user
      });

      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    const updateData: any = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (mobile_number) updateData.mobile_number = mobile_number;
    if (about !== undefined) updateData.about = about;
    if (skills) updateData.skills = parsedSkills;

    if (req.file) {
      updateData.image = req.file.filename;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select("-password");

    return res.status(200).json({
      message: "Profile updated successfully",
      data: updatedUser,
      success: true,
    });

  } catch (err: any) {
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

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

import mongoose from "mongoose";

export const sendFriendRequest = async (req: Request, res: Response) => {
  try {
    const sender = (req as any).user?.id;
    const { receiver } = req.body;

    if (!sender || !receiver) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    if (sender === receiver) {
      return res.status(400).json({ message: "You cannot send request to yourself" });
    }

    // Convert to ObjectId
    const senderId = new mongoose.Types.ObjectId(sender);
    const receiverId = new mongoose.Types.ObjectId(receiver);

    // Check existing request
    const existing = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    });

    if (existing) {
      return res.status(400).json({ message: "Request already exists" });
    }

    const request = await FriendRequest.create({
      sender: senderId,
      receiver: receiverId,
      status: "pending"
    });

    const io = getIO();
    // io.to(receiver.toString()).emit("friend_request_received", {
    //   _id: request._id,
    //   sender: {
    //     _id: sender,
    //     name: (req as any).user?.name,
    //     image: (req as any).user?.image
    //   }
    // });

    setTimeout(() => {
      io.to(receiver.toString()).emit("friend_request_received", {
        _id: request._id,
        sender: {
          _id: sender,
          name: (req as any).user?.name,
          image: (req as any).user?.image
        }
      });
    }, 200);

    return res.status(201).json({
      message: "Friend request sent",
      data: request,
      success: true
    });

  } catch (error: any) {
    console.error("Friend request error:", error); // VERY IMPORTANT
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

//----------------------------------------------------------------------------------------------------

export const acceptFriendRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { requestId } = req.body;

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.receiver.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // mark as accepted (optional if you delete it)
    request.status = "accepted";
    await request.save();

    // CREATE FRIENDSHIP CORRECTLY
    await Friend.create({
      user1: request.sender,
      user2: request.receiver,
    });

    return res.status(201).json({
      message: "Friend request accepted",
      success: true,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: (error as Error).message,
    });
  }
};

//----------------------------------------------------------------------------------------------------

export const getFriendRequests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const requests = await FriendRequest.find({
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

  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: (error as Error).message
    });
  }
};

//----------------------------------------------------------------------------------------------------

export const getFriends = async (req: any, res: any) => {
  try {
    const userId = req.user.id;

    const friends = await Friend.find({
      $or: [{ user1: userId }, { user2: userId }],
    })
      .populate("user1 user2", "name image email")
      .lean();

    const formatted = friends.map((f: any) => {
      const friend =
        f.user1._id.toString() === userId
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

  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Always return success (security best practice)
    if (!user) {
      return res.json({ msg: "If email exists, reset link sent" });
    }

    // generate token
    const token = crypto.randomBytes(32).toString("hex");

    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 15);

    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;

    await sendResetEmail(email, resetLink);

    res.json({ msg: "If email exists, reset link sent" });

  } catch (err:any) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong", status: false, error: (err as Error).message});
  }
};