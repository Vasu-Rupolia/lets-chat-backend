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
exports.getMe = exports.login = exports.signup = void 0;
const User_1 = __importDefault(require("../models/User"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
// export const signup:any = async(req: Request, res: Response) => {
//     try {
//         const { name, email, password, gender, dob, mobile_number } = req.body;
//         // Validation
//         if (!name || !email || !password) {
//           return res.status(400).json({ message: "All fields are required" });
//         }
//         if (password.length < 6) {
//           return res.status(400).json({ message: "Password must be at least 6 chars" });
//         }
//         // Check existing user
//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//           return res.status(400).json({ message: "User already exists" });
//         }
//         // Hash password
//         const hashed = await bcrypt.hash(password, 10);
//         // Create user
//         const user = await User.create({
//           name,
//           email,
//           password: hashed,
//           gender,
//           dob,
//           mobile_number
//         });
//         // Remove password before sending
//         const userObj = user.toObject();
//         // delete userObj.password;
//         res.status(201).json({
//           message: "User created successfully",
//           user: userObj
//         });
//       } catch (err:any) {
//         res.status(500).json({ message: "Server error", error: err.message });
//       }
// }
// export const signup = async (req: Request, res: Response) => {
//   try {
//     const { 
//       name, 
//       email, 
//       password, 
//       gender, 
//       dob, 
//       mobile_number, 
//       skills, 
//       about 
//     } = req.body;
//     // Validation
//     if (!name || !email || !password) {
//       return res.status(400).json({ message: "All fields are required" });
//     }
//     if (!gender) {
//       return res.status(400).json({ message: "Gender is required" });
//     }
//     if (!dob) {
//       return res.status(400).json({ message: "DOB is required" });
//     }
//     if (password.length < 6) {
//       return res
//         .status(400)
//         .json({ message: "Password must be at least 6 characters" });
//     }
//     // Check existing user
//     const normalizedEmail = email.toLowerCase();
//     const existingUser = await User.findOne({ email: normalizedEmail });
//     if (existingUser) {
//       return res.status(400).json({ message: "User already exists" });
//     }
//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);
//     // Create user
//     const user = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//       gender,
//       dob,
//       mobile_number,
//       skills: skills ? JSON.parse(skills) : [],
//       about: about || "",
//       image: req.file ? req.file.filename : null,
//     });
//     // Remove password before sending
//     const userObj: any = user.toObject();
//     delete userObj.password;
//     return res.status(201).json({
//       message: "User created successfully",
//       user: userObj,
//     });
//   } catch (err: any) {
//     return res.status(500).json({
//       message: "Server error",
//       error: err.message,
//     });
//   }
// };
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { name, email, password, gender, dob, mobile_number, skills, about } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All required fields missing" });
        }
        if (!gender) {
            return res.status(400).json({ message: "Gender is required" });
        }
        if (!dob) {
            return res.status(400).json({ message: "DOB is required" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }
        email = email.toLowerCase();
        const existingUser = yield User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        // Parse skills
        let parsedSkills = [];
        if (skills) {
            try {
                parsedSkills = JSON.parse(skills);
            }
            catch (_a) {
                parsedSkills = [];
            }
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const user = yield User_1.default.create({
            name,
            email,
            password: hashedPassword,
            gender,
            dob,
            mobile_number,
            skills: parsedSkills,
            about: about || "",
            image: req.file ? req.file.filename : null,
        });
        const userObj = user.toObject();
        delete userObj.password;
        return res.status(201).json({
            message: "User created successfully",
            user: userObj,
        });
    }
    catch (err) {
        return res.status(500).json({
            message: "Server error",
            error: err.message,
        });
    }
});
exports.signup = signup;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Validation
        if (!email || !password) {
            return res.status(400).json({ message: "Email & password required" });
        }
        const user = yield User_1.default.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        const isMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        // JWT token
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        const userObj = user.toObject();
        // delete userObj.password;
        res.json({
            message: "Login successful",
            token,
            user: userObj
        });
    }
    catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});
exports.login = login;
const getMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield User_1.default.findById(decoded.id).select("-password");
        res.json(user);
    }
    catch (_b) {
        res.status(401).json({ message: "Invalid token" });
    }
});
exports.getMe = getMe;
