import { Router } from "express";
import User from "../models/User";
import auth, { AuthRequest } from "../middlewares/auth";
import { 
  getConversations,
  sendMessage,
  createOrGetConversation,
  getMessages
} from "../controllers/ChatController";

const router = Router();

router.post('/messages', auth, sendMessage);
router.get('/conversations', auth, getConversations);
router.post('/conversations', auth, createOrGetConversation);
router.get('/messages/:conversationId', auth, getMessages);

export default router;