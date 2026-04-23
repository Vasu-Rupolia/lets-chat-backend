import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User";
import {signup, login, getMe} from "../controllers/AuthController";
import upload from "../middlewares/upload";

const router = Router();

router.post("/signup", upload.single("image"), signup);
router.post("/login", login);
router.get("/me", getMe);

export default router;