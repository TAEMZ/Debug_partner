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

interface EmailNotification {
  to: string;
  type: "new_insight" | "comment" | "share" | "problem_resolved";
  data: {
    problemTitle?: string;
    insightContent?: string;
    commentContent?: string;
    sharedBy?: string;
    problemId?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, type, data }: EmailNotification = await req.json();

    let subject = "";
    let html = "";

    switch (type) {
      case "new_insight":
        subject = `New Insight for "${data.problemTitle}"`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">New Insight Available</h1>
            <p>A new reasoning insight is ready for your problem:</p>
            <h3 style="color: #666;">${data.problemTitle}</h3>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;">${data.insightContent?.substring(0, 200)}...</p>
            </div>
            <a href="${Deno.env.get('VITE_SUPABASE_URL')}" 
               style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
              View Full Insight
            </a>
          </div>
        `;
        break;

      case "comment":
        subject = `New Comment on "${data.problemTitle}"`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">New Comment</h1>
            <p>Someone commented on your problem:</p>
            <h3 style="color: #666;">${data.problemTitle}</h3>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;">${data.commentContent}</p>
            </div>
            <a href="${Deno.env.get('VITE_SUPABASE_URL')}" 
               style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
              View Comment
            </a>
          </div>
        `;
        break;

      case "share":
        subject = `${data.sharedBy} shared a problem with you`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Problem Shared With You</h1>
            <p><strong>${data.sharedBy}</strong> has shared a problem with you:</p>
            <h3 style="color: #666;">${data.problemTitle}</h3>
            <a href="${Deno.env.get('VITE_SUPABASE_URL')}" 
               style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
              View Problem
            </a>
          </div>
        `;
        break;

      case "problem_resolved":
        subject = `Problem Resolved: "${data.problemTitle}"`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #22c55e;">✓ Problem Resolved</h1>
            <p>Great news! Your problem has been marked as resolved:</p>
            <h3 style="color: #666;">${data.problemTitle}</h3>
            <a href="${Deno.env.get('VITE_SUPABASE_URL')}" 
               style="display: inline-block; background: #22c55e; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
              View Problem
            </a>
          </div>
        `;
        break;
    }

    const { error } = await resend.emails.send({
      from: "Debug Partner <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-email-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});