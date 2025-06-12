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
  screenshotUrl: text("screenshot_url"), // URL or base64 data for screenshot
  status: varchar("status", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
  adminReviewId: integer("admin_review_id").references(() => users.id),
  adminComments: text("admin_comments"),
  reviewedAt: timestamp("reviewed_at"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shift schedules table
export const shiftSchedules = pgTable("shift_schedules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  agentName: varchar("agent_name").notNull(),
  team: varchar("team").notNull(), // London, NY, Asia, Weekend
  monday: varchar("monday").default("Off"),
  tuesday: varchar("tuesday").default("Off"),
  wednesday: varchar("wednesday").default("Off"),
  thursday: varchar("thursday").default("Off"),
  friday: varchar("friday").default("Off"),
  saturday: varchar("saturday").default("Off"),
  sunday: varchar("sunday").default("Off"),
  timezone: varchar("timezone").default("GMT").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Disciplinary actions table for strikes and warnings
export const disciplinaryActions = pgTable("disciplinary_actions", {
  id: serial("id").primaryKey(),
  moderatorId: integer("moderator_id").notNull().references(() => users.id),
  adminId: integer("admin_id").notNull().references(() => users.id),
  type: varchar("type", { enum: ["warning", "strike"] }).notNull(),
  reason: text("reason").notNull(),
  description: text("description"),
  severity: varchar("severity", { enum: ["low", "medium", "high"] }).default("medium").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  expiresAt: timestamp("expires_at"), // For warnings that expire
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  screenshotUrl: true,
});

export const reviewReviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  adminComments: z.string().optional(),
});

export const insertShiftScheduleSchema = createInsertSchema(shiftSchedules).pick({
  userId: true,
  agentName: true,
  team: true,
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: true,
  sunday: true,
  timezone: true,
});

export const insertDisciplinaryActionSchema = createInsertSchema(disciplinaryActions).pick({
  moderatorId: true,
  adminId: true,
  type: true,
  reason: true,
  description: true,
  severity: true,
  expiresAt: true,
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
export type ShiftSchedule = typeof shiftSchedules.$inferSelect;
export type InsertShiftSchedule = z.infer<typeof insertShiftScheduleSchema>;
export type DisciplinaryAction = typeof disciplinaryActions.$inferSelect;
export type InsertDisciplinaryAction = z.infer<typeof insertDisciplinaryActionSchema>;
