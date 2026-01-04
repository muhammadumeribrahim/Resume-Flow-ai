import { ResumeData } from "@/types/resume";
import { formatDate } from "@/lib/resumeUtils";

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

  return (
    <div className="resume-preview bg-white text-black p-8 min-h-[792px] shadow-lg">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold tracking-wide">
          {data.personalInfo.fullName.toUpperCase() || "YOUR NAME"}
        </h1>
        <div className="text-[10pt] mt-1">
          {[
            data.personalInfo.email,
            data.personalInfo.phone,
            data.personalInfo.location,
            data.personalInfo.linkedin,
          ]
            .filter(Boolean)
            .join(" | ")}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <section>
          <h2>Professional Summary</h2>
          <p className="text-[10pt]">{data.summary}</p>
        </section>
      )}

      {/* Skills */}
      {data.skills.length > 0 && data.skills.some(Boolean) && (
        <section>
          <h2>Skills</h2>
          <p className="text-[10pt]">{data.skills.filter(Boolean).join(" • ")}</p>
        </section>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <section>
          <h2>Professional Experience</h2>
          {data.experience.map((exp) => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <strong className="text-[11pt]">{exp.jobTitle}</strong>
                <span className="text-[10pt]">
                  {formatDate(exp.startDate)} – {exp.current ? "Present" : formatDate(exp.endDate)}
                </span>
              </div>
              <div className="text-[10pt] italic">
                {exp.company}{exp.location && `, ${exp.location}`}
              </div>
              {exp.bullets.filter(Boolean).length > 0 && (
                <ul className="mt-1">
                  {exp.bullets.filter(Boolean).map((bullet, idx) => (
                    <li key={idx} className="text-[10pt]">{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <section>
          <h2>Education</h2>
          {data.education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <div className="flex justify-between items-baseline">
                <strong className="text-[11pt]">{edu.degree}</strong>
                <span className="text-[10pt]">{formatDate(edu.graduationDate)}</span>
              </div>
              <div className="text-[10pt]">
                {edu.institution}{edu.location && `, ${edu.location}`}
                {edu.gpa && ` | GPA: ${edu.gpa}`}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};
