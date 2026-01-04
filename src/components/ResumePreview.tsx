import { ResumeData, ResumeFormat } from "@/types/resume";
import { formatDateFull } from "@/lib/resumeUtils";

interface ResumePreviewProps {
  data: ResumeData;
  format?: ResumeFormat;
}

export const ResumePreview = ({ data, format = 'standard' }: ResumePreviewProps) => {
  const hasContent = data.personalInfo.fullName || data.summary || data.experience.length > 0;

  // Format-specific styles
  const isCompact = format === 'compact';
  const nameSize = isCompact ? 'text-[18pt]' : 'text-[21pt]';
  const sectionSize = 'text-[12pt]';
  const subheaderSize = 'text-[11pt]';
  const bodySize = 'text-[10pt]';
  const lineHeight = 'leading-[12pt]';
  const sectionSpacing = isCompact ? 'mb-[1pt]' : 'mb-[2pt]';
  const entrySpacing = 'mb-0';

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

  // Letter page: 8.5" x 11" at 72dpi = 612px x 792px
  // Margins: top/bottom 26pt, left/right 36pt
  return (
    <div 
      className="bg-white text-black font-['Times_New_Roman',_Times,_serif] shadow-lg"
      style={{
        width: '612px',
        minHeight: '792px',
        padding: '26pt 36pt',
        fontSize: '10pt',
        lineHeight: '12pt',
      }}
    >
      {/* Header */}
      <div className="text-center mb-[2pt]">
        <h1 className={`${nameSize} font-bold tracking-wide ${entrySpacing}`}>
          {data.personalInfo.fullName.toUpperCase() || "YOUR NAME"}
        </h1>
        <div className={`${bodySize} ${lineHeight}`}>
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
        <section className={sectionSpacing}>
          <h2 className={`${sectionSize} font-bold border-b border-black ${entrySpacing} pb-[1px]`}>
            SUMMARY
          </h2>
          <p className={`${bodySize} ${lineHeight} text-justify mt-[2pt]`}>{data.summary}</p>
        </section>
      )}

      {/* Core Strengths */}
      {data.coreStrengths && data.coreStrengths.length > 0 && data.coreStrengths.some(c => c.category && c.skills) && (
        <section className={sectionSpacing}>
          <h2 className={`${sectionSize} font-bold border-b border-black ${entrySpacing} pb-[1px]`}>
            CORE STRENGTHS
          </h2>
          <ul className={`list-none m-0 p-0 ${bodySize} ${lineHeight} mt-[2pt]`}>
            {data.coreStrengths.filter(c => c.category && c.skills).map((cat) => (
              <li key={cat.id} className={entrySpacing}>
                <span className="mr-1">•</span>
                <span className="font-bold">{cat.category}:</span> {cat.skills}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Legacy Skills (if no core strengths) */}
      {(!data.coreStrengths || data.coreStrengths.length === 0) && data.skills.length > 0 && data.skills.some(Boolean) && (
        <section className={sectionSpacing}>
          <h2 className={`${sectionSize} font-bold border-b border-black ${entrySpacing} pb-[1px]`}>
            SKILLS
          </h2>
          <p className={`${bodySize} ${lineHeight} mt-[2pt]`}>{data.skills.filter(Boolean).join(" • ")}</p>
        </section>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <section className={sectionSpacing}>
          <h2 className={`${sectionSize} font-bold border-b border-black ${entrySpacing} pb-[1px]`}>
            EXPERIENCE
          </h2>
          {data.experience.map((exp) => (
            <div key={exp.id} className={`${sectionSpacing} mt-[2pt]`}>
              {/* Company and dates - all bold */}
              <div className="flex justify-between items-baseline">
                <span className={`${subheaderSize} font-bold`}>{exp.company}</span>
                <span className={`${bodySize} font-bold`}>
                  {formatDateFull(exp.startDate)} - {exp.current ? "Present" : formatDateFull(exp.endDate)}
                </span>
              </div>
              {/* Job title and location - all bold */}
              <div className="flex justify-between items-baseline">
                <span className={`${bodySize} font-bold`}>{exp.jobTitle}</span>
                <span className={`${bodySize} font-bold`}>
                  {exp.location}{exp.workType && ` | ${exp.workType}`}
                </span>
              </div>
              {/* Bullets */}
              {exp.bullets.filter(Boolean).length > 0 && (
                <ul className={`list-none m-0 p-0 mt-[1pt] ${bodySize} ${lineHeight}`}>
                  {exp.bullets.filter(Boolean).map((bullet, idx) => (
                    <li key={idx} className={`${entrySpacing} pl-3 relative`}>
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
        <section className={sectionSpacing}>
          <h2 className={`${sectionSize} font-bold border-b border-black ${entrySpacing} pb-[1px]`}>
            EDUCATION
          </h2>
          {data.education.map((edu) => (
            <div key={edu.id} className={`${entrySpacing} mt-[2pt]`}>
              <div className="flex justify-between items-baseline">
                <span className={`${subheaderSize} font-bold`}>{edu.institution}</span>
                <span className={`${bodySize}`}>
                  {edu.graduationDate && formatDateFull(edu.graduationDate)}
                </span>
              </div>
              <div className={`${bodySize} ${lineHeight}`}>
                {edu.degree}{edu.field && ` in ${edu.field}`}
                {edu.gpa && ` | GPA: ${edu.gpa}`}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Custom Sections */}
      {data.customSections && data.customSections.length > 0 && data.customSections.some(s => s.title) && (
        <>
          {data.customSections.filter(s => s.title).map((section) => (
            <section key={section.id} className={sectionSpacing}>
              <h2 className={`${sectionSize} font-bold border-b border-black ${entrySpacing} pb-[1px]`}>
                {section.title.toUpperCase()}
              </h2>
              {section.items.map((item) => (
                <div key={item.id} className={`${entrySpacing} mt-[2pt]`}>
                  {item.title && (
                    <div className="flex justify-between items-baseline">
                      <span className={`${subheaderSize} font-bold`}>{item.title}</span>
                      {item.date && <span className={bodySize}>{item.date}</span>}
                    </div>
                  )}
                  {item.subtitle && (
                    <div className={`${bodySize} ${lineHeight}`}>{item.subtitle}</div>
                  )}
                  {item.description && (
                    <div className={`${bodySize} ${lineHeight}`}>{item.description}</div>
                  )}
                  {item.bullets.filter(Boolean).length > 0 && (
                    <ul className={`list-none m-0 p-0 mt-[1pt] ${bodySize} ${lineHeight}`}>
                      {item.bullets.filter(Boolean).map((bullet, idx) => (
                        <li key={idx} className={`${entrySpacing} pl-3 relative`}>
                          <span className="absolute left-0">•</span>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          ))}
        </>
      )}
    </div>
  );
};
