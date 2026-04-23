"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const socket_1 = require("./socket");
dotenv_1.default.config();
const app = (0, express_1.default)();
// ✅ create server first
const server = http_1.default.createServer(app);
(0, socket_1.initSocket)(server);
app.use((0, cors_1.default)({
    origin: "http://85.121.120.156:3000",
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/uploads", express_1.default.static("uploads"));
mongoose_1.default.connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(console.error);
app.use("/api/auth", auth_routes_1.default);
app.use("/api/users", user_routes_1.default);
app.use("/api/chat", chat_routes_1.default);
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});
