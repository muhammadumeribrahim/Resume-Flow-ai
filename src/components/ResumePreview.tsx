import { ResumeData, ResumeFormat } from "@/types/resume";
import { formatDateFull } from "@/lib/resumeUtils";

interface ResumePreviewProps {
  data: ResumeData;
  format?: ResumeFormat;
}

// Helper to format links nicely
const formatLink = (url: string | undefined, label: string): { text: string; href: string } | null => {
  if (!url) return null;
  let cleanUrl = url.trim();
  // Add https if missing
  const href = cleanUrl.startsWith("http") ? cleanUrl : `https://${cleanUrl}`;
  return { text: label, href };
};

export const ResumePreview = ({ data, format = 'standard' }: ResumePreviewProps) => {
  const hasContent = data.personalInfo.fullName || data.summary || (data.experience || []).length > 0;

  // Safe arrays
  const experience = data.experience || [];
  const education = data.education || [];
  const coreStrengths = data.coreStrengths || [];
  const customSections = data.customSections || [];
  const skills = data.skills || [];

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

  // Build contact parts with clickable links
  const contactElements: React.ReactNode[] = [];
  
  if (data.personalInfo.location) {
    contactElements.push(<span key="location">{data.personalInfo.location}</span>);
  }
  if (data.personalInfo.phone) {
    contactElements.push(<span key="phone">{data.personalInfo.phone}</span>);
  }
  if (data.personalInfo.email) {
    contactElements.push(
      <a key="email" href={`mailto:${data.personalInfo.email}`} className="text-blue-700 underline">
        {data.personalInfo.email}
      </a>
    );
  }
  
  const githubLink = formatLink(data.personalInfo.github, "GitHub");
  if (githubLink) {
    contactElements.push(
      <a key="github" href={githubLink.href} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
        GitHub
      </a>
    );
  }
  
  const portfolioLink = formatLink(data.personalInfo.portfolio, "Portfolio");
  if (portfolioLink) {
    contactElements.push(
      <a key="portfolio" href={portfolioLink.href} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
        Portfolio
      </a>
    );
  }
  
  const linkedinLink = formatLink(data.personalInfo.linkedin, "LinkedIn");
  if (linkedinLink) {
    contactElements.push(
      <a key="linkedin" href={linkedinLink.href} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
        LinkedIn
      </a>
    );
  }

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
          {contactElements.map((el, idx) => (
            <span key={idx}>
              {idx > 0 && <span className="mx-1">|</span>}
              {el}
            </span>
          ))}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <section className={sectionSpacing}>
          <h2 className={`${sectionSize} font-bold ${entrySpacing}`}>
            <span className="border-b-2 border-black">SUMMARY</span>
          </h2>
          <p className={`${bodySize} ${lineHeight} text-justify mt-[3pt]`}>{data.summary}</p>
        </section>
      )}

      {/* Core Strengths */}
      {coreStrengths.length > 0 && coreStrengths.some(c => c.category && c.skills) && (
        <section className={sectionSpacing}>
          <h2 className={`${sectionSize} font-bold ${entrySpacing}`}>
            <span className="border-b-2 border-black">CORE STRENGTHS</span>
          </h2>
          <ul className={`list-none m-0 p-0 ${bodySize} ${lineHeight} mt-[3pt]`}>
            {coreStrengths.filter(c => c.category && c.skills).map((cat) => (
              <li key={cat.id} className={entrySpacing}>
                <span className="mr-1">•</span>
                <span className="font-bold">{cat.category}:</span> {cat.skills}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Legacy Skills (if no core strengths) */}
      {coreStrengths.length === 0 && skills.length > 0 && skills.some(Boolean) && (
        <section className={sectionSpacing}>
          <h2 className={`${sectionSize} font-bold ${entrySpacing}`}>
            <span className="border-b-2 border-black">SKILLS</span>
          </h2>
          <p className={`${bodySize} ${lineHeight} mt-[3pt]`}>{skills.filter(Boolean).join(" • ")}</p>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className={sectionSpacing}>
          <h2 className={`${sectionSize} font-bold ${entrySpacing}`}>
            <span className="border-b-2 border-black">EXPERIENCE</span>
          </h2>
          {experience.map((exp) => {
            const startFormatted = formatDateFull(exp.startDate);
            const endFormatted = exp.current ? "Present" : formatDateFull(exp.endDate);
            const hasDateRange = startFormatted || endFormatted;
            const dateDisplay = hasDateRange 
              ? `${startFormatted || ""}${startFormatted && endFormatted ? " - " : ""}${endFormatted || ""}`
              : "";
            const locationParts = [exp.location, exp.workType].filter(Boolean);
            const locationDisplay = locationParts.join(" | ");
            
            return (
            <div key={exp.id} className={`${sectionSpacing} mt-[3pt]`}>
              {/* Company and dates - all bold */}
              <div className="flex justify-between items-baseline">
                <span className={`${subheaderSize} font-bold`}>{exp.company}</span>
                {dateDisplay && <span className={`${bodySize} font-bold`}>{dateDisplay}</span>}
              </div>
              {/* Job title and location - all bold */}
              <div className="flex justify-between items-baseline">
                <span className={`${bodySize} font-bold`}>{exp.jobTitle}</span>
                {locationDisplay && <span className={`${bodySize} font-bold`}>{locationDisplay}</span>}
              </div>
              {/* Bullets */}
              {(exp.bullets || []).filter(Boolean).length > 0 && (
                <ul className={`list-none m-0 p-0 mt-[1pt] ${bodySize} ${lineHeight}`}>
                  {(exp.bullets || []).filter(Boolean).map((bullet, idx) => (
                    <li key={idx} className={`${entrySpacing} pl-3 relative`}>
                      <span className="absolute left-0">•</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )})}
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className={sectionSpacing}>
          <h2 className={`${sectionSize} font-bold ${entrySpacing}`}>
            <span className="border-b-2 border-black">EDUCATION</span>
          </h2>
          {education.map((edu) => {
            const gradDate = formatDateFull(edu.graduationDate);
            return (
            <div key={edu.id} className={`${entrySpacing} mt-[3pt]`}>
              <div className="flex justify-between items-baseline">
                <span className={`${subheaderSize} font-bold`}>{edu.institution}</span>
                {gradDate && <span className={`${bodySize}`}>{gradDate}</span>}
              </div>
              <div className={`${bodySize} ${lineHeight}`}>
                {edu.degree}{edu.field && ` in ${edu.field}`}
                {edu.gpa && ` | GPA: ${edu.gpa}`}
              </div>
            </div>
          )})}
        </section>
      )}

      {/* Custom Sections */}
      {customSections.length > 0 && customSections.some(s => s.title) && (
        <>
          {customSections.filter(s => s.title).map((section) => (
            <section key={section.id} className={sectionSpacing}>
              <h2 className={`${sectionSize} font-bold ${entrySpacing}`}>
                <span className="border-b-2 border-black">
                {section.title.toUpperCase()}</span>
              </h2>
              {(section.items || []).map((item) => (
                <div key={item.id} className={`${entrySpacing} mt-[3pt]`}>
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
                  {(item.bullets || []).filter(Boolean).length > 0 && (
                    <ul className={`list-none m-0 p-0 mt-[1pt] ${bodySize} ${lineHeight}`}>
                      {(item.bullets || []).filter(Boolean).map((bullet, idx) => (
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
