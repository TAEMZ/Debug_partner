import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { FileText, MessageSquare, CheckCircle2, Share2 } from "lucide-react";

interface ActionDetails {
  problem_title?: string;
  insight_content?: string;
  comment_content?: string;
  [key: string]: string | undefined;
}

interface Activity {
  id: string;
  user_id: string;
  problem_id: string | null;
  action_type: string;
  action_details: ActionDetails;
  created_at: string;
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();

    // Subscribe to new activities
    const channel = supabase
      .channel("activities")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_feed",
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("activity_feed")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      setActivities(data || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (actionType: string) => {
    if (actionType.includes("problem")) return <FileText className="h-4 w-4" />;
    if (actionType.includes("comment")) return <MessageSquare className="h-4 w-4" />;
    if (actionType.includes("share")) return <Share2 className="h-4 w-4" />;
    return <CheckCircle2 className="h-4 w-4" />;
  };

  const getActivityText = (activity: Activity) => {
    const type = activity.action_type;
    if (type === "problems_created") return "created a new problem";
    if (type === "problems_updated") return "updated a problem";
    if (type === "insight_comments_created") return "commented on an insight";
    return type.replace("_", " ");
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No recent activity</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <Card key={activity.id} className="p-4 hover:bg-muted/50 transition-colors">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {getActivityIcon(activity.action_type)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <p className="text-sm">
                <span className="font-medium">You</span>{" "}
                {getActivityText(activity)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}