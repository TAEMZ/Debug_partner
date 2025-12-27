import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-2xl px-4">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Brain className="w-20 h-20 text-primary animate-pulse" />
            <Sparkles className="w-10 h-10 text-accent absolute -top-2 -right-2" />
          </div>
        </div>
        <h1 className="mb-4 text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Debug Partner
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          AI that keeps thinking while you sleep. Submit your problems and get evolving solutions over time.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate("/auth")} size="lg">
            Get Started
          </Button>
          <Button onClick={() => navigate("/auth")} variant="outline" size="lg">
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
