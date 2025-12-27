import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Problem {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  category: string;
  severity: string;
}

export default function Archived() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadArchivedProblems();
  }, []);

  const loadArchivedProblems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("problems")
        .select("*")
        .eq("user_id", user.id)
        .eq("archived", true)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setProblems(data || []);
    } catch (error) {
      console.error("Error loading archived problems:", error);
      toast.error("Failed to load archived problems");
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (id: string) => {
    try {
      const { error } = await supabase
        .from("problems")
        .update({ archived: false })
        .eq("id", id);

      if (error) throw error;
      toast.success("Problem restored");
      loadArchivedProblems();
    } catch (error) {
      console.error("Error unarchiving problem:", error);
      toast.error("Failed to restore problem");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("problems")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Problem deleted permanently");
      loadArchivedProblems();
    } catch (error) {
      console.error("Error deleting problem:", error);
      toast.error("Failed to delete problem");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-muted rounded w-3/4 mb-4" />
              <div className="h-4 bg-muted rounded w-full mb-2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (problems.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Archived Problems</h1>
        <Card className="p-12 text-center">
          <Archive className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg text-muted-foreground mb-2">No archived problems</p>
          <p className="text-sm text-muted-foreground">
            Problems you archive will appear here
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Archived Problems</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {problems.map((problem) => (
          <Card
            key={problem.id}
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-lg line-clamp-2">{problem.title}</h3>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnarchive(problem.id);
                  }}
                >
                  <ArchiveRestore className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Are you sure you want to delete this problem permanently?")) {
                      handleDelete(problem.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              {problem.category && <Badge variant="secondary">{problem.category}</Badge>}
              {problem.severity && <Badge variant="outline">{problem.severity}</Badge>}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {problem.description}
            </p>
            <div className="text-xs text-muted-foreground">
              Archived {formatDistanceToNow(new Date(problem.created_at), { addSuffix: true })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
