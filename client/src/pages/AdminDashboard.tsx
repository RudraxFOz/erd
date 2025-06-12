import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/ThemeProvider";
import { apiRequest } from "@/lib/queryClient";
import { 
  Crown, 
  Users, 
  UserCheck, 
  TrendingUp,
  Clock,
  Moon,
  Sun,
  LogOut,
  Download,
  Plus,
  Edit,
  Ban,
  MoreVertical,
  Wifi,
  MapPin,
  Star,
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  // Fetch admin stats
  const { data: adminStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  // Fetch moderators data
  const { data: moderatorsData, isLoading: moderatorsLoading } = useQuery({
    queryKey: ["/api/admin/moderators"],
  });

  // Toggle user status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      apiRequest("POST", `/api/admin/moderator/${userId}/toggle-status`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
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

  const handleExportCSV = () => {
    window.open("/api/admin/export/csv", "_blank");
    toast({
      title: "Success",
      description: "Data exported successfully!",
    });
  };

  const formatLastActive = (date: string | null) => {
    if (!date) return "Never";
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return "Recently";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Admin Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                <Crown className="text-white text-sm" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Admin Panel</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400">A</span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Admin</span>
              </div>
              
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Skeleton className="w-12 h-12 rounded-xl" />
                    </div>
                    <div className="ml-4">
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-8 w-12" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <Users className="text-blue-600 dark:text-blue-400 text-xl" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Moderators</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {adminStats?.totalModerators || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                        <UserCheck className="text-green-600 dark:text-green-400 text-xl" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Today</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {adminStats?.activeToday || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                        <TrendingUp className="text-amber-600 dark:text-amber-400 text-xl" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Attendance</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {adminStats?.avgAttendance || 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                        <Clock className="text-purple-600 dark:text-purple-400 text-xl" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Logins</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {adminStats?.totalLogins || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Moderators Management Table */}
        <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 mb-8">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                Moderator Management
              </CardTitle>
              <div className="flex items-center space-x-3">
                <Button 
                  onClick={handleExportCSV}
                  variant="outline"
                  className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                >
                  <Download className="mr-2 w-4 h-4" />
                  Export CSV
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="mr-2 w-4 h-4" />
                  Add Moderator
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-slate-700">
                    <TableHead className="text-gray-500 dark:text-gray-400 font-medium">Moderator</TableHead>
                    <TableHead className="text-gray-500 dark:text-gray-400 font-medium">Status</TableHead>
                    <TableHead className="text-gray-500 dark:text-gray-400 font-medium">Total Logins</TableHead>
                    <TableHead className="text-gray-500 dark:text-gray-400 font-medium">Last Active</TableHead>
                    <TableHead className="text-gray-500 dark:text-gray-400 font-medium">Location</TableHead>
                    <TableHead className="text-gray-500 dark:text-gray-400 font-medium">Attendance Rate</TableHead>
                    <TableHead className="text-gray-500 dark:text-gray-400 font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {moderatorsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex items-center">
                            <Skeleton className="w-10 h-10 rounded-full mr-4" />
                            <div>
                              <Skeleton className="h-4 w-24 mb-1" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                          </div>
                        </TableCell>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : moderatorsData?.moderators?.length > 0 ? (
                    moderatorsData.moderators.map((moderator: any) => (
                      <TableRow key={moderator.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-4">
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {moderator.firstName?.[0] || moderator.email[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {moderator.firstName} {moderator.lastName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {moderator.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={moderator.isActive ? "default" : "destructive"}
                            className={moderator.isActive 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            }
                          >
                            <div className={`w-2 h-2 rounded-full mr-1 ${
                              moderator.isActive ? 'bg-green-400' : 'bg-red-400'
                            }`}></div>
                            {moderator.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-900 dark:text-white">
                          {moderator.totalLogins || 0}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                          {formatLastActive(moderator.lastLogin)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center text-gray-900 dark:text-white mb-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              {moderator.lastLocation || 'Unknown'}
                            </div>
                            <div className="flex items-center text-gray-500 dark:text-gray-400">
                              <Wifi className="w-3 h-3 mr-1" />
                              <span className="text-xs">{moderator.lastIpAddress}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Progress 
                              value={moderator.attendanceRate || 0} 
                              className="flex-1 mr-2 h-2"
                            />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {moderator.attendanceRate || 0}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => toggleStatusMutation.mutate({
                                userId: moderator.id,
                                isActive: !moderator.isActive
                              })}
                              disabled={toggleStatusMutation.isPending}
                            >
                              <Ban className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">No moderators found</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Weekly Attendance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between space-x-2">
                {/* Simple bar chart mockup */}
                {Array.from({ length: 7 }).map((_, i) => {
                  const heights = [60, 80, 45, 90, 75, 85, 70];
                  return (
                    <div 
                      key={i}
                      className="flex-1 bg-blue-500 rounded-t transition-all hover:bg-blue-600" 
                      style={{ height: `${heights[i]}%` }}
                    ></div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Login Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Peak Hours</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">9:00 - 10:00 AM</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Average Daily Logins</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {Math.round((adminStats?.totalLogins || 0) / 30)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active Moderators</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {moderatorsData?.moderators?.filter((m: any) => m.isActive).length || 0}
                </span>
              </div>
              
              {/* 24-Hour Activity visualization */}
              <div className="mt-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">24-Hour Activity</p>
                <div className="grid grid-cols-24 gap-1">
                  {Array.from({ length: 24 }).map((_, hour) => {
                    // Peak activity during business hours
                    const isPeakHour = hour >= 8 && hour <= 18;
                    const isHighActivity = hour >= 9 && hour <= 10;
                    
                    return (
                      <div 
                        key={hour}
                        className={`h-8 rounded-sm ${
                          isHighActivity 
                            ? 'bg-blue-500' 
                            : isPeakHour 
                              ? 'bg-blue-400 opacity-80'
                              : 'bg-gray-200 dark:bg-slate-700 opacity-30'
                        }`}
                        title={`${hour}:00`}
                      ></div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
