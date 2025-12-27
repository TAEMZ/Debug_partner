import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Share2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ShareProblemDialogProps {
  problemId: string;
  problemTitle: string;
}

export function ShareProblemDialog({ problemId, problemTitle }: ShareProblemDialogProps) {
  const [email, setEmail] = useState("");
  const [accessLevel, setAccessLevel] = useState<"viewer" | "editor" | "admin">("viewer");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("problem_shares")
        .insert({
          problem_id: problemId,
          shared_by: user.id,
          shared_with_email: email.trim(),
          access_level: accessLevel,
        });

      if (error) throw error;

      // Send email notification
      await supabase.functions.invoke("send-email-notification", {
        body: {
          to: email,
          type: "share",
          data: {
            problemTitle,
            sharedBy: user.email || "Someone",
            problemId,
          },
        },
      });

      toast.success("Problem shared successfully");
      setEmail("");
    } catch (error: any) {
      console.error("Error sharing problem:", error);
      toast.error(error.message || "Failed to share problem");
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}/problem/${problemId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Problem</DialogTitle>
          <DialogDescription>
            Invite team members to collaborate on this problem
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="access">Access level</Label>
            <Select value={accessLevel} onValueChange={(v: any) => setAccessLevel(v)}>
              <SelectTrigger id="access">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer (read only)</SelectItem>
                <SelectItem value="editor">Editor (can comment)</SelectItem>
                <SelectItem value="admin">Admin (full access)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleShare} disabled={loading} className="w-full">
            Send Invitation
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={copyShareLink}
            className="w-full"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy share link
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}