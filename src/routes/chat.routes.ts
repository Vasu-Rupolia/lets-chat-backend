import { Router } from "express";
import User from "../models/User";
import auth, { AuthRequest } from "../middlewares/auth";
import { 
  getConversations,
  sendMessage,
  createOrGetConversation,
  getMessages
} from "../controllers/ChatController";

import {uploadVoice} from "../middlewares/uploadVoice";

const router = Router();

router.post('/messages', auth, uploadVoice.single("audio"), sendMessage);
router.get('/conversations', auth, getConversations);
router.post('/conversations', auth, createOrGetConversation);
router.get('/messages/:conversationId', auth, getMessages);

export default router;