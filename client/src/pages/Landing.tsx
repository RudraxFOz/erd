import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useTheme } from "@/components/ThemeProvider";
import { ClipboardCheck, Moon, Sun, Crown, User, Eye, EyeOff } from "lucide-react";

export default function Landing() {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"moderator" | "admin">("moderator");
  const { theme, setTheme } = useTheme();

  const handleLogin = () => {
    // Redirect to Replit Auth
    window.location.href = "/api/login";
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
            <ClipboardCheck className="text-white text-xl" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Attendance Portal</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Sign in to your account</p>
        </div>

        <Card className="bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-gray-700">
          <CardContent className="p-8">
            {/* Role Selection Tabs */}
            <Tabs value={selectedRole} onValueChange={(value) => setSelectedRole(value as "moderator" | "admin")} className="mb-6">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-slate-700">
                <TabsTrigger value="moderator" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Moderator
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  Admin
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <form className="space-y-6">
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  className="w-full"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full pr-12"
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <Label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-400">
                    Remember me
                  </Label>
                </div>
                <Button variant="link" className="text-sm text-blue-600 hover:text-blue-500 p-0">
                  Forgot password?
                </Button>
              </div>

              <Button
                type="button"
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 font-medium hover:from-blue-600 hover:to-blue-700 transform hover:scale-[1.02] transition-all duration-150 shadow-lg"
              >
                Sign In with Replit
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Secure login powered by Replit Auth
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Theme Toggle */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="flex items-center gap-2"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === "dark" ? "Light" : "Dark"} Mode
          </Button>
        </div>
      </div>
    </div>
  );
}
