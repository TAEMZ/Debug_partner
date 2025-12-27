import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Checking for scheduled sessions...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find all pending sessions that are due
    const { data: dueSessions, error: sessionsError } = await supabase
      .from("reasoning_sessions")
      .select("*, problems!inner(*)")
      .eq("status", "pending")
      .lte("schedule_time", new Date().toISOString());

    if (sessionsError) throw sessionsError;

    console.log(`Found ${dueSessions?.length || 0} due sessions`);

    if (!dueSessions || dueSessions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No sessions due", processed: 0 }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Filter for active problems only
    const activeSessions = dueSessions.filter(
      (session: any) => session.problems.status === "active"
    );

    console.log(`${activeSessions.length} sessions for active problems`);

    // Process each session
    for (const session of activeSessions) {
      console.log(`Processing session ${session.id} for problem ${session.problem_id}`);

      try {
        // Call process-insight function
        const response = await fetch(
          `${supabaseUrl}/functions/v1/process-insight`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              problemId: session.problem_id,
              layerOrder: session.layer_order,
            }),
          }
        );

        if (!response.ok) {
          console.error(
            `Failed to process session ${session.id}:`,
            await response.text()
          );
          // Mark as failed
          await supabase
            .from("reasoning_sessions")
            .update({ status: "failed" })
            .eq("id", session.id);
        }
      } catch (error) {
        console.error(`Error processing session ${session.id}:`, error);
        await supabase
          .from("reasoning_sessions")
          .update({ status: "failed" })
          .eq("id", session.id);
      }
    }

    return new Response(
      JSON.stringify({
        message: "Sessions processed",
        processed: activeSessions.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in schedule-sessions:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
