import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Clock, DollarSign, Target, CheckCircle2 } from "lucide-react";

interface AnalyticsData {
  totalProblems: number;
  resolvedProblems: number;
  totalInsights: number;
  totalCost: number;
  avgResolutionTime: number;
  problemsByCategory: Array<{ name: string; value: number }>;
  problemsBySeverity: Array<{ name: string; value: number }>;
}

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalProblems: 0,
    resolvedProblems: 0,
    totalInsights: 0,
    totalCost: 0,
    avgResolutionTime: 0,
    problemsByCategory: [],
    problemsBySeverity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all problems
      const { data: problems } = await supabase
        .from("problems")
        .select("*")
        .eq("user_id", user.id);

      // Fetch all insights
      const { data: insights } = await supabase
        .from("insights")
        .select("*, problems!inner(*)")
        .eq("problems.user_id", user.id);

      const totalProblems = problems?.length || 0;
      const resolvedProblems = problems?.filter(p => p.resolved_at).length || 0;
      const totalInsights = insights?.length || 0;
      const totalCost = problems?.reduce((sum, p) => sum + (Number(p.ai_cost) || 0), 0) || 0;

      // Calculate average resolution time
      const resolvedWithTime = problems?.filter(p => p.resolved_at && p.created_at) || [];
      const avgResolutionTime = resolvedWithTime.length > 0
        ? resolvedWithTime.reduce((sum, p) => {
          const created = new Date(p.created_at).getTime();
          const resolved = new Date(p.resolved_at!).getTime();
          return sum + (resolved - created) / (1000 * 60 * 60); // hours
        }, 0) / resolvedWithTime.length
        : 0;

      // Group by category
      const categoryCount: Record<string, number> = {};
      problems?.forEach(p => {
        const cat = p.category || 'other';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });

      // Group by severity
      const severityCount: Record<string, number> = {};
      problems?.forEach(p => {
        const sev = p.severity || 'medium';
        severityCount[sev] = (severityCount[sev] || 0) + 1;
      });

      setAnalytics({
        totalProblems,
        resolvedProblems,
        totalInsights,
        totalCost,
        avgResolutionTime,
        problemsByCategory: Object.entries(categoryCount).map(([name, value]) => ({ name, value })),
        problemsBySeverity: Object.entries(severityCount).map(([name, value]) => ({ name, value })),
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const resolutionRate = analytics.totalProblems > 0
    ? ((analytics.resolvedProblems / analytics.totalProblems) * 100).toFixed(1)
    : "0";

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-32 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Track your debugging progress and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Problems</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalProblems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.resolvedProblems}</div>
            <p className="text-xs text-muted-foreground">{resolutionRate}% resolution rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalInsights}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalCost.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgResolutionTime.toFixed(1)}h</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Problems by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.problemsByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.problemsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Problems by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.problemsBySeverity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}