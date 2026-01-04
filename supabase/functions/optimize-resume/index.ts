import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    "customSections": [],
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
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No content returned from AI");
      }

      let cleanedContent = content.trim();
      if (cleanedContent.startsWith("```json")) cleanedContent = cleanedContent.slice(7);
      if (cleanedContent.startsWith("```")) cleanedContent = cleanedContent.slice(3);
      if (cleanedContent.endsWith("```")) cleanedContent = cleanedContent.slice(0, -3);
      cleanedContent = cleanedContent.trim();

      const result = JSON.parse(cleanedContent);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // -----------------------------
    // TAILOR mode: import + optimize for specific job
    // -----------------------------
    if (body?.action === "tailor" && typeof body?.rawResumeText === "string" && typeof body?.jobDescription === "string") {
      const rawResumeText = body.rawResumeText as string;
      const jobDescription = body.jobDescription as string;

      console.log("Tailor request received - resume chars:", rawResumeText.length, "job chars:", jobDescription.length);

      const systemPrompt = `You are an expert U.S. resume parser, ATS optimizer, and career coach.

GOAL:
1) Parse the candidate's raw resume text into structured JSON.
2) Analyze the target job description and extract key requirements, skills, and keywords.
3) Rewrite the resume to be PERFECTLY TAILORED for this specific job:
   - Match terminology and keywords from the job description
   - Emphasize relevant experience and skills
   - Rewrite bullet points to highlight matching qualifications
   - Create a summary that positions the candidate as ideal for THIS role
4) Provide an ATS score reflecting how well the tailored resume matches the job.

RULES:
- Return ONLY valid JSON.
- If a field is missing from original resume, use empty string "" or [].
- Do NOT hallucinate employers, degrees, or dates.
- The tailored resume should read naturally while incorporating job keywords.
- Every bullet should connect the candidate's experience to job requirements.

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
    "summary": "Tailored summary positioning candidate for this specific role",
    "coreStrengths": [
      {"id": "cat1", "category": "Category matching job requirements", "skills": "relevant, skills, from, job"}
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
        "bullets": ["Tailored bullet emphasizing relevant skills for target job"]
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
    "customSections": [],
    "skills": ["skill matching job requirements"]
  },
  "analysis": {
    "weaknesses": ["Any gaps between candidate and job requirements"],
    "improvements": ["What was enhanced for this job"],
    "missingKeywords": ["Job requirements not covered by candidate"],
    "score": 0
  },
  "atsScore": {
    "overall": 0,
    "keywordMatch": 0,
    "formatting": 100,
    "structure": 0,
    "suggestions": ["How to improve match further"]
  },
  "extractedKeywords": ["keywords", "from", "job", "description"]
}`;

      const userMessage = `RAW RESUME TEXT (parse and tailor for the job description above):\n\n${rawResumeText}`;

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

      let cleanedContent = content.trim();
      if (cleanedContent.startsWith("\`\`\`json")) cleanedContent = cleanedContent.slice(7);
      if (cleanedContent.startsWith("\`\`\`")) cleanedContent = cleanedContent.slice(3);
      if (cleanedContent.endsWith("\`\`\`")) cleanedContent = cleanedContent.slice(0, -3);
      cleanedContent = cleanedContent.trim();

      const result = JSON.parse(cleanedContent);
      console.log("Tailor result parsed successfully");
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
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

    let cleanedContent = content.trim();
    if (cleanedContent.startsWith("```json")) cleanedContent = cleanedContent.slice(7);
    if (cleanedContent.startsWith("```")) cleanedContent = cleanedContent.slice(3);
    if (cleanedContent.endsWith("```")) cleanedContent = cleanedContent.slice(0, -3);
    cleanedContent = cleanedContent.trim();

    const optimizationResult = JSON.parse(cleanedContent);

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
