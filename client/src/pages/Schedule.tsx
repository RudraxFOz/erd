import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ShiftSchedule {
  id: number;
  userId: number;
  agentName: string;
  team: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Schedule() {
  const { user } = useAuth();

  const { data: schedules, isLoading } = useQuery<ShiftSchedule[]>({
    queryKey: ['/api/schedules'],
    enabled: !!user,
  });

  const { data: mySchedule } = useQuery<ShiftSchedule | null>({
    queryKey: ['/api/schedules/my-schedule'],
    enabled: !!user && user.role !== 'admin',
  });

  const getDaySchedule = (schedule: ShiftSchedule, day: keyof Pick<ShiftSchedule, 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'>) => {
    const timeSlot = schedule[day];
    return timeSlot === 'Off' ? 'Off' : timeSlot;
  };

  const getShiftBadgeVariant = (shift: string) => {
    if (shift === 'Off') return 'secondary' as const;
    if (shift?.includes('Morning') || shift?.includes('9:00')) return 'default' as const;
    if (shift?.includes('Evening') || shift?.includes('17:00')) return 'destructive' as const;
    return 'outline' as const;
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
  const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Shift Schedules</h1>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Shift Schedules</h1>
      </div>

      {user?.role !== 'admin' && mySchedule && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              My Schedule
            </CardTitle>
            <CardDescription>
              Your current shift schedule for the {mySchedule.team} team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{mySchedule.team}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{mySchedule.timezone}</span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => (
                <div key={day} className="text-center">
                  <div className="text-sm font-medium mb-2">{dayLabels[index]}</div>
                  <Badge variant={getShiftBadgeVariant(getDaySchedule(mySchedule, day))}>
                    {getDaySchedule(mySchedule, day)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {user?.role === 'admin' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">All Team Schedules</h2>
            <Badge variant="outline">{schedules?.length || 0} schedules</Badge>
          </div>
          
          {schedules?.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No schedules found</h3>
                <p className="text-muted-foreground">No shift schedules have been created yet.</p>
              </CardContent>
            </Card>
          )}

          {schedules?.map((schedule) => (
            <Card key={schedule.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{schedule.agentName}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={schedule.isActive ? "default" : "secondary"}>
                      {schedule.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardTitle>
                <CardDescription>
                  {schedule.team} Team • {schedule.timezone}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {days.map((day, index) => (
                    <div key={day} className="text-center">
                      <div className="text-sm font-medium mb-2">{dayLabels[index]}</div>
                      <Badge variant={getShiftBadgeVariant(getDaySchedule(schedule, day))}>
                        {getDaySchedule(schedule, day)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}