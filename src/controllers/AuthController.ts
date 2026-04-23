import User from "../models/User";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import bcrypt from "bcrypt";

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

export const signup = async (req: Request, res: Response) => {
  try {
    let { 
      name, 
      email, 
      password, 
      gender, 
      dob, 
      mobile_number, 
      skills, 
      about 
    } = req.body;

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

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Parse skills
    let parsedSkills: string[] = [];
    if (skills) {
      try {
        parsedSkills = JSON.parse(skills);
      } catch {
        parsedSkills = [];
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
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

    const userObj: any = user.toObject();
    delete userObj.password;

    return res.status(201).json({
      message: "User created successfully",
      user: userObj,
    });

  } catch (err: any) {
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

export const login:any = async(req: Request, res: Response) => {
    try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email & password required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    const userObj = user.toObject();
    // delete userObj.password;

    res.json({
      message: "Login successful",
      token,
      user: userObj
    });

  } catch (err:any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

export const getMe:any = async(req: Request, res: Response) => {
    try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    );

    const user = await User.findById(decoded.id).select("-password");

    res.json(user);

  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}