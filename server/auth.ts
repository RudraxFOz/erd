import bcrypt from "bcryptjs";
import session from "express-session";
import type { Express } from "express";
import { storage } from "./storage";
import { loginSchema } from "@shared/schema";

// Predefined user accounts
const PREDEFINED_USERS = [
  {
    email: "admin@portal.com",
    password: "admin123",
    firstName: "Admin",
    lastName: "Portal",
    role: "admin" as const,
    isActive: true
  },
  {
    email: "agent@portal.com",
    password: "agent123",
    firstName: "Agent",
    lastName: "Smith",
    role: "moderator" as const,
    isActive: true
  },
  {
    email: "zeno@portal.com",
    password: "zeno123",
    firstName: "Zeno",
    lastName: "Martinez",
    role: "moderator" as const,
    isActive: true
  },
  {
    email: "param@portal.com",
    password: "param123",
    firstName: "Param",
    lastName: "Singh",
    role: "moderator" as const,
    isActive: true
  },
  {
    email: "raj@portal.com",
    password: "raj123",
    firstName: "Raj",
    lastName: "Discord",
    role: "moderator" as const,
    isActive: true
  },
  {
    email: "oscar@portal.com",
    password: "oscar123",
    firstName: "Oscar",
    lastName: "Wilson",
    role: "moderator" as const,
    isActive: true
  },
  {
    email: "khay@portal.com",
    password: "khay123",
    firstName: "Khay",
    lastName: "Brown",
    role: "moderator" as const,
    isActive: true
  },
  {
    email: "ingrid@portal.com",
    password: "ingrid123",
    firstName: "Ingrid",
    lastName: "Johnson",
    role: "moderator" as const,
    isActive: true
  },
  {
    email: "sagara@portal.com",
    password: "sagara123",
    firstName: "Sagara",
    lastName: "Discord",
    role: "moderator" as const,
    isActive: true
  },
  {
    email: "mcdaniels@portal.com",
    password: "mcdaniels123",
    firstName: "McDaniels",
    lastName: "Discord",
    role: "moderator" as const,
    isActive: true
  },
  {
    email: "khamal@portal.com",
    password: "khamal123",
    firstName: "Khamal",
    lastName: "Ahmed",
    role: "moderator" as const,
    isActive: true
  },
  {
    email: "drex@portal.com",
    password: "drex123",
    firstName: "Drex",
    lastName: "Thompson",
    role: "moderator" as const,
    isActive: true
  },
  {
    email: "sammie@portal.com",
    password: "sammie123",
    firstName: "Sammie",
    lastName: "Discord",
    role: "moderator" as const,
    isActive: true
  },
  {
    email: "wzzy@portal.com",
    password: "wzzy123",
    firstName: "Wzzy",
    lastName: "Discord",
    role: "moderator" as const,
    isActive: true
  },
  {
    email: "kim@portal.com",
    password: "kim123",
    firstName: "Kim",
    lastName: "Weekends",
    role: "moderator" as const,
    isActive: true
  },
  {
    email: "kyle@portal.com",
    password: "kyle123",
    firstName: "Kyle",
    lastName: "Weekends",
    role: "moderator" as const,
    isActive: true
  },
  {
    email: "ezekiel@portal.com",
    password: "ezekiel123",
    firstName: "Ezekiel",
    lastName: "Weekends",
    role: "moderator" as const,
    isActive: true
  }
];

export function setupSession(app: Express) {
  app.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
}

export const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

async function initializePredefinedUsers() {
  for (const userData of PREDEFINED_USERS) {
    const existingUser = await storage.getUserByEmail(userData.email);
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      await storage.createUser({
        ...userData,
        password: hashedPassword
      });
    }
  }
}

export async function setupAuthRoutes(app: Express) {
  // Initialize predefined users
  await initializePredefinedUsers();

  // Login route
  app.post('/api/auth/login', async (req: any, res: any) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Account is deactivated" });
      }

      // Store user ID in session
      req.session.userId = user.id;
      
      res.json({ 
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get current user
  app.get('/api/auth/user', requireAuth, async (req: any, res: any) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Logout route
  app.post('/api/auth/logout', requireAuth, async (req: any, res: any) => {
    try {
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({ message: "Failed to logout" });
        }
        res.json({ message: "Logout successful" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}