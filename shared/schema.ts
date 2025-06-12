import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for email/password authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role", { enum: ["moderator", "admin"] }).default("moderator").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Attendance records table
export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: timestamp("date").defaultNow().notNull(),
  ipAddress: varchar("ip_address").notNull(),
  location: varchar("location"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Login logs table for tracking user sessions
export const loginLogs = pgTable("login_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  ipAddress: varchar("ip_address").notNull(),
  location: varchar("location"),
  userAgent: text("user_agent"),
  loginTime: timestamp("login_time").defaultNow().notNull(),
  logoutTime: timestamp("logout_time"),
});

// Admin actions log
export const adminActions = pgTable("admin_actions", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull().references(() => users.id),
  action: varchar("action").notNull(),
  targetUserId: integer("target_user_id").references(() => users.id),
  details: text("details"),
  ipAddress: varchar("ip_address").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Trustpilot reviews table
export const trustpilotReviews = pgTable("trustpilot_reviews", {
  id: serial("id").primaryKey(),
  moderatorId: integer("moderator_id").notNull().references(() => users.id),
  customerName: varchar("customer_name").notNull(),
  customerEmail: varchar("customer_email").notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  reviewText: text("review_text").notNull(),
  businessResponse: text("business_response"),
  status: varchar("status", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
  adminReviewId: integer("admin_review_id").references(() => users.id),
  adminComments: text("admin_comments"),
  reviewedAt: timestamp("reviewed_at"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  role: true,
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export const insertAttendanceSchema = createInsertSchema(attendanceRecords).pick({
  userId: true,
  ipAddress: true,
  location: true,
  userAgent: true,
});

export const insertLoginLogSchema = createInsertSchema(loginLogs).pick({
  userId: true,
  ipAddress: true,
  location: true,
  userAgent: true,
});

export const insertTrustpilotReviewSchema = createInsertSchema(trustpilotReviews).pick({
  moderatorId: true,
  customerName: true,
  customerEmail: true,
  rating: true,
  reviewText: true,
  businessResponse: true,
});

export const reviewReviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  adminComments: z.string().optional(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type LoginLog = typeof loginLogs.$inferSelect;
export type InsertLoginLog = z.infer<typeof insertLoginLogSchema>;
export type AdminAction = typeof adminActions.$inferSelect;
export type TrustpilotReview = typeof trustpilotReviews.$inferSelect;
export type InsertTrustpilotReview = z.infer<typeof insertTrustpilotReviewSchema>;
