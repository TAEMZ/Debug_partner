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
    // Read and log the raw body for debugging
    const bodyText = await req.text();
    console.log("Raw request body:", bodyText);

    if (!bodyText || bodyText.trim() === "") {
      console.error("Empty request body received");
      return new Response(
        JSON.stringify({ error: "Request body is empty" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(bodyText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { problemId, layerOrder } = parsedBody;
    console.log("Processing insight for problem:", problemId, "layer:", layerOrder);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiapikey = Deno.env.get("GEMINI_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get problem details
    const { data: problem, error: problemError } = await supabase
      .from("problems")
      .select("*")
      .eq("id", problemId)
      .single();

    if (problemError) throw problemError;

    // Get the session for this layer
    const { data: session, error: sessionError } = await supabase
      .from("reasoning_sessions")
      .select("*")
      .eq("problem_id", problemId)
      .eq("layer_order", layerOrder)
      .single();

    if (sessionError) throw sessionError;

    // Update session status to processing
    await supabase
      .from("reasoning_sessions")
      .update({ status: "processing" })
      .eq("id", session.id);

    // Get previous insights to avoid repetition
    const { data: previousInsights } = await supabase
      .from("insights")
      .select("content, insight_type")
      .eq("problem_id", problemId)
      .lt("created_at", new Date().toISOString());

    const previousSummary = previousInsights
      ?.map((i) => `[${i.insight_type}] ${i.content.substring(0, 100)}...`)
      .join("\n") || "None";

    // Build context-aware prompt
    const systemPrompt = `You are an expert debugging AI that generates increasingly sophisticated solutions over time.

Layer: ${session.layer_name} (Level ${layerOrder})
Expected depth: ${getDepthInstructions(layerOrder)}

Previous insights to avoid repeating:
${previousSummary}

CRITICAL RULES:
- Do NOT repeat previous suggestions
- Go DEEPER than before
- Provide CONCRETE, actionable code
- Be SPECIFIC with file names, line numbers, patterns
- Include working code examples
- Explain WHY, not just what`;

    const userPrompt = `Problem: ${problem.title}

Description:
${problem.description}

Environment: ${JSON.stringify(problem.environment_info)}

Generate ${layerOrder === 0 ? "3" : "2-3"} distinct, non-repetitive solutions at the ${session.layer_name} level.`;


    // Call Google Gemini API with correct endpoint
    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiapikey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\n${userPrompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 8192, // Increased to handle thinking models
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Gemini API error:", aiResponse.status, errorText);
      throw new Error(`Gemini API error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();

    // Extract content from Gemini response format
    let generatedText = "";
    const candidate = aiData.candidates?.[0];

    if (candidate?.content?.parts?.[0]?.text) {
      generatedText = candidate.content.parts[0].text;
    } else if (candidate?.finishReason === "MAX_TOKENS") {
      console.warn("Gemini hit MAX_TOKENS limit. Returning partial or fallback content.");
      generatedText = "AI reasoning was cut off due to token limits. Here is a summary of what could be determined:\n\nThe problem requires deep investigation. Please check the logs or try a more specific query.";
    } else if (candidate?.finishReason) {
      console.warn(`Gemini stopped with reason: ${candidate.finishReason}`);
      generatedText = `AI reasoning stopped with reason: ${candidate.finishReason}. This might be due to safety filters or other content restrictions. Please try rephrasing your problem.`;
    } else {
      const details = JSON.stringify(aiData).substring(0, 500);
      console.error("Unexpected Gemini response format:", JSON.stringify(aiData));
      throw new Error(`Invalid response format from Gemini API. Details: ${details}`);
    }

    // Calculate estimated cost (simplified model: $0.0005 per 1k chars)
    const estimatedCost = (generatedText.length / 1000) * 0.0005;

    // Update problem with cost
    await supabase
      .from("problems")
      .update({
        ai_cost: (problem.ai_cost || 0) + estimatedCost // Increment existing cost
      })
      .eq("id", problemId);

    console.log("Generated insight:", generatedText.substring(0, 100));

    // Parse the response and extract code samples
    const codeSamples = extractCodeSamples(generatedText);
    const cleanContent = generatedText.replace(/```[\s\S]*?```/g, "").trim();

    // Determine insight type based on layer
    const insightType = getInsightType(layerOrder);

    // Determine if significant (for layer 1+, mark as significant)
    const isSignificant = layerOrder > 0;

    // Store insight
    const { error: insertError } = await supabase.from("insights").insert({
      session_id: session.id,
      problem_id: problemId,
      content: cleanContent,
      insight_type: insightType,
      code_samples: codeSamples,
      is_significant: isSignificant,
    });

    if (insertError) throw insertError;

    // Mark session as completed
    await supabase
      .from("reasoning_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    console.log("Insight processed successfully");

    // --- Notification Logic ---
    try {
      // 1. Get user email
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(problem.user_id);

      if (userError || !user?.email) {
        console.warn("Could not fetch user email for notification:", userError);
      } else {
        // 2. Get notification preferences
        const { data: prefs } = await supabase
          .from("notification_preferences")
          .select("*")
          .eq("user_id", problem.user_id)
          .single();

        // Default to 'smart' and enabled if no prefs found
        const enabled = prefs?.enabled ?? true;
        const scheduleType = prefs?.schedule_type || "smart";

        let shouldSend = false;

        if (enabled) {
          if (scheduleType === "immediate") {
            shouldSend = true;
          } else if (scheduleType === "smart") {
            // Send if significant (Layer > 0)
            shouldSend = isSignificant;
          }
          // hourly/daily are handled by digest jobs
        }

        if (shouldSend) {
          console.log(`Sending ${scheduleType} notification to ${user.email}`);

          // 3. Trigger send-email-notification function
          await fetch(`${supabaseUrl}/functions/v1/send-email-notification`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: user.email,
              type: "new_insight",
              data: {
                problemTitle: problem.title,
                insightContent: cleanContent,
                problemId: problemId
              }
            })
          });
        } else {
          console.log(`Skipping notification (Schedule: ${scheduleType}, Significant: ${isSignificant})`);
        }
      }
    } catch (notifyError) {
      console.error("Failed to process notification:", notifyError);
      // We don't throw here so we don't fail the insight generation if notification fails
    }
    // --------------------------

    return new Response(
      JSON.stringify({ success: true, insight: cleanContent }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error processing insight:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function getDepthInstructions(layer: number): string {
  const depths = [
    "Quick fixes, immediate solutions, common mistakes",
    "Deep debugging, root cause analysis, alternative approaches",
    "Architectural review, design patterns, scalability concerns",
    "Refactoring strategies, code organization, performance optimization",
    "Complete redesign, new paradigms, cutting-edge solutions",
  ];
  return depths[layer] || depths[4];
}

function getInsightType(layer: number): string {
  const types = ["quick_fix", "debugging_path", "architectural", "refactor", "redesign"];
  return types[layer] || "refactor";
}

function extractCodeSamples(content: string): string[] {
  const codeBlocks: string[] = [];
  const regex = /```[\s\S]*?```/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    codeBlocks.push(match[0].replace(/```\w*\n?/g, "").trim());
  }

  return codeBlocks;
}
