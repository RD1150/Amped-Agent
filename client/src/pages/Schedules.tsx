import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar, Clock, Plus, Trash2, Edit, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const CONTENT_TYPES = [
  { value: "property_listing", label: "Property Listing" },
  { value: "market_report", label: "Market Report" },
  { value: "trending_news", label: "Trending News" },
  { value: "tips", label: "Tips & Advice" },
  { value: "neighborhood", label: "Neighborhood Spotlight" },
  { value: "custom", label: "Custom Content" },
];

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
];

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function Schedules() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [formData, setFormData] = useState<{
    name: string;
    contentType: "property_listing" | "market_report" | "trending_news" | "tips" | "neighborhood" | "custom";
    frequency: "daily" | "weekly" | "biweekly" | "monthly";
    dayOfWeek: number;
    dayOfMonth: number;
    timeOfDay: string;
    autoGenerate: boolean;
  }>({
    name: "",
    contentType: "property_listing",
    frequency: "weekly",
    dayOfWeek: 1,
    dayOfMonth: 1,
    timeOfDay: "09:00",
    autoGenerate: true,
  });

  const { data: schedules, isLoading, refetch } = trpc.schedules.list.useQuery();
  const createMutation = trpc.schedules.create.useMutation();
  const updateMutation = trpc.schedules.update.useMutation();
  const deleteMutation = trpc.schedules.delete.useMutation();

  const handleSubmit = async () => {
    try {
      if (editingSchedule) {
        await updateMutation.mutateAsync({
          id: editingSchedule.id,
          ...formData,
        });
        toast.success("Schedule updated successfully");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Schedule created successfully");
      }
      setDialogOpen(false);
      setEditingSchedule(null);
      resetForm();
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to save schedule");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Schedule deleted successfully");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete schedule");
    }
  };

  const handleToggleActive = async (schedule: any) => {
    try {
      await updateMutation.mutateAsync({
        id: schedule.id,
        isActive: !schedule.isActive,
      });
      toast.success(schedule.isActive ? "Schedule paused" : "Schedule activated");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to update schedule");
    }
  };

  const handleEdit = (schedule: any) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name,
      contentType: schedule.contentType,
      frequency: schedule.frequency,
      dayOfWeek: schedule.dayOfWeek || 1,
      dayOfMonth: schedule.dayOfMonth || 1,
      timeOfDay: schedule.timeOfDay,
      autoGenerate: schedule.autoGenerate,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      contentType: "property_listing",
      frequency: "weekly",
      dayOfWeek: 1,
      dayOfMonth: 1,
      timeOfDay: "09:00",
      autoGenerate: true,
    });
  };

  const getScheduleDescription = (schedule: any) => {
    const contentType = CONTENT_TYPES.find(t => t.value === schedule.contentType)?.label;
    const frequency = schedule.frequency;
    const time = schedule.timeOfDay;
    
    if (frequency === "daily") {
      return `${contentType} - Daily at ${time}`;
    } else if (frequency === "weekly" || frequency === "biweekly") {
      const day = DAYS_OF_WEEK.find(d => d.value === schedule.dayOfWeek)?.label;
      const period = frequency === "biweekly" ? "Bi-weekly" : "Weekly";
      return `${contentType} - ${period} on ${day} at ${time}`;
    } else if (frequency === "monthly") {
      return `${contentType} - Monthly on day ${schedule.dayOfMonth} at ${time}`;
    }
    return contentType;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Automated Posting Schedules</h1>
            <p className="text-muted-foreground mt-1">
              Set up recurring content patterns to automate your social media
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingSchedule(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingSchedule ? "Edit Schedule" : "Create New Schedule"}</DialogTitle>
                <DialogDescription>
                  Set up a recurring content pattern to automate your posting
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Schedule Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Monday Property Listings"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contentType">Content Type</Label>
                  <Select
                    value={formData.contentType}
                    onValueChange={(value: any) => setFormData({ ...formData, contentType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(formData.frequency === "weekly" || formData.frequency === "biweekly") && (
                  <div className="space-y-2">
                    <Label htmlFor="dayOfWeek">Day of Week</Label>
                    <Select
                      value={formData.dayOfWeek.toString()}
                      onValueChange={(value) => setFormData({ ...formData, dayOfWeek: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.frequency === "monthly" && (
                  <div className="space-y-2">
                    <Label htmlFor="dayOfMonth">Day of Month</Label>
                    <Input
                      id="dayOfMonth"
                      type="number"
                      min="1"
                      max="31"
                      value={formData.dayOfMonth}
                      onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="timeOfDay">Time of Day</Label>
                  <Input
                    id="timeOfDay"
                    type="time"
                    value={formData.timeOfDay}
                    onChange={(e) => setFormData({ ...formData, timeOfDay: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoGenerate"
                    checked={formData.autoGenerate}
                    onCheckedChange={(checked) => setFormData({ ...formData, autoGenerate: checked })}
                  />
                  <Label htmlFor="autoGenerate">Auto-generate content with AI</Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setDialogOpen(false);
                  setEditingSchedule(null);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={!formData.name || createMutation.isPending || updateMutation.isPending}>
                  {editingSchedule ? "Update" : "Create"} Schedule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-3/4 mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : schedules && schedules.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {schedules.map((schedule) => (
              <Card key={schedule.id} className={!schedule.isActive ? "opacity-60" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {schedule.name}
                        {schedule.isActive ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-500">
                            Paused
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {getScheduleDescription(schedule)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(schedule)}
                      >
                        {schedule.isActive ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(schedule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(schedule.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {schedule.nextRunAt ? new Date(schedule.nextRunAt).toLocaleDateString() : "Not scheduled"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {schedule.timeOfDay}
                    </div>
                    {schedule.autoGenerate && (
                      <span className="text-primary">AI Auto-generate</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No schedules yet</h3>
              <p className="text-sm text-muted-foreground mt-2 mb-4">
                Create your first automated posting schedule to save time
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Schedule
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
