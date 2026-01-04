import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  skills: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeData, jobDescription } = await req.json() as {
      resumeData: ResumeData;
      jobDescription?: string;
    };

    console.log('Received resume optimization request for:', resumeData.personalInfo.fullName);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert ATS Resume Architect and senior U.S. recruiter with 15+ years of experience. Your job is to create highly optimized resumes that achieve 90-100% ATS match scores and maximize interview callbacks.

RESUME FORMAT REQUIREMENTS:
1. Use this exact structure: SUMMARY → CORE STRENGTHS → EXPERIENCE → EDUCATION
2. Section headers in ALL CAPS with gold underline styling

SUMMARY OPTIMIZATION:
- Write 3-4 impactful sentences
- Start with a professional title/identity (e.g., "Creative Technologist", "Results-driven Software Engineer")
- Include years of experience and key domains
- Mention 3-5 most relevant technical skills
- End with what you're known for or your working style

CORE STRENGTHS FORMAT (CRITICAL):
- Organize skills into 4-6 categories
- Categories should be: "Front-End", "Web + Platforms", "Testing", "Networking/Systems", "Hardware", "Creative Tech Interest" (adjust based on the person's background)
- Format: "Category Name: skill1, skill2, skill3, skill4"
- Include tools, technologies, and methodologies

EXPERIENCE BULLETS (CRITICAL - MUST FOLLOW):
Each bullet MUST:
1. Start with a STRONG action verb (Led, Built, Developed, Implemented, Supported, Coordinated, Translated, Performed)
2. Describe the specific work/project
3. Include tools, technologies, or methods used
4. End with a measurable outcome or impact
5. Be 1-2 lines maximum

Example bullets:
- "Built and maintained client-facing web experiences in WordPress, implementing responsive UI sections and interactive components focused on stability and clear UX."
- "Supported a recurring release cadence by running regression checks, validating fixes, and documenting bugs with reproducible steps, expected vs actual results, and post-fix verification."
- "Led a website upgrade that replaced a static contact page with an email-routed contact workflow and validated end-to-end submission handling across devices."

ATS KEYWORD OPTIMIZATION:
${jobDescription ? `Analyze this job description and incorporate relevant keywords naturally:
"${jobDescription}"` : 'Optimize for general ATS systems and common industry keywords.'}

Return a JSON object with this EXACT structure:
{
  "optimizedSummary": "Full professional summary paragraph",
  "optimizedCoreStrengths": [
    {"id": "cat1", "category": "Front-End", "skills": "HTML, CSS, JavaScript, TypeScript, React"},
    {"id": "cat2", "category": "Web + Platforms", "skills": "REST APIs, JSON, WordPress, Node"},
    {"id": "cat3", "category": "Testing", "skills": "QA workflows, test plans, regression/UAT, performance testing, form validation"},
    {"id": "cat4", "category": "Networking/Systems", "skills": "TCP/IP, DNS, DHCP fundamentals, Wi-Fi troubleshooting, VPN basics"},
    {"id": "cat5", "category": "Hardware", "skills": "peripherals, cables/displays, printers, basic workstation setup and triage"}
  ],
  "optimizedExperience": [
    {
      "id": "original-experience-id",
      "optimizedBullets": [
        "First optimized bullet following the formula",
        "Second optimized bullet with action verb and outcome",
        "Third optimized bullet with specific tools mentioned"
      ]
    }
  ],
  "atsScore": {
    "overall": 94,
    "keywordMatch": 92,
    "formatting": 100,
    "structure": 95,
    "suggestions": ["Add more quantified metrics to experience bullets", "Include certifications if available"]
  },
  "extractedKeywords": ["react", "wordpress", "qa", "agile", "typescript"]
}`;

    const userMessage = `Optimize this resume data for maximum ATS compatibility and interview callbacks:

CURRENT RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

Requirements:
1. Create a compelling professional summary
2. Organize skills into Core Strengths categories
3. Rewrite ALL experience bullets following the action verb + task + tool + outcome formula
4. Each position should have 3-5 strong bullets
5. Ensure ATS-friendly formatting throughout

Return ONLY the JSON object, no markdown or extra text.`;

    console.log('Calling AI gateway for full resume optimization');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI usage limit reached. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content returned from AI');
    }

    console.log('AI response received, parsing JSON');

    // Parse the JSON response
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7);
    }
    if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    const optimizationResult = JSON.parse(cleanedContent);

    console.log('Successfully parsed optimization result');

    return new Response(JSON.stringify(optimizationResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in optimize-resume function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
