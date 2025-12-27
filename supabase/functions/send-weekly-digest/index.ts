import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resend = {
  emails: {
    send: async (payload: any) => {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      return response.json();
    },
  },
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get users with weekly digest enabled
    const { data: users, error: usersError } = await supabase
      .from("email_preferences")
      .select("user_id")
      .eq("weekly_digest", true);

    if (usersError) throw usersError;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    for (const userPref of users || []) {
      // Get user's problems from the last week
      const { data: problems, error: problemsError } = await supabase
        .from("problems")
        .select(`
          *,
          insights(count)
        `)
        .eq("user_id", userPref.user_id)
        .gte("created_at", oneWeekAgo.toISOString());

      if (problemsError) continue;

      // Get insights count
      const { data: insights, error: insightsError } = await supabase
        .from("insights")
        .select("*, problems!inner(*)")
        .eq("problems.user_id", userPref.user_id)
        .gte("created_at", oneWeekAgo.toISOString());

      if (insightsError) continue;

      // Get user email
      const { data: { user } } = await supabase.auth.admin.getUserById(userPref.user_id);
      if (!user?.email) continue;

      const problemsCount = problems?.length || 0;
      const insightsCount = insights?.length || 0;
      const significantInsights = insights?.filter(i => i.is_significant).length || 0;

      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Your Weekly Debug Partner Summary</h1>
          <p>Here's what happened with your problems this week:</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0;">📊 Statistics</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 10px 0;">• <strong>${problemsCount}</strong> problems submitted</li>
              <li style="margin: 10px 0;">• <strong>${insightsCount}</strong> total insights generated</li>
              <li style="margin: 10px 0;">• <strong>${significantInsights}</strong> significant breakthroughs</li>
            </ul>
          </div>

          ${insights && insights.length > 0 ? `
            <h3 style="color: #666;">Recent Insights</h3>
            ${insights.slice(0, 3).map(insight => `
              <div style="background: #fff; border: 1px solid #e5e5e5; padding: 15px; border-radius: 8px; margin: 10px 0;">
                <p style="margin: 0; font-size: 14px;">${insight.content.substring(0, 150)}...</p>
              </div>
            `).join('')}
          ` : ''}

          <a href="${Deno.env.get('VITE_SUPABASE_URL')}" 
             style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            View Dashboard
          </a>

          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            You're receiving this because you have weekly digests enabled. 
            <a href="${Deno.env.get('VITE_SUPABASE_URL')}/settings" style="color: #666;">Manage preferences</a>
          </p>
        </div>
      `;

      await resend.emails.send({
        from: "Debug Partner <onboarding@resend.dev>",
        to: [user.email],
        subject: "Your Weekly Debug Partner Summary",
        html,
      });
    }

    return new Response(
      JSON.stringify({ success: true, processed: users?.length || 0 }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-weekly-digest:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});