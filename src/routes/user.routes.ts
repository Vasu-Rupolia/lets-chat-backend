import { Router } from "express";
import User from "../models/User";
import auth, { AuthRequest } from "../middlewares/auth";
import { 
  getUsersList, 
  getSkillMatchedUsersList, 
  searchUser, 
  getUserProfile, 
  updateUser, 
  sendFriendRequest, 
  acceptFriendRequest, 
  getFriendRequests,
  getFriends,
  forgotPassword
} from "../controllers/UserController";
import upload from "../middlewares/upload";

const router = Router();

router.get("/list", auth, getUsersList);
router.get("/skill-matched-list", auth, getSkillMatchedUsersList);
router.get("/search", searchUser);

router.put(
  "/update",
  auth,
  upload.single("image"),
  updateUser
);
router.post("/friend-request", auth, sendFriendRequest);
router.put("/friend-request", auth, acceptFriendRequest);
router.get("/friend-requests", auth, getFriendRequests);
router.get("/friends", auth, getFriends);
router.post("/forgot-password", forgotPassword);

router.get("/:id", getUserProfile);

export default router;