import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to repair common JSON issues from AI responses
function repairJSON(jsonString: string): string {
  let s = jsonString;
  
  // Remove trailing commas before ] or }
  s = s.replace(/,(\s*[\}\]])/g, '$1');
  
  // Fix unquoted property names (simple cases)
  s = s.replace(/(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  
  // Try to close unclosed brackets/braces
  const openBraces = (s.match(/\{/g) || []).length;
  const closeBraces = (s.match(/\}/g) || []).length;
  const openBrackets = (s.match(/\[/g) || []).length;
  const closeBrackets = (s.match(/\]/g) || []).length;
  
  // Add missing closing brackets/braces
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    s += ']';
  }
  for (let i = 0; i < openBraces - closeBraces; i++) {
    s += '}';
  }
  
  return s;
}

// Safely parse JSON with repair attempts
function safeJSONParse(content: string): any {
  // First, clean the content
  let cleanedContent = content.trim();
  if (cleanedContent.startsWith("```json")) cleanedContent = cleanedContent.slice(7);
  if (cleanedContent.startsWith("```")) cleanedContent = cleanedContent.slice(3);
  if (cleanedContent.endsWith("```")) cleanedContent = cleanedContent.slice(0, -3);
  cleanedContent = cleanedContent.trim();
  
  // Try direct parse first
  try {
    return JSON.parse(cleanedContent);
  } catch (e) {
    console.log("Direct JSON parse failed, attempting repair...");
  }
  
  // Try with repaired JSON
  try {
    const repaired = repairJSON(cleanedContent);
    return JSON.parse(repaired);
  } catch (e) {
    console.log("Repaired JSON parse failed, trying aggressive cleanup...");
  }
  
  // Aggressive cleanup: find the first { and try to extract valid JSON
  try {
    const firstBrace = cleanedContent.indexOf('{');
    if (firstBrace >= 0) {
      let extracted = cleanedContent.slice(firstBrace);
      extracted = repairJSON(extracted);
      return JSON.parse(extracted);
    }
  } catch (e) {
    console.error("All JSON parse attempts failed");
  }
  
  throw new Error("Failed to parse AI response as JSON after all repair attempts");
}

interface SkillCategory {
  id: string;
  category: string;
  skills: string;
}

interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  summary: string;
  coreStrengths?: SkillCategory[];
  experience: {
    id: string;
    jobTitle: string;
    company: string;
    location: string;
    workType?: string;
    startDate: string;
    endDate: string;
    current: boolean;
    bullets: string[];
  }[];
  education: {
    id: string;
    degree: string;
    field?: string;
    institution: string;
    location: string;
    graduationDate: string;
    gpa?: string;
  }[];
  customSections?: {
    id: string;
    title: string;
    items: {
      id: string;
      title: string;
      subtitle?: string;
      date?: string;
      description?: string;
      bullets: string[];
    }[];
  }[];
  skills: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as any;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // -----------------------------
    // IMPORT + ANALYZE mode
    // -----------------------------
    if (body?.action === "import" && typeof body?.rawResumeText === "string") {
      const rawResumeText = body.rawResumeText as string;

      console.log("Import analysis request received (chars):", rawResumeText.length);

      const systemPrompt = `You are an expert U.S. resume parser and ATS evaluator.

GOAL:
1) Extract the candidate's information from raw resume text and map it into the provided JSON schema.
2) Provide a concise ATS-oriented analysis (weaknesses, improvements, missing keywords) and an ATS score.

RULES:
- Return ONLY valid JSON.
- If a field is missing, use an empty string "" (or [] for arrays).
- Do NOT hallucinate employers, degrees, or dates. If uncertain, leave blank.
- Preserve bullet points as clean sentences.
- Use single-column American resume conventions.

CRITICAL - CUSTOM SECTIONS DETECTION:
You MUST scan the resume for ANY sections beyond the standard ones (Summary, Experience, Education, Skills).
Common examples include but are not limited to:
- Projects / Academic Projects / Personal Projects / Technical Projects
- Certifications / Licenses / Professional Certifications
- Awards / Honors / Achievements / Recognition
- Volunteering / Community Service / Volunteer Experience
- Publications / Research / Papers
- Languages / Language Proficiency
- Professional Memberships / Affiliations
- Interests / Hobbies (if professionally relevant)
- Leadership / Activities
- Training / Professional Development

For EACH additional section found, you MUST create an entry in customSections array.
DO NOT leave any resume content unaccounted for. Every piece of information must be captured.

OUTPUT JSON SHAPE (EXACT):
{
  "parsedResumeData": {
    "personalInfo": {
      "fullName": "",
      "email": "",
      "phone": "",
      "location": "",
      "linkedin": "",
      "github": "",
      "portfolio": ""
    },
    "summary": "",
    "coreStrengths": [
      {"id": "cat1", "category": "", "skills": ""}
    ],
    "experience": [
      {
        "id": "exp1",
        "jobTitle": "",
        "company": "",
        "location": "",
        "workType": "",
        "startDate": "",
        "endDate": "",
        "current": false,
        "bullets": [""]
      }
    ],
    "education": [
      {
        "id": "edu1",
        "degree": "",
        "field": "",
        "institution": "",
        "location": "",
        "graduationDate": "",
        "gpa": ""
      }
    ],
    "customSections": [
      {
        "id": "custom1",
        "title": "Section Title (e.g., Projects, Certifications, Awards)",
        "items": [
          {
            "id": "item1",
            "title": "Item name/title",
            "subtitle": "Organization or context if any",
            "date": "Date if present",
            "description": "Brief description if any",
            "bullets": ["Detail 1", "Detail 2"]
          }
        ]
      }
    ],
    "skills": []
  },
  "analysis": {
    "weaknesses": [""],
    "improvements": [""],
    "missingKeywords": [""],
    "score": 0
  },
  "atsScore": {
    "overall": 0,
    "keywordMatch": 0,
    "formatting": 0,
    "structure": 0,
    "suggestions": [""]
  },
  "extractedKeywords": [""]
}`;

      const userMessage = `RAW RESUME TEXT (extract + analyze):\n\n${rawResumeText}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error (import):", response.status, errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No content returned from AI");
      }

      const result = safeJSONParse(content);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // -----------------------------
    // TAILOR mode: import + optimize for specific job (WITH STRICT GUARDRAILS)
    // -----------------------------
    if (body?.action === "tailor" && typeof body?.rawResumeText === "string" && typeof body?.jobDescription === "string") {
      const rawResumeText = body.rawResumeText as string;
      const jobDescription = body.jobDescription as string;

      console.log("Tailor request received - resume chars:", rawResumeText.length, "job chars:", jobDescription.length);

      const systemPrompt = `You are an expert U.S. resume parser, ATS optimizer, and career coach.

GOAL:
1) Parse the candidate's raw resume text into structured JSON.
2) Analyze the target job description and extract key requirements, skills, and keywords.
3) Rewrite the resume to be well-aligned for this specific job while maintaining STRICT HONESTY.
4) Provide an ATS score reflecting how well the tailored resume matches the job.

==============================================================================
CRITICAL RULES - ABSOLUTE NON-NEGOTIABLES (NEVER VIOLATE THESE):
==============================================================================
1. NEVER change job titles - Keep exact titles as they appear in the original resume
2. NEVER change company names - Keep exact company names as written
3. NEVER change employment dates - Keep all dates exactly as they appear
4. NEVER fabricate experience - Do not add projects, achievements, or responsibilities that don't exist
5. NEVER fabricate skills or certifications - Only include what the candidate actually has
6. NEVER exaggerate years of experience - Keep experience duration accurate
7. NEVER invent metrics or numbers - Only use quantified achievements if they exist in the original

==============================================================================
WHAT YOU CAN AND SHOULD DO:
==============================================================================
1. REWORD bullet points to use terminology and keywords from the job description
   - Example: "Helped with software development" → "Contributed to software development lifecycle using Agile methodology"
   
2. EMPHASIZE transferable skills that align with the target role
   - If IT Support is applying for Project Management, highlight any coordination, stakeholder communication, or timeline management they did
   
3. ADD relevant tools/technologies the candidate LIKELY used based on their role context
   - An IT Support person likely used ticketing systems, so "Jira" or "ServiceNow" could be added if reasonable
   - Only add tools that are standard for their stated role
   
4. REORDER bullets to put the most job-relevant achievements first

5. REWRITE the summary to position their EXISTING experience toward the target role
   - Frame their background in terms the target role values

6. REORGANIZE skills/core strengths to prioritize job-relevant categories

7. BRIDGE experience gaps with honest language
   - "Cross-functional collaboration" instead of fabricating PM experience
   - "Led implementation projects" if they actually managed implementations

==============================================================================
CUSTOM SECTIONS - CRITICAL:
==============================================================================
Scan for ANY sections beyond standard ones (Summary, Experience, Education):
- Projects, Certifications, Awards, Volunteering, Publications, Languages, etc.
- Create entries in customSections for EACH found
- DO NOT leave any resume content unaccounted for

JOB DESCRIPTION TO TARGET:
"""
${jobDescription}
"""

OUTPUT JSON SHAPE (EXACT):
{
  "parsedResumeData": {
    "personalInfo": {
      "fullName": "",
      "email": "",
      "phone": "",
      "location": "",
      "linkedin": "",
      "github": "",
      "portfolio": ""
    },
    "summary": "Tailored summary positioning candidate for this role using their ACTUAL experience",
    "coreStrengths": [
      {"id": "cat1", "category": "Category matching job requirements", "skills": "relevant, skills, from, candidate's, actual, background"}
    ],
    "experience": [
      {
        "id": "exp1",
        "jobTitle": "EXACT ORIGINAL JOB TITLE - DO NOT CHANGE",
        "company": "EXACT ORIGINAL COMPANY NAME - DO NOT CHANGE",
        "location": "",
        "workType": "",
        "startDate": "EXACT ORIGINAL DATE",
        "endDate": "EXACT ORIGINAL DATE",
        "current": false,
        "bullets": ["Reworded bullet using job description terminology while preserving factual accuracy"]
      }
    ],
    "education": [
      {
        "id": "edu1",
        "degree": "",
        "field": "",
        "institution": "",
        "location": "",
        "graduationDate": "",
        "gpa": ""
      }
    ],
    "customSections": [
      {
        "id": "custom1",
        "title": "Projects/Certifications/Awards/etc.",
        "items": [
          {
            "id": "item1",
            "title": "Item title",
            "subtitle": "Organization",
            "date": "Date",
            "description": "Description",
            "bullets": ["Detail bullets"]
          }
        ]
      }
    ],
    "skills": ["skill matching job requirements that candidate ACTUALLY has"]
  },
  "analysis": {
    "weaknesses": ["Honest gaps between candidate and job requirements"],
    "improvements": ["What was reworded/emphasized for this job"],
    "missingKeywords": ["Job requirements the candidate genuinely lacks"],
    "score": 0
  },
  "atsScore": {
    "overall": 0,
    "keywordMatch": 0,
    "formatting": 100,
    "structure": 0,
    "suggestions": ["Honest suggestions for improving match"]
  },
  "extractedKeywords": ["keywords", "from", "job", "description"]
}`;

      const userMessage = `RAW RESUME TEXT (parse and tailor for the job description above - remember: NO FABRICATION, only reword and emphasize existing experience):\n\n${rawResumeText}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error (tailor):", response.status, errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No content returned from AI");
      }

      const result = safeJSONParse(content);
      console.log("Tailor result parsed successfully");
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // -----------------------------
    // DEFAULT: Optimize existing resume data
    // -----------------------------
    const { resumeData, jobDescription } = body as {
      resumeData: ResumeData;
      jobDescription?: string;
    };

    console.log("Received resume optimization request for:", resumeData?.personalInfo?.fullName);

    const systemPrompt = `You are an expert ATS Resume Architect and senior U.S. recruiter with 15+ years of experience. Your job is to create highly optimized resumes that achieve 90-100% ATS match scores and maximize interview callbacks.

RESUME STRUCTURE REQUIREMENTS:
1. Use this exact structure: SUMMARY → CORE STRENGTHS → EXPERIENCE → EDUCATION
2. Keep content ATS-friendly: single-column, no tables, no icons.

SUMMARY OPTIMIZATION:
- Write 3-4 impactful sentences
- Start with a professional title/identity (e.g., "Creative Technologist", "Results-driven Software Engineer")
- Include years of experience and key domains
- Mention 3-5 most relevant technical skills
- End with what you're known for or your working style

CORE STRENGTHS FORMAT (CRITICAL):
- Organize skills into 4-6 categories
- Format: "Category Name: skill1, skill2, skill3"

EXPERIENCE BULLETS (CRITICAL - MUST FOLLOW):
Each bullet MUST:
1. Start with a STRONG action verb
2. Describe the specific work/project
3. Include tools, technologies, or methods used
4. End with a measurable outcome or impact
5. Be 1-2 lines maximum

ATS KEYWORD OPTIMIZATION:
${jobDescription ? `Analyze this job description and incorporate relevant keywords naturally:\n"${jobDescription}"` : "Optimize for general ATS systems and common industry keywords."}

Return a JSON object with this EXACT structure:
{
  "optimizedSummary": "Full professional summary paragraph",
  "optimizedCoreStrengths": [
    {"id": "cat1", "category": "Front-End", "skills": "HTML, CSS, JavaScript, TypeScript, React"}
  ],
  "optimizedExperience": [
    {
      "id": "original-experience-id",
      "optimizedBullets": [
        "First optimized bullet",
        "Second optimized bullet",
        "Third optimized bullet"
      ]
    }
  ],
  "atsScore": {
    "overall": 94,
    "keywordMatch": 92,
    "formatting": 100,
    "structure": 95,
    "suggestions": ["Add more quantified metrics"]
  },
  "extractedKeywords": ["react", "wordpress"]
}`;

    const userMessage = `Optimize this resume data for maximum ATS compatibility and interview callbacks:\n\nCURRENT RESUME DATA:\n${JSON.stringify(resumeData, null, 2)}\n\nRequirements:\n1. Create a compelling professional summary\n2. Organize skills into Core Strengths categories\n3. Rewrite ALL experience bullets following the action verb + task + tool + outcome formula\n4. Each position should have 3-5 strong bullets\n\nReturn ONLY the JSON object, no markdown or extra text.`;

    console.log("Calling AI gateway for full resume optimization");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content returned from AI");
    }

    console.log("AI response received, parsing JSON");

    const optimizationResult = safeJSONParse(content);

    console.log("Successfully parsed optimization result");

    return new Response(JSON.stringify(optimizationResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in optimize-resume function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
