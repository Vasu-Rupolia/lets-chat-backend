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
const express_1 = require("express");
const FriendRequest_1 = __importDefault(require("../models/FriendRequest"));
const auth_1 = __importDefault(require("../middlewares/auth"));
const router = (0, express_1.Router)();
// 🔹 Send request
router.post("/request", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.body;
    const existing = yield FriendRequest_1.default.findOne({
        from: req.user.id,
        to: userId,
    });
    if (existing) {
        return res.status(400).json({ message: "Already requested" });
    }
    const request = yield FriendRequest_1.default.create({
        from: req.user.id,
        to: userId,
    });
    res.json(request);
}));
// 🔹 Get pending requests (received)
router.get("/requests", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const requests = yield FriendRequest_1.default.find({
        to: req.user.id,
        status: "pending"
    }).populate("from", "name email");
    res.json(requests);
}));
// 🔹 Accept request
router.post("/accept", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { requestId } = req.body;
    const request = yield FriendRequest_1.default.findById(requestId);
    if (!request)
        return res.status(404).json({ message: "Not found" });
    request.status = "accepted";
    yield request.save();
    res.json({ message: "Accepted" });
}));
// 🔹 Reject request
router.post("/reject", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { requestId } = req.body;
    const request = yield FriendRequest_1.default.findById(requestId);
    if (!request)
        return res.status(404).json({ message: "Not found" });
    request.status = "rejected";
    yield request.save();
    res.json({ message: "Rejected" });
}));
// 🔹 Friend list (IMPORTANT)
router.get("/list", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const friends = yield FriendRequest_1.default.find({
        $or: [
            { from: req.user.id },
            { to: req.user.id }
        ],
        status: "accepted"
    })
        .populate("from", "name email")
        .populate("to", "name email");
    res.json(friends);
}));
exports.default = router;
