import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Send, Upload, X } from "lucide-react";
import CodeEditor from "@/components/CodeEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ProblemForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [codeSnippet, setCodeSnippet] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    environment: "",
    maxBudget: "10.00",
    scheduleType: "smart",
    category: "bug",
    severity: "medium",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create problem with code snippet in description
      const fullDescription = codeSnippet
        ? `${formData.description}\n\n### Code Snippet:\n\`\`\`\n${codeSnippet}\n\`\`\``
        : formData.description;

      const { data: problem, error: problemError } = await supabase
        .from("problems")
        .insert({
          user_id: user.id,
          title: formData.title,
          description: fullDescription,
          environment_info: { environment: formData.environment },
          max_budget: parseFloat(formData.maxBudget),
          category: formData.category,
          severity: formData.severity,
        })
        .select()
        .single();

      if (problemError) throw problemError;

      // Upload files if any
      if (files.length > 0) {
        const fileUploads = files.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${problem.id}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('problem-files')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('problem-files')
            .getPublicUrl(fileName);

          await supabase.from('problem_files').insert({
            problem_id: problem.id,
            file_url: publicUrl,
            file_type: file.type,
          });
        });

        await Promise.all(fileUploads);
      }

      // Create initial reasoning sessions
      const now = new Date();
      const sessions = [
        { layer_name: "Quick Fixes", layer_order: 0, schedule_time: new Date(now.getTime() + 1000).toISOString() },
        { layer_name: "Deep Debugging", layer_order: 1, schedule_time: new Date(now.getTime() + 60 * 1000).toISOString() },
        { layer_name: "Architectural Review", layer_order: 2, schedule_time: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString() },
        { layer_name: "Refactor Strategies", layer_order: 3, schedule_time: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString() },
        { layer_name: "Complete Redesign", layer_order: 4, schedule_time: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString() },
      ];

      const { error: sessionsError } = await supabase
        .from("reasoning_sessions")
        .insert(
          sessions.map(s => ({
            problem_id: problem.id,
            ...s,
          }))
        );

      if (sessionsError) throw sessionsError;

      // Trigger immediate reasoning
      await supabase.functions.invoke("process-insight", {
        body: { problemId: problem.id, layerOrder: 0 },
      });

      toast.success("Problem submitted! AI is starting to think...");
      navigate(`/problem/${problem.id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Submit Your Problem</CardTitle>
            <CardDescription>
              Describe what you're stuck on. AI will keep thinking and evolving solutions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Problem Title</Label>
                <Input
                  id="title"
                  placeholder="React component not re-rendering on state change"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <Tabs defaultValue="description" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="code">Code Snippet</TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="space-y-2">
                  <Label htmlFor="description">Detailed Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Include error messages, what you've tried, and what you expect to happen..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    disabled={loading}
                    rows={8}
                  />
                </TabsContent>
                <TabsContent value="code" className="space-y-2">
                  <CodeEditor
                    value={codeSnippet}
                    onChange={setCodeSnippet}
                    disabled={loading}
                  />
                </TabsContent>
              </Tabs>

              <div className="space-y-2">
                <Label htmlFor="files">Attach Files (logs, screenshots, etc.)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="files"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    disabled={loading}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('files')?.click()}
                    disabled={loading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Files
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {files.length > 0 ? `${files.length} file(s) selected` : 'No files chosen'}
                  </span>
                </div>
                {files.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded-md"
                      >
                        <span className="text-sm truncate flex-1">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          disabled={loading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="environment">Environment Info</Label>
                <Input
                  id="environment"
                  placeholder="React 18, Node 20, TypeScript 5.3..."
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bug">Bug</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="ui">UI</SelectItem>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value) => setFormData({ ...formData, severity: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Max AI Budget ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    min="1"
                    max="100"
                    value={formData.maxBudget}
                    onChange={(e) => setFormData({ ...formData, maxBudget: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schedule">Notification Preference</Label>
                  <Select
                    value={formData.scheduleType}
                    onValueChange={(value) => setFormData({ ...formData, scheduleType: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smart">Smart (Only Important)</SelectItem>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="hourly">Hourly Summary</SelectItem>
                      <SelectItem value="daily">Daily Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting..." : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Start AI Reasoning
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProblemForm;
