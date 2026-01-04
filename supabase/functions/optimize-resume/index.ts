import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
  };
  summary: string;
  experience: {
    id: string;
    jobTitle: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    bullets: string[];
  }[];
  education: {
    id: string;
    degree: string;
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

    console.log('Received resume optimization request');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert ATS Resume Architect and U.S. recruiter with deep knowledge of Applicant Tracking Systems. Your job is to optimize resumes to achieve 90-100% ATS match scores.

OPTIMIZATION RULES:
1. Professional Summary: Write a concise 2-3 sentence summary highlighting key qualifications, years of experience, and career focus. Include relevant keywords from the job description if provided.

2. Experience Bullets: Each bullet MUST follow this formula:
   - Start with a strong action verb (Led, Developed, Implemented, Achieved, etc.)
   - Include a relevant skill or tool
   - Describe the specific task or responsibility
   - End with a quantified result (percentage improvement, dollar amount, time saved, etc.)
   - If no metric provided, infer a realistic, role-appropriate metric

3. Skills Section: Extract and organize skills into categories (Technical Skills, Tools, Soft Skills). Prioritize keywords that match the job description.

4. ATS Formatting Rules:
   - Use standard section headings (Professional Summary, Skills, Professional Experience, Education)
   - Reverse chronological order
   - No tables, columns, graphics, or special characters
   - Standard fonts (Times New Roman, Arial)
   - Simple bullet points

5. Keyword Optimization: If a job description is provided, identify and naturally incorporate key terms, required skills, and responsibilities without keyword stuffing.

Return a JSON object with this exact structure:
{
  "optimizedSummary": "The optimized professional summary",
  "optimizedSkills": ["skill1", "skill2", ...],
  "optimizedExperience": [
    {
      "id": "original-id",
      "optimizedBullets": ["optimized bullet 1", "optimized bullet 2", ...]
    }
  ],
  "atsScore": {
    "overall": 95,
    "keywordMatch": 92,
    "formatting": 100,
    "structure": 95,
    "suggestions": ["suggestion 1", "suggestion 2"]
  },
  "extractedKeywords": ["keyword1", "keyword2", ...]
}`;

    const userMessage = `Please optimize this resume for ATS systems:

RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

${jobDescription ? `TARGET JOB DESCRIPTION:
${jobDescription}` : 'No specific job description provided - optimize for general applicability.'}

Return ONLY the JSON object, no other text.`;

    console.log('Calling AI gateway for optimization');

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
        temperature: 0.7,
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

    // Parse the JSON response, handling potential markdown code blocks
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
