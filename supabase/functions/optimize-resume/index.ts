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

      const systemPrompt = `You are an expert U.S. resume parser and ATS evaluator with 20+ years of HR/recruiting experience.

GOAL:
1) Extract the candidate's information from raw resume text and map it into the provided JSON schema.
2) STANDARDIZE and ORGANIZE the content following our strict resume format.
3) Provide a concise ATS-oriented analysis (weaknesses, improvements, missing keywords) and an ATS score.

==============================================================================
CRITICAL: STRICT SECTION ORDERING (ALWAYS FOLLOW THIS ORDER)
==============================================================================
Our resume format has a FIXED section order. Regardless of how messy or different the input resume is, YOU MUST organize the output in this exact order:

1. PERSONAL INFO (header)
2. SUMMARY (professional summary - 3-4 sentences max)
3. CORE STRENGTHS (categorized skills - NEVER a long flat list)
4. EXPERIENCE (work history, chronological - most recent first)
5. EDUCATION (degrees, certifications that are formal education)
6. CUSTOM SECTIONS (in this priority order if they exist):
   a. Certifications / Licenses / Professional Certifications
   b. Projects / Technical Projects / Academic Projects
   c. Awards / Honors / Achievements
   d. Volunteering / Community Service
   e. Publications / Research
   f. Languages
   g. Any other sections at the end

==============================================================================
CRITICAL: SMART SKILL CATEGORIZATION (NO MESSY SKILL LISTS!)
==============================================================================
If the input resume has a long unorganized list of skills, you MUST:
1. Analyze all skills and categorize them into 4-6 logical categories
2. Each category should have 4-8 relevant skills (not too many!)
3. Category examples by profession:
   - Software Engineer: "Languages", "Frameworks", "Cloud & DevOps", "Databases", "Tools"
   - Marketing: "Digital Marketing", "Analytics", "Content", "Tools & Platforms"
   - Finance: "Financial Analysis", "Software", "Reporting", "Compliance"
   - Healthcare: "Clinical Skills", "EMR Systems", "Patient Care", "Certifications"

SKILL FORMATTING RULES:
- NEVER output more than 6 skill categories
- NEVER output more than 8 skills per category
- Prioritize most relevant/impressive skills first
- Group similar skills together intelligently
- Remove redundant/duplicate skills

==============================================================================
GENERAL PARSING RULES
==============================================================================
- Return ONLY valid JSON.
- If a field is missing, use an empty string "" (or [] for arrays).
- Do NOT hallucinate employers, degrees, or dates. If uncertain, leave blank.
- Preserve bullet points as clean sentences.
- Use single-column American resume conventions.
- Clean up messy formatting, fix obvious typos in section headers.

==============================================================================
CUSTOM SECTIONS DETECTION (IMPORTANT)
==============================================================================
Scan for ANY sections beyond the standard ones. Map them to customSections.
DO NOT leave any resume content unaccounted for.

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
      {"id": "cat1", "category": "Category Name", "skills": "skill1, skill2, skill3, skill4"}
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
        "title": "Section Title (e.g., Certifications, Projects, Awards)",
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

      const userMessage = `RAW RESUME TEXT (extract + analyze + organize following our strict section order):\n\n${rawResumeText}`;

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

      const systemPrompt = `You are an expert U.S. resume parser, ATS optimizer, and career coach with 20+ years of experience.

GOAL:
1) Parse the candidate's raw resume text into structured JSON.
2) Analyze the target job description and extract key requirements, skills, and keywords.
3) STANDARDIZE the resume following our STRICT section order and format.
4) Rewrite the resume to be well-aligned for this specific job while maintaining STRICT HONESTY.
5) Provide an ATS score reflecting how well the tailored resume matches the job.

==============================================================================
CRITICAL: STRICT SECTION ORDERING (ALWAYS FOLLOW THIS ORDER)
==============================================================================
Our resume format has a FIXED section order. Regardless of how messy or different the input resume is, YOU MUST organize the output in this exact order:

1. PERSONAL INFO (header)
2. SUMMARY (professional summary - 3-4 sentences max)
3. CORE STRENGTHS (categorized skills - NEVER a long flat list)
4. EXPERIENCE (work history, chronological - most recent first)
5. EDUCATION (degrees, certifications that are formal education)
6. CUSTOM SECTIONS (in this priority order if they exist):
   a. Certifications / Licenses
   b. Projects / Technical Projects
   c. Awards / Honors
   d. Volunteering
   e. Publications / Research
   f. Languages
   g. Any other sections at the end

==============================================================================
CRITICAL: SMART SKILL CATEGORIZATION (NO MESSY SKILL LISTS!)
==============================================================================
If the input resume has a long unorganized list of skills, you MUST:
1. Analyze all skills and categorize them into 4-6 logical categories
2. Each category should have 4-8 relevant skills (prioritize job-relevant ones!)
3. NEVER output more than 6 skill categories
4. NEVER output more than 8 skills per category
5. Put job-description-matching skills FIRST in each category

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
2. EMPHASIZE transferable skills that align with the target role
3. ADD relevant tools/technologies the candidate LIKELY used based on their role context
4. REORDER bullets to put the most job-relevant achievements first
5. REWRITE the summary to position their EXISTING experience toward the target role
6. REORGANIZE skills into proper categories, prioritizing job-relevant ones

==============================================================================
CUSTOM SECTIONS - CRITICAL:
==============================================================================
Scan for ANY sections beyond standard ones (Summary, Experience, Education):
- Projects, Certifications, Awards, Volunteering, Publications, Languages, etc.
- Create entries in customSections for EACH found
- Order them according to the priority list above

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
      {"id": "cat1", "category": "Category matching job requirements", "skills": "relevant, skills, from, candidate (max 8)"}
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
        "title": "Certifications/Projects/Awards/etc.",
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
    "skills": []
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

      const userMessage = `RAW RESUME TEXT (parse, organize following our strict section order, and tailor for the job description above - remember: NO FABRICATION, only reword and emphasize existing experience):\n\n${rawResumeText}`;

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
    // COMPRESS mode: Compress resume to fit one page
    // -----------------------------
    if (body?.action === "compress" && body?.resumeData) {
      const resumeData = body.resumeData as ResumeData;

      console.log("Compress request received for:", resumeData?.personalInfo?.fullName);

      const systemPrompt = `You are an expert resume editor specializing in condensing resumes to fit on ONE PAGE while preserving maximum impact.

GOAL: Compress this resume to fit on a single 8.5" x 11" page (~500-600 words max) while preserving the MOST IMPORTANT information.

==============================================================================
COMPRESSION RULES (PRIORITY ORDER):
==============================================================================
1. SUMMARY: Shorten to 2 concise sentences that capture key value proposition
2. CORE STRENGTHS: Keep max 4 categories, max 5 skills each - cut the least impressive
3. EXPERIENCE: 
   - Keep all job entries but reduce bullets
   - Most recent 2 jobs: max 3-4 bullets each
   - Older jobs: max 2 bullets each (keep only the most impactful)
   - MERGE similar bullet points where possible
   - REMOVE: redundant phrases, obvious duties, weak verbs
   - PRESERVE: quantified achievements, key skills, major accomplishments
4. EDUCATION: Keep essential info only (degree, school, year) - remove GPA unless > 3.5
5. CUSTOM SECTIONS:
   - Keep ONLY the most impressive items (max 2-3 per section)
   - Remove sections with weak/old content
   - Prioritize: recent certifications > projects > awards > volunteering

==============================================================================
WHAT TO PRESERVE (NEVER CUT):
==============================================================================
- Quantified achievements (numbers, percentages, dollar amounts)
- Key technical skills matching typical job requirements
- Leadership/management experience indicators
- Recent (last 3 years) achievements
- Unique differentiators

==============================================================================
WHAT TO CUT FIRST:
==============================================================================
- Soft skills in bullets (teamwork, communication - keep them in core strengths only)
- Obvious job duties ("Responsible for...")
- Old/outdated certifications (> 5 years unless still relevant)
- Redundant bullets that say similar things
- Detailed descriptions - convert to concise bullets

CRITICAL: Do NOT remove experiences, jobs, or education entries entirely - just shorten them!

OUTPUT: Return the same JSON structure but with compressed content.`;

      const userMessage = `COMPRESS THIS RESUME TO FIT ONE PAGE (maintain all sections but shorten content intelligently):\n\n${JSON.stringify(resumeData, null, 2)}`;

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
        console.error("AI gateway error (compress):", response.status, errorText);
        
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

      const compressedData = safeJSONParse(content);
      console.log("Compress result parsed successfully");
      
      return new Response(JSON.stringify({ compressedResumeData: compressedData }), {
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

==============================================================================
CRITICAL: SMART SKILL CATEGORIZATION (NO MESSY SKILL LISTS!)
==============================================================================
You MUST organize skills into 4-6 logical categories with max 8 skills each.
Category examples:
- Software: "Languages", "Frameworks", "Cloud & DevOps", "Databases", "Tools"
- Marketing: "Digital Marketing", "Analytics", "Content", "Platforms"
- General: "Technical Skills", "Tools & Software", "Industry Knowledge", "Certifications"

RESUME STRUCTURE REQUIREMENTS:
1. Use this exact structure: SUMMARY → CORE STRENGTHS → EXPERIENCE → EDUCATION → CUSTOM SECTIONS
2. Keep content ATS-friendly: single-column, no tables, no icons.

SUMMARY OPTIMIZATION:
- Write 3-4 impactful sentences
- Start with a professional title/identity
- Include years of experience and key domains
- Mention 3-5 most relevant technical skills
- End with what you're known for

CORE STRENGTHS FORMAT (CRITICAL):
- Organize skills into 4-6 categories MAX
- Each category: max 8 skills
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

    const userMessage = `Optimize this resume data for maximum ATS compatibility and interview callbacks:\n\nCURRENT RESUME DATA:\n${JSON.stringify(resumeData, null, 2)}\n\nRequirements:\n1. Create a compelling professional summary\n2. Organize skills into 4-6 Core Strengths categories (max 8 skills each)\n3. Rewrite ALL experience bullets following the action verb + task + tool + outcome formula\n4. Each position should have 3-5 strong bullets\n\nReturn ONLY the JSON object, no markdown or extra text.`;

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
