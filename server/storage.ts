import {
  users,
  attendanceRecords,
  loginLogs,
  adminActions,
  trustpilotReviews,
  type User,
  type UpsertUser,
  type AttendanceRecord,
  type InsertAttendance,
  type LoginLog,
  type InsertLoginLog,
  type TrustpilotReview,
  type InsertTrustpilotReview,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, count, sql, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<UpsertUser, 'id'>): Promise<User>;
  getAllModerators(): Promise<User[]>;
  updateUserStatus(id: number, isActive: boolean): Promise<void>;
  
  // Attendance operations
  markAttendance(attendance: InsertAttendance): Promise<AttendanceRecord>;
  getTodayAttendance(userId: number): Promise<AttendanceRecord | undefined>;
  getUserAttendanceHistory(userId: number, limit?: number): Promise<AttendanceRecord[]>;
  getAttendanceByDateRange(userId: number, startDate: Date, endDate: Date): Promise<AttendanceRecord[]>;
  
  // Login logs
  createLoginLog(loginLog: InsertLoginLog): Promise<LoginLog>;
  updateLogoutTime(userId: number, logoutTime: Date): Promise<void>;
  getUserLoginHistory(userId: number, limit?: number): Promise<LoginLog[]>;
  
  // Admin analytics
  getModeratorStats(): Promise<any>;
  getAttendanceStats(): Promise<any>;
  getLoginStats(): Promise<any>;
  
  // Admin actions
  logAdminAction(adminId: number, action: string, targetUserId?: number, details?: string, ipAddress?: string): Promise<void>;
  
  // Trustpilot reviews
  createTrustpilotReview(review: InsertTrustpilotReview): Promise<TrustpilotReview>;
  getTrustpilotReviews(status?: string): Promise<TrustpilotReview[]>;
  getModeratorReviews(moderatorId: number): Promise<TrustpilotReview[]>;
  reviewTrustpilotReview(reviewId: number, adminId: number, status: string, adminComments?: string): Promise<void>;
  
  // Shift schedules
  getAllSchedules(): Promise<ShiftSchedule[]>;
  getSchedulesByTeam(team: string): Promise<ShiftSchedule[]>;
  getUserSchedule(userId: number): Promise<ShiftSchedule | undefined>;
  createSchedule(schedule: InsertShiftSchedule): Promise<ShiftSchedule>;
  updateSchedule(scheduleId: number, schedule: Partial<InsertShiftSchedule>): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Omit<UpsertUser, 'id'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async getAllModerators(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, "moderator"));
  }

  async updateUserStatus(id: number, isActive: boolean): Promise<void> {
    await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async markAttendance(attendance: InsertAttendance): Promise<AttendanceRecord> {
    const [record] = await db
      .insert(attendanceRecords)
      .values(attendance)
      .returning();
    return record;
  }

  async getTodayAttendance(userId: number): Promise<AttendanceRecord | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [record] = await db
      .select()
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.userId, userId),
          gte(attendanceRecords.date, today),
          lte(attendanceRecords.date, tomorrow)
        )
      );
    return record;
  }

  async getUserAttendanceHistory(userId: number, limit = 30): Promise<AttendanceRecord[]> {
    return await db
      .select()
      .from(attendanceRecords)
      .where(eq(attendanceRecords.userId, userId))
      .orderBy(desc(attendanceRecords.date))
      .limit(limit);
  }

  async getAttendanceByDateRange(userId: number, startDate: Date, endDate: Date): Promise<AttendanceRecord[]> {
    return await db
      .select()
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.userId, userId),
          gte(attendanceRecords.date, startDate),
          lte(attendanceRecords.date, endDate)
        )
      )
      .orderBy(desc(attendanceRecords.date));
  }

  async createLoginLog(loginLog: InsertLoginLog): Promise<LoginLog> {
    const [log] = await db
      .insert(loginLogs)
      .values(loginLog)
      .returning();
    return log;
  }

  async updateLogoutTime(userId: number, logoutTime: Date): Promise<void> {
    await db
      .update(loginLogs)
      .set({ logoutTime })
      .where(
        and(
          eq(loginLogs.userId, userId),
          isNull(loginLogs.logoutTime)
        )
      );
  }

  async getUserLoginHistory(userId: number, limit = 50): Promise<LoginLog[]> {
    return await db
      .select()
      .from(loginLogs)
      .where(eq(loginLogs.userId, userId))
      .orderBy(desc(loginLogs.loginTime))
      .limit(limit);
  }

  async getModeratorStats(): Promise<any> {
    const [totalModerators] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "moderator"));

    const [activeModerators] = await db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.role, "moderator"), eq(users.isActive, true)));

    return {
      total: totalModerators.count,
      active: activeModerators.count,
      inactive: totalModerators.count - activeModerators.count,
    };
  }

  async getAttendanceStats(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayAttendance] = await db
      .select({ count: count() })
      .from(attendanceRecords)
      .where(
        and(
          gte(attendanceRecords.date, today),
          lte(attendanceRecords.date, tomorrow)
        )
      );

    const [totalAttendance] = await db
      .select({ count: count() })
      .from(attendanceRecords);

    return {
      today: todayAttendance.count,
      total: totalAttendance.count,
    };
  }

  async getLoginStats(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayLogins] = await db
      .select({ count: count() })
      .from(loginLogs)
      .where(
        and(
          gte(loginLogs.loginTime, today),
          lte(loginLogs.loginTime, tomorrow)
        )
      );

    const [totalLogins] = await db
      .select({ count: count() })
      .from(loginLogs);

    return {
      today: todayLogins.count,
      total: totalLogins.count,
    };
  }

  async logAdminAction(adminId: number, action: string, targetUserId?: number, details?: string, ipAddress?: string): Promise<void> {
    await db.insert(adminActions).values({
      adminId,
      action,
      targetUserId,
      details,
      ipAddress: ipAddress || "unknown",
    });
  }

  async createTrustpilotReview(review: InsertTrustpilotReview): Promise<TrustpilotReview> {
    const [newReview] = await db.insert(trustpilotReviews).values(review).returning();
    return newReview;
  }

  async getTrustpilotReviews(status?: string): Promise<TrustpilotReview[]> {
    if (status) {
      return await db.select()
        .from(trustpilotReviews)
        .where(eq(trustpilotReviews.status, status as any))
        .orderBy(desc(trustpilotReviews.submittedAt));
    }
    return await db.select()
      .from(trustpilotReviews)
      .orderBy(desc(trustpilotReviews.submittedAt));
  }

  async getModeratorReviews(moderatorId: number): Promise<TrustpilotReview[]> {
    return await db.select()
      .from(trustpilotReviews)
      .where(eq(trustpilotReviews.moderatorId, moderatorId))
      .orderBy(desc(trustpilotReviews.submittedAt));
  }

  async reviewTrustpilotReview(reviewId: number, adminId: number, status: string, adminComments?: string): Promise<void> {
    await db.update(trustpilotReviews)
      .set({
        status: status as any,
        adminReviewId: adminId,
        adminComments,
        reviewedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(trustpilotReviews.id, reviewId));
  }
}

export const storage = new DatabaseStorage();