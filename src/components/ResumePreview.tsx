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

  // Format-specific styles matching PDF exactly
  const isCompact = format === 'compact';

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
      <a key="email" href={`mailto:${data.personalInfo.email}`} className="text-[#0000EE] underline">
        {data.personalInfo.email}
      </a>
    );
  }
  
  const githubLink = formatLink(data.personalInfo.github, "GitHub");
  if (githubLink) {
    contactElements.push(
      <a key="github" href={githubLink.href} target="_blank" rel="noopener noreferrer" className="text-[#0000EE] underline">
        GitHub
      </a>
    );
  }
  
  const portfolioLink = formatLink(data.personalInfo.portfolio, "Portfolio");
  if (portfolioLink) {
    contactElements.push(
      <a key="portfolio" href={portfolioLink.href} target="_blank" rel="noopener noreferrer" className="text-[#0000EE] underline">
        Portfolio
      </a>
    );
  }
  
  const linkedinLink = formatLink(data.personalInfo.linkedin, "LinkedIn");
  if (linkedinLink) {
    contactElements.push(
      <a key="linkedin" href={linkedinLink.href} target="_blank" rel="noopener noreferrer" className="text-[#0000EE] underline">
        LinkedIn
      </a>
    );
  }

  // Letter page: 8.5" x 11" at 72dpi = 612px x 792px
  // Margins: top/bottom 26pt, left/right 36pt
  // Font sizes: Name 21pt, Section 12pt, Subheader 11pt, Body 10pt
  // Line height: 12pt, Section spacing: 2pt (compact: 1pt)
  const sectionSpacingPt = isCompact ? 1 : 2;

  return (
    <div 
      className="bg-white text-black shadow-lg"
      style={{
        width: '612px',
        minHeight: '792px',
        padding: '26pt 36pt',
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: '10pt',
        lineHeight: '12pt',
      }}
    >
      {/* Header - Name centered */}
      <div style={{ textAlign: 'center', marginBottom: `${sectionSpacingPt}pt` }}>
        <h1 style={{ 
          fontSize: isCompact ? '18pt' : '21pt', 
          fontWeight: 'bold', 
          letterSpacing: '0.05em',
          margin: 0,
          lineHeight: '1.2',
        }}>
          {data.personalInfo.fullName.toUpperCase() || "YOUR NAME"}
        </h1>
        <div style={{ fontSize: '10pt', lineHeight: '12pt', marginTop: '2pt' }}>
          {contactElements.map((el, idx) => (
            <span key={idx}>
              {idx > 0 && <span style={{ margin: '0 4px' }}>|</span>}
              {el}
            </span>
          ))}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <section style={{ marginBottom: `${sectionSpacingPt}pt` }}>
          <SectionHeader title="SUMMARY" />
          <p style={{ 
            fontSize: '10pt', 
            lineHeight: '12pt', 
            textAlign: 'justify',
            margin: 0,
            marginTop: '3pt',
          }}>
            {data.summary}
          </p>
        </section>
      )}

      {/* Core Strengths */}
      {coreStrengths.length > 0 && coreStrengths.some(c => c.category && c.skills) && (
        <section style={{ marginBottom: `${sectionSpacingPt}pt` }}>
          <SectionHeader title="CORE STRENGTHS" />
          <ul style={{ 
            listStyle: 'none', 
            margin: 0, 
            padding: 0, 
            fontSize: '10pt', 
            lineHeight: '12pt',
            marginTop: '3pt',
          }}>
            {coreStrengths.filter(c => c.category && c.skills).map((cat) => (
              <li key={cat.id} style={{ margin: 0 }}>
                <span style={{ marginRight: '4px' }}>•</span>
                <span style={{ fontWeight: 'bold' }}>{cat.category}:</span> {cat.skills}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Legacy Skills (if no core strengths) */}
      {coreStrengths.length === 0 && skills.length > 0 && skills.some(Boolean) && (
        <section style={{ marginBottom: `${sectionSpacingPt}pt` }}>
          <SectionHeader title="SKILLS" />
          <p style={{ fontSize: '10pt', lineHeight: '12pt', marginTop: '3pt', margin: 0 }}>
            {skills.filter(Boolean).join(" • ")}
          </p>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section style={{ marginBottom: `${sectionSpacingPt}pt` }}>
          <SectionHeader title="EXPERIENCE" />
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
              <div key={exp.id} style={{ marginTop: '3pt' }}>
                {/* Company and dates - all bold */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '11pt', fontWeight: 'bold' }}>{exp.company}</span>
                  {dateDisplay && <span style={{ fontSize: '10pt', fontWeight: 'bold' }}>{dateDisplay}</span>}
                </div>
                {/* Job title and location - all bold */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '10pt', fontWeight: 'bold' }}>{exp.jobTitle}</span>
                  {locationDisplay && <span style={{ fontSize: '10pt', fontWeight: 'bold' }}>{locationDisplay}</span>}
                </div>
                {/* Bullets */}
                {(exp.bullets || []).filter(Boolean).length > 0 && (
                  <ul style={{ 
                    listStyle: 'none', 
                    margin: 0, 
                    padding: 0, 
                    marginTop: '1pt',
                    fontSize: '10pt', 
                    lineHeight: '12pt',
                  }}>
                    {(exp.bullets || []).filter(Boolean).map((bullet, idx) => (
                      <li key={idx} style={{ paddingLeft: '12px', position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 0 }}>•</span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section style={{ marginBottom: `${sectionSpacingPt}pt` }}>
          <SectionHeader title="EDUCATION" />
          {education.map((edu) => {
            const gradDate = formatDateFull(edu.graduationDate);
            return (
              <div key={edu.id} style={{ marginTop: '3pt' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '11pt', fontWeight: 'bold' }}>{edu.institution}</span>
                  {gradDate && <span style={{ fontSize: '10pt' }}>{gradDate}</span>}
                </div>
                <div style={{ fontSize: '10pt', lineHeight: '12pt' }}>
                  {edu.degree}{edu.field && ` in ${edu.field}`}
                  {edu.gpa && ` | GPA: ${edu.gpa}`}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Custom Sections */}
      {customSections.length > 0 && customSections.some(s => s.title) && (
        <>
          {customSections.filter(s => s.title).map((section) => (
            <section key={section.id} style={{ marginBottom: `${sectionSpacingPt}pt` }}>
              <SectionHeader title={section.title.toUpperCase()} />
              {(section.items || []).map((item) => (
                <div key={item.id} style={{ marginTop: '3pt' }}>
                  {item.title && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '11pt', fontWeight: 'bold' }}>{item.title}</span>
                      {item.date && <span style={{ fontSize: '10pt' }}>{item.date}</span>}
                    </div>
                  )}
                  {item.subtitle && (
                    <div style={{ fontSize: '10pt', lineHeight: '12pt' }}>{item.subtitle}</div>
                  )}
                  {item.link && (
                    <div style={{ fontSize: '10pt', lineHeight: '12pt' }}>
                      <a 
                        href={item.link.startsWith('http') ? item.link : `https://${item.link}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[#0000EE] underline"
                      >
                        Project Link
                      </a>
                    </div>
                  )}
                  {item.description && (
                    <div style={{ fontSize: '10pt', lineHeight: '12pt' }}>{item.description}</div>
                  )}
                  {(item.bullets || []).filter(Boolean).length > 0 && (
                    <ul style={{ 
                      listStyle: 'none', 
                      margin: 0, 
                      padding: 0, 
                      marginTop: '1pt',
                      fontSize: '10pt', 
                      lineHeight: '12pt',
                    }}>
                      {(item.bullets || []).filter(Boolean).map((bullet, idx) => (
                        <li key={idx} style={{ paddingLeft: '12px', position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 0 }}>•</span>
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

// Section header component with full-width black underline
const SectionHeader = ({ title }: { title: string }) => (
  <div style={{ marginBottom: '0' }}>
    <h2 style={{ 
      fontSize: '12pt', 
      fontWeight: 'bold', 
      margin: 0,
      paddingBottom: '3pt',
      borderBottom: '1px solid black',
      lineHeight: '1',
    }}>
      {title}
    </h2>
  </div>
);
