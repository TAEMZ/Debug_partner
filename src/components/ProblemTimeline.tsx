import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Clock, Loader2, Pause, Play, XCircle, Archive } from "lucide-react";

interface Problem {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  archived: boolean;
}

interface Session {
  id: string;
  layer_name: string;
  layer_order: number;
  schedule_time: string;
  completed_at: string | null;
  status: string;
}

interface Insight {
  id: string;
  content: string;
  insight_type: string;
  code_samples: any;
  is_significant: boolean;
  created_at: string;
  session_id: string;
}

const ProblemTimeline = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadData();

    const channel = supabase
      .channel(`problem_${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "insights",
          filter: `problem_id=eq.${id}`,
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const loadData = async () => {
    try {
      const [problemRes, sessionsRes, insightsRes] = await Promise.all([
        supabase.from("problems").select("*").eq("id", id).single(),
        supabase.from("reasoning_sessions").select("*").eq("problem_id", id).order("layer_order"),
        supabase.from("insights").select("*").eq("problem_id", id).order("created_at"),
      ]);

      if (problemRes.error) throw problemRes.error;
      if (sessionsRes.error) throw sessionsRes.error;
      if (insightsRes.error) throw insightsRes.error;

      setProblem(problemRes.data);
      setSessions(sessionsRes.data);
      setInsights(insightsRes.data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleProblemStatus = async () => {
    if (!problem) return;

    const newStatus = problem.status === "active" ? "paused" : "active";
    const { error } = await supabase
      .from("problems")
      .update({ status: newStatus })
      .eq("id", problem.id);

    if (error) {
      toast.error(error.message);
    } else {
      setProblem({ ...problem, status: newStatus });
      toast.success(newStatus === "active" ? "Reasoning resumed" : "Reasoning paused");
    }
  };

  const markResolved = async () => {
    if (!problem) return;

    const { error } = await supabase
      .from("problems")
      .update({ status: "resolved" })
      .eq("id", problem.id);

    if (error) {
      toast.error(error.message);
    } else {
      setProblem({ ...problem, status: "resolved" });
      toast.success("Problem marked as resolved!");
    }
  };

  const toggleArchive = async () => {
    if (!problem) return;

    const newArchived = !problem.archived;
    const { error } = await supabase
      .from("problems")
      .update({ archived: newArchived })
      .eq("id", problem.id);

    if (error) {
      toast.error(error.message);
    } else {
      setProblem({ ...problem, archived: newArchived });
      toast.success(newArchived ? "Problem archived" : "Problem unarchived");
      if (newArchived) navigate("/dashboard");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Problem not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2">
            {problem.status !== "resolved" && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleProblemStatus}
              >
                {problem.status === "active" ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </>
                )}
              </Button>
            )}
            {problem.status !== "resolved" && (
              <Button size="sm" onClick={markResolved}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark Resolved
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={toggleArchive}>
              <Archive className="w-4 h-4 mr-2" />
              {problem.archived ? "Unarchive" : "Archive"}
            </Button>
          </div>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{problem.title}</CardTitle>
                <CardDescription className="mt-2">
                  {problem.description}
                </CardDescription>
              </div>
              <Badge
                variant={
                  problem.status === "active"
                    ? "default"
                    : problem.status === "resolved"
                      ? "secondary"
                      : "outline"
                }
              >
                {problem.status}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Reasoning Timeline</CardTitle>
            <CardDescription>AI insights evolving over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6">
                {sessions.map((session) => {
                  const sessionInsights = insights.filter((i) => i.session_id === session.id);

                  return (
                    <div key={session.id} className="relative pl-8 pb-6">
                      <div className="absolute left-0 top-2 w-4 h-4 rounded-full border-2 border-primary bg-background">
                        {session.status === "completed" && (
                          <CheckCircle2 className="w-3 h-3 text-success -m-[1px]" />
                        )}
                        {session.status === "processing" && (
                          <Loader2 className="w-3 h-3 text-ai-thinking animate-spin -m-[1px]" />
                        )}
                        {session.status === "pending" && (
                          <Clock className="w-3 h-3 text-muted-foreground -m-[1px]" />
                        )}
                        {session.status === "failed" && (
                          <XCircle className="w-3 h-3 text-destructive -m-[1px]" />
                        )}
                      </div>
                      {sessions.indexOf(session) < sessions.length - 1 && (
                        <div className="absolute left-[7px] top-6 w-[2px] h-full bg-border" />
                      )}

                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{session.layer_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.schedule_time).toLocaleString()}
                          </p>
                        </div>

                        {sessionInsights.length > 0 && (
                          <div className="space-y-2">
                            {sessionInsights.map((insight) => (
                              <Card key={insight.id} className="bg-card/50">
                                <CardContent className="pt-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <Badge variant="outline" className="capitalize">
                                      {insight.insight_type.replace("_", " ")}
                                    </Badge>
                                    {insight.is_significant && (
                                      <Badge className="bg-accent">Significant</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-foreground whitespace-pre-wrap">
                                    {insight.content}
                                  </p>
                                  {insight.code_samples && insight.code_samples.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                      {insight.code_samples.map((sample: any, idx: number) => (
                                        <pre key={idx} className="bg-code-bg p-3 rounded-md overflow-x-auto text-xs">
                                          <code className="text-primary">{sample}</code>
                                        </pre>
                                      ))}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProblemTimeline;
