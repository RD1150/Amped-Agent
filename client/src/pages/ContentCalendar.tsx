import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Sparkles,
  Calendar as CalendarIcon,
  MoreHorizontal,
  Send,
  Eye,
  Video
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import ConvertToVideoModal from "@/components/ConvertToVideoModal";

const DAYS = ["SUN", "MON", "TUE", "WED", "THUR", "FRI", "SAT"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

type ContentType = "property_listing" | "market_report" | "trending_news" | "tips" | "neighborhood" | "custom";

export default function ContentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isConvertVideoOpen, setIsConvertVideoOpen] = useState(false);
  const [postToConvert, setPostToConvert] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState<ContentType>("custom");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isGeneratingMonth, setIsGeneratingMonth] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  const utils = trpc.useUtils();
  
  const { data: calendarEvents = [], isLoading: eventsLoading } = trpc.calendar.list.useQuery({
    startDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
    endDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
  });

  const { data: contentPosts = [] } = trpc.content.list.useQuery();

  const createContent = trpc.content.create.useMutation({
    onSuccess: () => {
      utils.content.list.invalidate();
      utils.calendar.list.invalidate();
      toast.success("Content created successfully");
      setIsCreateDialogOpen(false);
      setTopic("");
    },
  });

  const createCalendarEvent = trpc.calendar.create.useMutation({
    onSuccess: () => {
      utils.calendar.list.invalidate();
    },
  });

  const generateContent = trpc.content.generate.useMutation();

  const deleteContent = trpc.content.delete.useMutation({
    onSuccess: () => {
      utils.content.list.invalidate();
      utils.calendar.list.invalidate();
      toast.success("Content deleted");
    },
  });

  const { data: ghlSettings } = trpc.ghl.getSettings.useQuery();
  const { data: socialAccounts } = trpc.ghl.getSocialAccounts.useQuery(
    undefined,
    { 
      enabled: !!ghlSettings?.isConnected,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  const pushToGHL = trpc.ghl.pushToSocialPlanner.useMutation({
    onSuccess: () => {
      utils.content.list.invalidate();
      toast.success("Successfully pushed to GHL Social Planner!");
    },
    onError: (error) => {
      toast.error(`Failed to push to GHL: ${error.message}`);
    },
  });

  // Get GHL connection status
  const isGHLConnected = ghlSettings?.isConnected && ghlSettings?.apiKey && ghlSettings?.locationId;

  const handleOpenPublishDialog = (postId: number) => {
    // Check if GHL is connected
    if (!isGHLConnected) {
      toast.error("Please connect GoHighLevel in Integrations first");
      return;
    }

    setSelectedPostId(postId);
    setIsPublishDialogOpen(true);
  };

  const handlePublishNow = async () => {
    if (!selectedPostId) {
      toast.error("No post selected");
      return;
    }

    const accountIds = socialAccounts?.accounts.map((acc: any) => acc.id) || [];
    
    if (accountIds.length === 0) {
      toast.error("No social accounts connected in GoHighLevel");
      return;
    }

    pushToGHL.mutate({
      contentPostId: selectedPostId,
      accountIds,
    });

    setIsPublishDialogOpen(false);
    setSelectedPostId(null);
  };

  const handleSchedulePost = () => {
    if (!selectedPostId || !scheduleDate || !scheduleTime) {
      toast.error("Please select date and time");
      return;
    }

    const accountIds = socialAccounts?.accounts.map((acc: any) => acc.id) || [];
    const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
    
    pushToGHL.mutate({
      contentPostId: selectedPostId,
      accountIds,
      scheduledAt: scheduledDateTime,
    });

    setIsPublishDialogOpen(false);
    setSelectedPostId(null);
    setScheduleDate("");
    setScheduleTime("");
  };

  const selectedPostForPublish = contentPosts.find(p => p.id === selectedPostId);

  const generateFullMonth = trpc.content.generateFullMonth.useMutation({
    onSuccess: (data) => {
      utils.content.list.invalidate();
      utils.calendar.list.invalidate();
      toast.success(`Successfully generated ${data.postsCreated} posts for the month!`);
      setIsGeneratingMonth(false);
    },
    onError: (error) => {
      toast.error(`Failed to generate month: ${error.message}`);
      setIsGeneratingMonth(false);
    },
  });

  const handleGenerateFullMonth = () => {
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    setIsGeneratingMonth(true);
    generateFullMonth.mutate({ startDate });
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const days: (Date | null)[] = [];

    // Add padding for days before the first of the month
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentDate]);

  const getEventsForDate = (date: Date) => {
    return calendarEvents.filter(event => {
      const eventDate = new Date(event.eventDate);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getPostsForDate = (date: Date) => {
    return contentPosts.filter(post => {
      if (!post.scheduledAt) return false;
      const postDate = new Date(post.scheduledAt);
      return (
        postDate.getDate() === date.getDate() &&
        postDate.getMonth() === date.getMonth() &&
        postDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleCreateContent = async (useAI: boolean) => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    let content = topic;

    if (useAI) {
      setIsGenerating(true);
      try {
        const result = await generateContent.mutateAsync({
          topic,
          contentType,
        });
        content = result.content;
      } catch (error) {
        toast.error("Failed to generate content");
        setIsGenerating(false);
        return;
      }
      setIsGenerating(false);
    }

    const post = await createContent.mutateAsync({
      title: topic,
      content,
      contentType,
      status: selectedDate ? "scheduled" : "draft",
      scheduledAt: selectedDate || undefined,
      aiGenerated: useAI,
    });

    if (selectedDate && post.id) {
      await createCalendarEvent.mutateAsync({
        contentPostId: post.id,
        title: topic,
        eventDate: selectedDate,
        eventTime: "09:00",
        eventType: "post",
      });
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary" className="text-xs">Draft</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-500/20 text-blue-400 text-xs">Scheduled</Badge>;
      case "published":
        return <Badge className="bg-green-500/20 text-green-400 text-xs">Published</Badge>;
      case "expired":
        return <Badge className="bg-red-500/20 text-red-400 text-xs">Expired</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Let's plan your social media content</h1>
          <p className="text-muted-foreground mt-1">
            Tell us what you want to write about. We'll come up with interesting topics based on your idea.
          </p>
        </div>
      </div>

      {/* Content Creation Bar */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                What would you like your content to focus on this week?
              </label>
              <Input
                placeholder="e.g., Top home renovations that add the most value"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleGenerateFullMonth}
                disabled={isGeneratingMonth}
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                {isGeneratingMonth ? "Generating..." : "Generate Full Month"}
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-black text-white hover:bg-black/80 border border-border">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle>Create Content</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Topic</label>
                      <Textarea
                        placeholder="Enter your topic or idea..."
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="bg-secondary border-border min-h-[100px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Content Type</label>
                      <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="property_listing">Property Listing</SelectItem>
                          <SelectItem value="market_report">Market Report</SelectItem>
                          <SelectItem value="trending_news">Trending News</SelectItem>
                          <SelectItem value="tips">Tips & Advice</SelectItem>
                          <SelectItem value="neighborhood">Neighborhood Spotlight</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Schedule Date (Optional)</label>
                      <Input
                        type="date"
                        onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
                        className="bg-secondary border-border"
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => handleCreateContent(true)}
                        disabled={isGenerating || !topic.trim()}
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {isGenerating ? (
                          <>
                            <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate with AI
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleCreateContent(false)}
                        disabled={!topic.trim()}
                      >
                        Save as Draft
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Schedule and Publish
              </Button>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setTopic("Suggest a trending real estate topic")}>
              <Sparkles className="h-3 w-3 mr-1" />
              Suggest Topic
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => { setContentType("trending_news"); setIsCreateDialogOpen(true); }}>
              📰 Create Trending News Post
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => { setContentType("property_listing"); setIsCreateDialogOpen(true); }}>
              🏠 Create Property Listing Post
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => { setContentType("market_report"); setIsCreateDialogOpen(true); }}>
              📊 Create Market Report Post
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-xl font-semibold">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {DAYS.map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-r border-border last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((date, index) => (
              <div
                key={index}
                className={`min-h-[120px] p-2 border-r border-b border-border last:border-r-0 ${
                  date ? (isToday(date) ? "bg-primary/5 ring-2 ring-primary ring-inset" : "hover:bg-secondary/50") : "bg-muted/20"
                }`}
              >
                {date && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${isToday(date) ? "text-primary" : "text-foreground"}`}>
                        {date.getDate()}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setSelectedDate(date);
                          setIsCreateDialogOpen(true);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {getPostsForDate(date).slice(0, 3).map(post => (
                        <div
                          key={post.id}
                          className="group relative p-1.5 rounded text-xs bg-secondary hover:bg-secondary/80 cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate flex-1">{post.title || "Untitled"}</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-4 w-4 opacity-0 group-hover:opacity-100">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleOpenPublishDialog(post.id)}>
                                  <Send className="h-4 w-4 mr-2" />
                                  Publish to Social Media
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteContent.mutate({ id: post.id })}>
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {getStatusBadge(post.status || "draft")}
                        </div>
                      ))}
                      {getPostsForDate(date).length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{getPostsForDate(date).length - 3} more
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Posts */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Recent Content</CardTitle>
        </CardHeader>
        <CardContent>
          {contentPosts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No content created yet. Start by generating your first post!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contentPosts.slice(0, 5).map(post => (
                <div key={post.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{post.title || "Untitled"}</p>
                    <p className="text-sm text-muted-foreground truncate">{post.content.substring(0, 100)}...</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {getStatusBadge(post.status || "draft")}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => {
                          setSelectedPost(post);
                          setIsViewDialogOpen(true);
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          View/Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenPublishDialog(post.id)}>
                          <Send className="h-4 w-4 mr-2" />
                          Publish to Social Media
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteContent.mutate({ id: post.id })}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Publish to Social Media Dialog */}
      <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Publish to Social Media</DialogTitle>
          </DialogHeader>
          
          {selectedPostForPublish && (
            <div className="space-y-4">
              <div className="bg-secondary p-4 rounded-lg border border-border">
                <p className="text-xs text-muted-foreground mb-2">Post Preview</p>
                <p className="font-medium">{selectedPostForPublish.title || "Untitled"}</p>
                <p className="text-sm text-muted-foreground line-clamp-3">{selectedPostForPublish.content}</p>
                {selectedPostForPublish.imageUrl && (
                  <img src={selectedPostForPublish.imageUrl} alt="Post preview" className="w-full h-32 object-cover rounded" />
                )}
              </div>

              {/* GHL Social Accounts Info */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Posting Through GoHighLevel</label>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    This post will be published to all social media accounts connected in your GoHighLevel location.
                  </p>
                  {socialAccounts?.accounts && socialAccounts.accounts.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {socialAccounts.accounts.length} account(s) connected
                    </p>
                  )}
                </div>
              </div>

              {/* Schedule Options */}
              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Schedule Date (Optional)</label>
                  <Input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {scheduleDate && (
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Schedule Time</label>
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {scheduleDate && scheduleTime ? (
                  <Button 
                    onClick={handleSchedulePost} 
                    className="flex-1"
                    disabled={pushToGHL.isPending}
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Schedule Post
                  </Button>
                ) : (
                  <Button 
                    onClick={handlePublishNow} 
                    className="flex-1"
                    disabled={pushToGHL.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Publish Now
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => setIsPublishDialogOpen(false)}
                  disabled={pushToGHL.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View/Edit Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle>View/Edit Post</DialogTitle>
          </DialogHeader>
          
          {selectedPost && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={selectedPost.title || ""}
                  onChange={(e) => setSelectedPost({...selectedPost, title: e.target.value})}
                  className="mt-1"
                  placeholder="Post title"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={selectedPost.content}
                  onChange={(e) => setSelectedPost({...selectedPost, content: e.target.value})}
                  className="mt-1 min-h-[200px]"
                  placeholder="Post content"
                />
              </div>
              
              {selectedPost.imageUrl && (
                <div>
                  <label className="text-sm font-medium">Image</label>
                  <img 
                    src={selectedPost.imageUrl} 
                    alt="Post image" 
                    className="mt-1 w-full max-h-64 object-cover rounded border"
                  />
                  {selectedPost.format === 'carousel' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => {
                        setPostToConvert(selectedPost);
                        setIsConvertVideoOpen(true);
                        setIsViewDialogOpen(false);
                      }}
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Convert to Video
                    </Button>
                  )}
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={() => {
                    // TODO: Add update mutation
                    toast.success("Post updated");
                    setIsViewDialogOpen(false);
                  }}
                  className="flex-1"
                >
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Convert to Video Modal */}
      {postToConvert && (
        <ConvertToVideoModal
          open={isConvertVideoOpen}
          onOpenChange={setIsConvertVideoOpen}
          postId={postToConvert.id}
          carouselImages={(() => {
            if (!postToConvert.imageUrl) return [];
            try {
              // Try to parse as JSON array first (for carousel posts)
              const parsed = JSON.parse(postToConvert.imageUrl);
              return Array.isArray(parsed) ? parsed : [postToConvert.imageUrl];
            } catch {
              // If not JSON, treat as single image URL
              return [postToConvert.imageUrl];
            }
          })()}
          onVideoGenerated={(videoUrl) => {
            toast.success("Video generated successfully!");
            setIsConvertVideoOpen(false);
            setPostToConvert(null);
            // Refresh posts
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
