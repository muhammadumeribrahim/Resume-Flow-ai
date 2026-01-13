import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// -----------------------------
// JSON repair helpers
// -----------------------------
function repairJSON(jsonString: string): string {
  let s = jsonString;
  s = s.replace(/,(\s*[\}\]])/g, "$1");
  s = s.replace(/(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

  const openBraces = (s.match(/\{/g) || []).length;
  const closeBraces = (s.match(/\}/g) || []).length;
  const openBrackets = (s.match(/\[/g) || []).length;
  const closeBrackets = (s.match(/\]/g) || []).length;

  for (let i = 0; i < openBrackets - closeBrackets; i++) s += "]";
  for (let i = 0; i < openBraces - closeBraces; i++) s += "}";

  return s;
}

function safeJSONParse(content: string): any {
  let cleaned = content.trim();
  if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```(json)?/, "");
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch {}

  try {
    return JSON.parse(repairJSON(cleaned));
  } catch {}

  const firstBrace = cleaned.indexOf("{");
  if (firstBrace >= 0) {
    return JSON.parse(repairJSON(cleaned.slice(firstBrace)));
  }

  throw new Error("Failed to parse AI JSON output");
}

// -----------------------------
// Tool extraction helper
// -----------------------------
function extractToolCallResult(data: any): any {
  const toolCalls = data.choices?.[0]?.message?.tool_calls;
  if (toolCalls?.length) {
    const args = toolCalls[0].function?.arguments;
    return typeof args === "string" ? JSON.parse(args) : args;
  }

  const content = data.choices?.[0]?.message?.content;
  if (content) return safeJSONParse(content);

  throw new Error("No valid AI response");
}

// -----------------------------
// OpenAI call helper
// -----------------------------
async function callOpenAI(payload: any) {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 4000,
      ...payload,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${text}`);
  }

  return response.json();
}

// -----------------------------
// EDGE FUNCTION
// -----------------------------
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // -----------------------------
    // IMPORT / ANALYZE
    // -----------------------------
    if (body.action === "import" && typeof body.rawResumeText === "string") {
      const systemPrompt = body.systemPrompt;
      const userMessage = `RAW RESUME TEXT:\n\n${body.rawResumeText}`;

      const data = await callOpenAI({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        tools: body.tools,
        tool_choice: body.tool_choice,
      });

      return new Response(JSON.stringify(extractToolCallResult(data)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // -----------------------------
    // TAILOR
    // -----------------------------
    if (
      body.action === "tailor" &&
      typeof body.rawResumeText === "string" &&
      typeof body.jobDescription === "string"
    ) {
      const data = await callOpenAI({
        messages: [
          { role: "system", content: body.systemPrompt },
          { role: "user", content: body.userMessage },
        ],
        tools: body.tools,
        tool_choice: body.tool_choice,
      });

      return new Response(JSON.stringify(extractToolCallResult(data)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // -----------------------------
    // COMPRESS
    // -----------------------------
    if (body.action === "compress" && body.resumeData) {
      const data = await callOpenAI({
        messages: [
          { role: "system", content: body.systemPrompt },
          { role: "user", content: body.userMessage },
        ],
        tools: body.tools,
        tool_choice: body.tool_choice,
      });

      return new Response(
        JSON.stringify({ compressedResumeData: extractToolCallResult(data) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // -----------------------------
    // OPTIMIZE (DEFAULT)
    // -----------------------------
    const data = await callOpenAI({
      messages: [
        { role: "system", content: body.systemPrompt },
        { role: "user", content: body.userMessage },
      ],
      tools: body.tools,
      tool_choice: body.tool_choice,
    });

    return new Response(JSON.stringify(extractToolCallResult(data)), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
