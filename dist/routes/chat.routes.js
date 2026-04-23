"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("../middlewares/auth"));
const ChatController_1 = require("../controllers/ChatController");
const router = (0, express_1.Router)();
router.post('/messages', auth_1.default, ChatController_1.sendMessage);
router.get('/conversations', auth_1.default, ChatController_1.getConversations);
router.post('/conversations', auth_1.default, ChatController_1.createOrGetConversation);
router.get('/messages/:conversationId', auth_1.default, ChatController_1.getMessages);
exports.default = router;
