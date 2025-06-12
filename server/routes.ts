import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupSession, setupAuthRoutes, requireAuth } from "./auth";
import { insertAttendanceSchema, insertLoginLogSchema, insertTrustpilotReviewSchema, reviewReviewSchema } from "@shared/schema";

function getClientIP(req: any): string {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         '0.0.0.0';
}

async function getLocationFromIP(ip: string): Promise<string> {
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return 'Local Network';
  }
  return 'Unknown Location';
}

const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Admin check error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  setupSession(app);
  app.set('trust proxy', true);
  await setupAuthRoutes(app);

  app.post('/api/auth/track-login', requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.session.userId;
      const ipAddress = getClientIP(req);
      const location = await getLocationFromIP(ipAddress);
      const userAgent = req.headers['user-agent'] || '';

      const loginData = insertLoginLogSchema.parse({
        userId,
        ipAddress,
        location,
        userAgent,
      });

      await storage.createLoginLog(loginData);
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking login:", error);
      res.status(500).json({ message: "Failed to track login" });
    }
  });

  app.post('/api/attendance/mark', requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.session.userId;
      const ipAddress = getClientIP(req);
      const location = await getLocationFromIP(ipAddress);
      const userAgent = req.headers['user-agent'] || '';

      const todayAttendance = await storage.getTodayAttendance(userId);
      if (todayAttendance) {
        return res.status(400).json({ 
          message: "Attendance already marked for today",
          attendance: todayAttendance 
        });
      }

      const attendanceData = insertAttendanceSchema.parse({
        userId,
        ipAddress,
        location,
        userAgent,
      });

      const attendance = await storage.markAttendance(attendanceData);
      res.json({ success: true, attendance });
    } catch (error) {
      console.error("Error marking attendance:", error);
      res.status(500).json({ message: "Failed to mark attendance" });
    }
  });

  app.get('/api/attendance/today', requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.session.userId;
      const attendance = await storage.getTodayAttendance(userId);
      res.json({ attendance });
    } catch (error) {
      console.error("Error fetching today's attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.get('/api/attendance/history', requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.session.userId;
      const limit = parseInt(req.query.limit as string) || 30;
      const history = await storage.getUserAttendanceHistory(userId, limit);
      res.json({ history });
    } catch (error) {
      console.error("Error fetching attendance history:", error);
      res.status(500).json({ message: "Failed to fetch attendance history" });
    }
  });

  app.get('/api/admin/moderators', requireAdmin, async (req: any, res: any) => {
    try {
      const moderators = await storage.getAllModerators();
      res.json({ moderators });
    } catch (error) {
      console.error("Error fetching moderators:", error);
      res.status(500).json({ message: "Failed to fetch moderators" });
    }
  });

  app.patch('/api/admin/moderators/:id/status', requireAdmin, async (req: any, res: any) => {
    try {
      const moderatorId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      await storage.updateUserStatus(moderatorId, isActive);
      
      await storage.logAdminAction(
        req.user.id,
        `${isActive ? 'Activated' : 'Deactivated'} moderator`,
        moderatorId,
        `Changed status to ${isActive ? 'active' : 'inactive'}`,
        getClientIP(req)
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating moderator status:", error);
      res.status(500).json({ message: "Failed to update moderator status" });
    }
  });

  app.get('/api/admin/stats', requireAdmin, async (req: any, res: any) => {
    try {
      const [moderatorStats, attendanceStats, loginStats] = await Promise.all([
        storage.getModeratorStats(),
        storage.getAttendanceStats(),
        storage.getLoginStats(),
      ]);

      res.json({
        moderators: moderatorStats,
        attendance: attendanceStats,
        logins: loginStats,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  app.post('/api/auth/logout-track', requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.session.userId;
      await storage.updateLogoutTime(userId, new Date());
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking logout:", error);
      res.status(500).json({ message: "Failed to track logout" });
    }
  });

  // Trustpilot Review Routes
  app.post('/api/reviews/submit', requireAuth, async (req: any, res: any) => {
    try {
      const moderatorId = req.session.userId;
      const reviewData = insertTrustpilotReviewSchema.parse({
        ...req.body,
        moderatorId
      });

      const review = await storage.createTrustpilotReview(reviewData);
      res.json({ success: true, review });
    } catch (error) {
      console.error("Error submitting review:", error);
      res.status(500).json({ message: "Failed to submit review" });
    }
  });

  app.get('/api/reviews/my-reviews', requireAuth, async (req: any, res: any) => {
    try {
      const moderatorId = req.session.userId;
      const reviews = await storage.getModeratorReviews(moderatorId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching moderator reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get('/api/admin/reviews', requireAdmin, async (req: any, res: any) => {
    try {
      const status = req.query.status as string;
      const reviews = await storage.getTrustpilotReviews(status);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews for admin:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post('/api/admin/reviews/:reviewId/review', requireAdmin, async (req: any, res: any) => {
    try {
      const reviewId = parseInt(req.params.reviewId);
      const adminId = req.session.userId;
      const { status, adminComments } = reviewReviewSchema.parse(req.body);

      await storage.reviewTrustpilotReview(reviewId, adminId, status, adminComments);
      
      const ipAddress = getClientIP(req);
      await storage.logAdminAction(
        adminId, 
        `reviewed_trustpilot_review_${status}`, 
        undefined, 
        `Review ID: ${reviewId}, Comments: ${adminComments || 'None'}`,
        ipAddress
      );

      res.json({ success: true });
    } catch (error) {
      console.error("Error reviewing review:", error);
      res.status(500).json({ message: "Failed to review review" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}