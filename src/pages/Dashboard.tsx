import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Plus, LogOut, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Problem {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    try {
      const { data, error } = await supabase
        .from("problems")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProblems(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">Debug Partner</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Your Problems</h2>
            <p className="text-muted-foreground">
              AI continues thinking about these while you focus on other work
            </p>
          </div>
          <Button onClick={() => navigate("/submit")}>
            <Plus className="w-4 h-4 mr-2" />
            New Problem
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse border-border/50">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : problems.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Brain className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No problems submitted yet</h3>
              <p className="text-muted-foreground mb-4 text-center">
                Submit your first problem and let AI start generating evolving solutions
              </p>
              <Button onClick={() => navigate("/submit")}>
                <Plus className="w-4 h-4 mr-2" />
                Submit First Problem
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {problems.map((problem) => (
              <Card
                key={problem.id}
                className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/problem/${problem.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg line-clamp-2">{problem.title}</CardTitle>
                    <Badge
                      variant={
                        problem.status === "active"
                          ? "default"
                          : problem.status === "resolved"
                          ? "secondary"
                          : "outline"
                      }
                      className="ml-2 shrink-0"
                    >
                      {problem.status === "active" && <Clock className="w-3 h-3 mr-1" />}
                      {problem.status === "resolved" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {problem.status}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-3">
                    {problem.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {new Date(problem.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
