import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Settings() {
  const [emailPrefs, setEmailPrefs] = useState({
    new_insights: true,
    comments: true,
    shares: true,
    weekly_digest: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("email_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      if (data) {
        setEmailPrefs({
          new_insights: data.new_insights ?? true,
          comments: data.comments ?? true,
          shares: data.shares ?? true,
          weekly_digest: data.weekly_digest ?? true,
        });
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("email_preferences")
        .upsert({
          user_id: user.id,
          ...emailPrefs,
        });

      if (error) throw error;
      toast.success("Preferences saved");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card className="p-6 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Email Notifications</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="new_insights">New Insights</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when new insights are generated
              </p>
            </div>
            <Switch
              id="new_insights"
              checked={emailPrefs.new_insights}
              onCheckedChange={(checked) =>
                setEmailPrefs({ ...emailPrefs, new_insights: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="comments">Comments</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about comments on your problems
              </p>
            </div>
            <Switch
              id="comments"
              checked={emailPrefs.comments}
              onCheckedChange={(checked) =>
                setEmailPrefs({ ...emailPrefs, comments: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="shares">Problem Shares</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when someone shares a problem with you
              </p>
            </div>
            <Switch
              id="shares"
              checked={emailPrefs.shares}
              onCheckedChange={(checked) =>
                setEmailPrefs({ ...emailPrefs, shares: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly_digest">Weekly Digest</Label>
              <p className="text-sm text-muted-foreground">
                Receive a weekly summary of your problems and insights
              </p>
            </div>
            <Switch
              id="weekly_digest"
              checked={emailPrefs.weekly_digest}
              onCheckedChange={(checked) =>
                setEmailPrefs({ ...emailPrefs, weekly_digest: checked })
              }
            />
          </div>
        </div>

        <Button
          className="mt-6"
          onClick={savePreferences}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </Card>
    </div>
  );
}
