import { ResumeData } from "@/types/resume";
import { formatDateFull } from "@/lib/resumeUtils";

interface ResumePreviewProps {
  data: ResumeData;
}

export const ResumePreview = ({ data }: ResumePreviewProps) => {
  const hasContent = data.personalInfo.fullName || data.summary || data.experience.length > 0;

  if (!hasContent) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="w-16 h-20 mx-auto mb-4 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
            <span className="text-2xl text-muted-foreground/50">📄</span>
          </div>
          <p className="text-sm">Start filling in your details</p>
          <p className="text-xs mt-1">Your resume preview will appear here</p>
        </div>
      </div>
    );
  }

  const contactParts = [
    data.personalInfo.location,
    data.personalInfo.phone,
    data.personalInfo.email,
    data.personalInfo.github,
    data.personalInfo.portfolio,
    data.personalInfo.linkedin,
  ].filter(Boolean);

  return (
    <div className="bg-white text-black p-8 min-h-[792px] shadow-lg font-['Times_New_Roman',_Times,_serif] text-[11pt] leading-[1.35]">
      {/* Header */}
      <div className="text-center mb-3">
        <h1 className="text-[20pt] font-bold tracking-wide mb-1">
          {data.personalInfo.fullName.toUpperCase() || "YOUR NAME"}
        </h1>
        <div className="text-[10pt]">
          {contactParts.map((part, idx) => (
            <span key={idx}>
              {idx > 0 && <span className="mx-1">|</span>}
              <span className={part?.includes("@") || part?.includes("github") || part?.includes("linkedin") ? "text-blue-700 underline" : ""}>
                {part}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <section className="mb-3">
          <h2 className="text-[11pt] font-bold border-b-2 border-[#C5A000] mb-2 pb-0.5">
            SUMMARY
          </h2>
          <p className="text-[10pt] text-justify">{data.summary}</p>
        </section>
      )}

      {/* Core Strengths */}
      {data.coreStrengths && data.coreStrengths.length > 0 && data.coreStrengths.some(c => c.category && c.skills) && (
        <section className="mb-3">
          <h2 className="text-[11pt] font-bold border-b-2 border-[#C5A000] mb-2 pb-0.5">
            CORE STRENGTHS
          </h2>
          <ul className="list-none m-0 p-0 text-[10pt]">
            {data.coreStrengths.filter(c => c.category && c.skills).map((cat) => (
              <li key={cat.id} className="mb-0.5">
                <span className="mr-1">•</span>
                <strong>{cat.category}:</strong> {cat.skills}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Legacy Skills (if no core strengths) */}
      {(!data.coreStrengths || data.coreStrengths.length === 0) && data.skills.length > 0 && data.skills.some(Boolean) && (
        <section className="mb-3">
          <h2 className="text-[11pt] font-bold border-b-2 border-[#C5A000] mb-2 pb-0.5">
            SKILLS
          </h2>
          <p className="text-[10pt]">{data.skills.filter(Boolean).join(" • ")}</p>
        </section>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <section className="mb-3">
          <h2 className="text-[11pt] font-bold border-b-2 border-[#C5A000] mb-2 pb-0.5">
            EXPERIENCE
          </h2>
          {data.experience.map((exp) => (
            <div key={exp.id} className="mb-3">
              {/* Company and dates */}
              <div className="flex justify-between items-baseline">
                <strong className="text-[11pt]">{exp.company}</strong>
                <span className="text-[10pt]">
                  {formatDateFull(exp.startDate)} - {exp.current ? "Present" : formatDateFull(exp.endDate)}
                </span>
              </div>
              {/* Job title and location */}
              <div className="flex justify-between items-baseline">
                <span className="text-[10pt] italic">{exp.jobTitle}</span>
                <span className="text-[10pt] italic">
                  {exp.location}{exp.workType && ` | ${exp.workType}`}
                </span>
              </div>
              {/* Bullets */}
              {exp.bullets.filter(Boolean).length > 0 && (
                <ul className="list-none m-0 p-0 mt-1 text-[10pt]">
                  {exp.bullets.filter(Boolean).map((bullet, idx) => (
                    <li key={idx} className="mb-0.5 pl-3 relative">
                      <span className="absolute left-0">•</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <section className="mb-3">
          <h2 className="text-[11pt] font-bold border-b-2 border-[#C5A000] mb-2 pb-0.5">
            EDUCATION
          </h2>
          {data.education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <div className="flex justify-between items-baseline">
                <strong className="text-[11pt]">{edu.institution}</strong>
                <span className="text-[10pt]">
                  {edu.graduationDate && formatDateFull(edu.graduationDate)}
                </span>
              </div>
              <div className="text-[10pt]">
                {edu.degree}{edu.field && ` in ${edu.field}`}
                {edu.gpa && ` | GPA: ${edu.gpa}`}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};
