import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/ThemeProvider";
import { apiRequest } from "@/lib/queryClient";
import { 
  ClipboardCheck, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Moon,
  Sun,
  LogOut,
  Fingerprint,
  MapPin,
  Wifi,
  Star,
  MessageSquare,
  Send,
  Eye
} from "lucide-react";

export default function ModeratorDashboard() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  
  // Review form state
  const [reviewForm, setReviewForm] = useState({
    customerName: '',
    customerEmail: '',
    rating: 5,
    reviewText: '',
    businessResponse: '',
    screenshotUrl: ''
  });

  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);

  // Track login on component mount
  useEffect(() => {
    apiRequest("POST", "/api/auth/track-login").catch(() => {
      // Silently handle login tracking errors
    });
  }, []);

  // Fetch today's attendance
  const { data: todayAttendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ["/api/attendance/today"],
  });

  // Fetch user stats
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  // Fetch attendance history
  const { data: attendanceHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["/api/attendance/history/7"],
  });

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/attendance/mark"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/history/7"] });
      toast({
        title: "Success!",
        description: "Attendance marked successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark attendance",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear();
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: "Logout failed",
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Handle screenshot file upload
  const handleScreenshotUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Convert to base64 for storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        setReviewForm(prev => ({ ...prev, screenshotUrl: base64String }));
        setScreenshotFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Trustpilot review mutation
  const submitReviewMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/trustpilot/reviews", reviewForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trustpilot/reviews"] });
      toast({
        title: "Success!",
        description: "Trustpilot review submitted successfully",
      });
      // Reset form
      setReviewForm({
        customerName: '',
        customerEmail: '',
        rating: 5,
        reviewText: '',
        businessResponse: '',
        screenshotUrl: ''
      });
      setScreenshotFile(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.customerName || !reviewForm.customerEmail || !reviewForm.reviewText) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    submitReviewMutation.mutate();
  };

  // Generate weekly calendar data
  const getWeeklyCalendar = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);

    return days.map((day, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      
      const isWeekend = index >= 5;
      const isToday = date.toDateString() === today.toDateString();
      const hasAttendance = attendanceHistory.some((record: any) => 
        new Date(record.date).toDateString() === date.toDateString()
      );

      return {
        day,
        date: date.getDate(),
        isWeekend,
        isToday,
        hasAttendance,
      };
    });
  };

  const weeklyData = getWeeklyCalendar();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                <ClipboardCheck className="text-white text-sm" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Attendance Portal</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">M</span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Moderator</span>
              </div>
              
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Status Banner */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-8">
          <div className="flex items-center">
            <CheckCircle className="text-green-500 text-xl mr-3" />
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              System running perfectly – All logs synced in real-time
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Actions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Attendance Card */}
            <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                    Today's Attendance
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Live</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
                      {attendanceLoading ? (
                        <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Clock className="text-white text-xl" />
                        </div>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Status</p>
                      {attendanceLoading ? (
                        <Skeleton className="h-6 w-20 mx-auto mb-2" />
                      ) : (
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                          {todayAttendance ? "Marked" : "Not Marked"}
                        </p>
                      )}
                      {todayAttendance && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {new Date(todayAttendance.date).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button 
                      onClick={() => markAttendanceMutation.mutate()}
                      disabled={!!todayAttendance || markAttendanceMutation.isPending}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 font-medium hover:from-blue-600 hover:to-blue-700 transform hover:scale-[1.02] transition-all duration-150 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {markAttendanceMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Marking...
                        </>
                      ) : (
                        <>
                          <Fingerprint className="mr-2 w-4 h-4" />
                          {todayAttendance ? "Already Marked" : "Mark Attendance"}
                        </>
                      )}
                    </Button>
                    
                    {todayAttendance && (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
                          <div className="flex items-center mb-1">
                            <MapPin className="w-3 h-3 text-gray-500 mr-1" />
                            <p className="text-gray-500 dark:text-gray-400">Location</p>
                          </div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {todayAttendance.location || "Unknown"}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
                          <div className="flex items-center mb-1">
                            <Wifi className="w-3 h-3 text-gray-500 mr-1" />
                            <p className="text-gray-500 dark:text-gray-400">IP Address</p>
                          </div>
                          <p className="font-medium text-gray-900 dark:text-white text-xs">
                            {todayAttendance.ipAddress}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Calendar */}
            <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                    Weekly Overview
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Current Week
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-2">
                    {weeklyData.map((day, index) => (
                      <div key={index} className="text-center">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          {day.day}
                        </p>
                        <div 
                          className={`w-full h-12 rounded-lg flex items-center justify-center border ${
                            day.isWeekend 
                              ? 'bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-gray-600' 
                              : day.hasAttendance
                                ? 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800'
                                : day.isToday
                                  ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-600'
                                  : 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800'
                          }`}
                        >
                          {day.isWeekend ? (
                            <span className="text-gray-400 text-xs">Off</span>
                          ) : day.hasAttendance ? (
                            <CheckCircle className="text-green-600 dark:text-green-400 text-sm" />
                          ) : day.isToday ? (
                            <Clock className="text-blue-600 dark:text-blue-400 text-sm" />
                          ) : (
                            <XCircle className="text-red-600 dark:text-red-400 text-sm" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{day.date}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            {/* Stats Cards */}
            <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  This Month
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {statsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <div>
                          <Skeleton className="h-4 w-20 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-8" />
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                          <CheckCircle className="text-green-600 dark:text-green-400 w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Present Days</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">This month</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {userStats?.presentDays || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                          <XCircle className="text-red-600 dark:text-red-400 w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Working Days</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">This month</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {userStats?.workingDays || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <TrendingUp className="text-blue-600 dark:text-blue-400 w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Attendance Rate</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">This month</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        {userStats?.attendanceRate || 0}%
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {statsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))
                ) : userStats?.recentActivity?.length > 0 ? (
                  userStats.recentActivity.map((activity: any, index: number) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <LogOut className="text-blue-600 dark:text-blue-400 text-xs" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Logged in</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(activity.loginTime).toLocaleDateString()} at{' '}
                          {new Date(activity.loginTime).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
