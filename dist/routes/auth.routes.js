"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const upload_1 = __importDefault(require("../middlewares/upload"));
const router = (0, express_1.Router)();
router.post("/signup", upload_1.default.single("image"), AuthController_1.signup);
router.post("/login", AuthController_1.login);
router.get("/me", AuthController_1.getMe);
exports.default = router;
