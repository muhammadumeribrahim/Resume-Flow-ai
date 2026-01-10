import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, GripVertical, Briefcase, GraduationCap, User, Sparkles, Star, FolderPlus } from "lucide-react";
import { ResumeData, ExperienceItem, EducationItem, SkillCategory, CustomSection, CustomSectionItem } from "@/types/resume";
import { createEmptyExperience, createEmptyEducation, createEmptySkillCategory, createEmptyCustomSection, createEmptyCustomSectionItem } from "@/lib/resumeUtils";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ResumeFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  onOptimize: () => void;
  isOptimizing: boolean;
}

export const ResumeForm = ({ data, onChange, onOptimize, isOptimizing }: ResumeFormProps) => {
  // Ensure arrays are always defined to prevent .map() crashes
  const experience = data.experience || [];
  const education = data.education || [];
  const coreStrengths = data.coreStrengths || [];
  const customSections = data.customSections || [];

  const updatePersonalInfo = (field: keyof ResumeData["personalInfo"], value: string) => {
    onChange({
      ...data,
      personalInfo: { ...data.personalInfo, [field]: value },
    });
  };

  // Experience handlers
  const addExperience = () => {
    onChange({
      ...data,
      experience: [...experience, createEmptyExperience()],
    });
  };

  const updateExperience = (id: string, updates: Partial<ExperienceItem>) => {
    onChange({
      ...data,
      experience: experience.map((exp) =>
        exp.id === id ? { ...exp, ...updates } : exp
      ),
    });
  };

  const removeExperience = (id: string) => {
    onChange({
      ...data,
      experience: experience.filter((exp) => exp.id !== id),
    });
  };

  const addBullet = (expId: string) => {
    const exp = experience.find((e) => e.id === expId);
    if (exp) {
      updateExperience(expId, { bullets: [...exp.bullets, ""] });
    }
  };

  const updateBullet = (expId: string, bulletIndex: number, value: string) => {
    const exp = experience.find((e) => e.id === expId);
    if (exp) {
      const newBullets = [...exp.bullets];
      newBullets[bulletIndex] = value;
      updateExperience(expId, { bullets: newBullets });
    }
  };

  const removeBullet = (expId: string, bulletIndex: number) => {
    const exp = experience.find((e) => e.id === expId);
    if (exp && exp.bullets.length > 1) {
      updateExperience(expId, {
        bullets: exp.bullets.filter((_, idx) => idx !== bulletIndex),
      });
    }
  };

  // Education handlers
  const addEducation = () => {
    onChange({
      ...data,
      education: [...education, createEmptyEducation()],
    });
  };

  const updateEducation = (id: string, updates: Partial<EducationItem>) => {
    onChange({
      ...data,
      education: education.map((edu) =>
        edu.id === id ? { ...edu, ...updates } : edu
      ),
    });
  };

  const removeEducation = (id: string) => {
    onChange({
      ...data,
      education: education.filter((edu) => edu.id !== id),
    });
  };

  // Core Strengths handlers
  const addSkillCategory = () => {
    onChange({
      ...data,
      coreStrengths: [...coreStrengths, createEmptySkillCategory()],
    });
  };

  const updateSkillCategory = (id: string, updates: Partial<SkillCategory>) => {
    onChange({
      ...data,
      coreStrengths: coreStrengths.map((cat) =>
        cat.id === id ? { ...cat, ...updates } : cat
      ),
    });
  };

  const removeSkillCategory = (id: string) => {
    onChange({
      ...data,
      coreStrengths: coreStrengths.filter((cat) => cat.id !== id),
    });
  };

  // Custom Section handlers
  const addCustomSection = () => {
    onChange({
      ...data,
      customSections: [...customSections, createEmptyCustomSection()],
    });
  };

  const updateCustomSection = (id: string, updates: Partial<CustomSection>) => {
    onChange({
      ...data,
      customSections: customSections.map((section) =>
        section.id === id ? { ...section, ...updates } : section
      ),
    });
  };

  const removeCustomSection = (id: string) => {
    onChange({
      ...data,
      customSections: customSections.filter((section) => section.id !== id),
    });
  };

  const addCustomSectionItem = (sectionId: string) => {
    const section = customSections.find((s) => s.id === sectionId);
    if (section) {
      updateCustomSection(sectionId, { items: [...(section.items || []), createEmptyCustomSectionItem()] });
    }
  };

  const updateCustomSectionItem = (sectionId: string, itemId: string, updates: Partial<CustomSectionItem>) => {
    const section = customSections.find((s) => s.id === sectionId);
    if (section) {
      updateCustomSection(sectionId, {
        items: (section.items || []).map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        ),
      });
    }
  };

  const removeCustomSectionItem = (sectionId: string, itemId: string) => {
    const section = customSections.find((s) => s.id === sectionId);
    if (section) {
      updateCustomSection(sectionId, {
        items: (section.items || []).filter((item) => item.id !== itemId),
      });
    }
  };

  const addCustomItemBullet = (sectionId: string, itemId: string) => {
    const section = customSections.find((s) => s.id === sectionId);
    const item = section?.items?.find((i) => i.id === itemId);
    if (item) {
      updateCustomSectionItem(sectionId, itemId, { bullets: [...(item.bullets || []), ""] });
    }
  };

  const updateCustomItemBullet = (sectionId: string, itemId: string, bulletIndex: number, value: string) => {
    const section = customSections.find((s) => s.id === sectionId);
    const item = section?.items?.find((i) => i.id === itemId);
    if (item) {
      const newBullets = [...(item.bullets || [])];
      newBullets[bulletIndex] = value;
      updateCustomSectionItem(sectionId, itemId, { bullets: newBullets });
    }
  };

  const removeCustomItemBullet = (sectionId: string, itemId: string, bulletIndex: number) => {
    const section = customSections.find((s) => s.id === sectionId);
    const item = section?.items?.find((i) => i.id === itemId);
    if (item && (item.bullets || []).length > 1) {
      updateCustomSectionItem(sectionId, itemId, {
        bullets: (item.bullets || []).filter((_, idx) => idx !== bulletIndex),
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-6">
          <TabsTrigger value="personal" className="gap-1.5 text-xs">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Personal</span>
          </TabsTrigger>
          <TabsTrigger value="skills" className="gap-1.5 text-xs">
            <Star className="w-4 h-4" />
            <span className="hidden sm:inline">Skills</span>
          </TabsTrigger>
          <TabsTrigger value="experience" className="gap-1.5 text-xs">
            <Briefcase className="w-4 h-4" />
            <span className="hidden sm:inline">Experience</span>
          </TabsTrigger>
          <TabsTrigger value="education" className="gap-1.5 text-xs">
            <GraduationCap className="w-4 h-4" />
            <span className="hidden sm:inline">Education</span>
          </TabsTrigger>
          <TabsTrigger value="summary" className="gap-1.5 text-xs">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Summary</span>
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-1.5 text-xs">
            <FolderPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Custom</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4 animate-fade-in">
          <Card className="p-5 glass-effect">
            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Contact Information
            </h3>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={data.personalInfo.fullName}
                  onChange={(e) => updatePersonalInfo("fullName", e.target.value)}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={data.personalInfo.email}
                    onChange={(e) => updatePersonalInfo("email", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    placeholder="(555) 123-4567"
                    value={data.personalInfo.phone}
                    onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="City, State"
                  value={data.personalInfo.location}
                  onChange={(e) => updatePersonalInfo("location", e.target.value)}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="github">GitHub Link (optional)</Label>
                  <Input
                    id="github"
                    placeholder="github.com/johndoe"
                    value={data.personalInfo.github || ""}
                    onChange={(e) => updatePersonalInfo("github", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="portfolio">Portfolio (optional)</Label>
                  <Input
                    id="portfolio"
                    placeholder="johndoe.com"
                    value={data.personalInfo.portfolio || ""}
                    onChange={(e) => updatePersonalInfo("portfolio", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="linkedin">LinkedIn (optional)</Label>
                <Input
                  id="linkedin"
                  placeholder="linkedin.com/in/johndoe"
                  value={data.personalInfo.linkedin || ""}
                  onChange={(e) => updatePersonalInfo("linkedin", e.target.value)}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="animate-fade-in">
          <Card className="p-5 glass-effect">
            <h3 className="font-heading font-semibold mb-4">Professional Summary</h3>
            <Textarea
              placeholder="Results-driven professional with 5+ years of experience in [your field]. Proven track record in [key skills]. Passionate about [industry/goal] and committed to delivering measurable results..."
              value={data.summary}
              onChange={(e) => onChange({ ...data, summary: e.target.value })}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Write 2-4 sentences highlighting your key qualifications, technical skills, and what you're known for.
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4 animate-fade-in">
          <Card className="p-5 glass-effect">
            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              Core Strengths
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Organize your skills by category (e.g., "Front-End", "Testing", "Networking/Systems")
            </p>

            {coreStrengths.map((cat, index) => (
              <div key={cat.id} className="mb-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Category {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSkillCategory(cat.id)}
                    className="text-destructive hover:text-destructive h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <Label>Category Name</Label>
                    <Input
                      placeholder="Front-End"
                      value={cat.category}
                      onChange={(e) => updateSkillCategory(cat.id, { category: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Skills (comma-separated)</Label>
                    <Input
                      placeholder="HTML, CSS, JavaScript, TypeScript, React"
                      value={cat.skills}
                      onChange={(e) => updateSkillCategory(cat.id, { skills: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button onClick={addSkillCategory} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Skill Category
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="experience" className="space-y-4 animate-fade-in">
          {experience.map((exp, index) => (
            <Card key={exp.id} className="p-5 glass-effect">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                  <h3 className="font-heading font-semibold">Position {index + 1}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeExperience(exp.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Company *</Label>
                    <Input
                      placeholder="Acme Corporation"
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Job Title *</Label>
                    <Input
                      placeholder="Software Engineer"
                      value={exp.jobTitle}
                      onChange={(e) => updateExperience(exp.id, { jobTitle: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Location</Label>
                    <Input
                      placeholder="Chicago, IL"
                      value={exp.location}
                      onChange={(e) => updateExperience(exp.id, { location: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Work Type</Label>
                    <Select
                      value={exp.workType || ""}
                      onValueChange={(value) => updateExperience(exp.id, { workType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Remote">Remote</SelectItem>
                        <SelectItem value="Hybrid/Remote">Hybrid/Remote</SelectItem>
                        <SelectItem value="On-site">On-site</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Start Date</Label>
                    <Input
                      type="month"
                      value={exp.startDate}
                      onChange={(e) => {
                        const newStartDate = e.target.value;
                        // If end date exists and is before start date, clear end date
                        if (exp.endDate && newStartDate > exp.endDate) {
                          updateExperience(exp.id, { startDate: newStartDate, endDate: "" });
                        } else {
                          updateExperience(exp.id, { startDate: newStartDate });
                        }
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>End Date</Label>
                    <Input
                      type="month"
                      value={exp.endDate}
                      min={exp.startDate || undefined}
                      onChange={(e) => {
                        const newEndDate = e.target.value;
                        // Validate end date is not before start date
                        if (exp.startDate && newEndDate < exp.startDate) {
                          return; // Don't update if invalid
                        }
                        updateExperience(exp.id, { endDate: newEndDate });
                      }}
                      disabled={exp.current}
                    />
                    {exp.startDate && exp.endDate && exp.endDate < exp.startDate && !exp.current && (
                      <p className="text-xs text-destructive">End date cannot be before start date</p>
                    )}
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`current-${exp.id}`}
                        checked={exp.current}
                        onCheckedChange={(checked) =>
                          updateExperience(exp.id, { current: checked as boolean })
                        }
                      />
                      <Label htmlFor={`current-${exp.id}`} className="text-xs">
                        Current position
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Accomplishments (bullet points) *</Label>
                  {exp.bullets.map((bullet, bulletIndex) => (
                    <div key={bulletIndex} className="flex gap-2">
                      <Textarea
                        placeholder="Built and maintained client-facing web experiences in WordPress, implementing responsive UI sections and interactive components focused on stability and clear UX."
                        value={bullet}
                        onChange={(e) => updateBullet(exp.id, bulletIndex, e.target.value)}
                        rows={2}
                        className="resize-none flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBullet(exp.id, bulletIndex)}
                        disabled={exp.bullets.length <= 1}
                        className="shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addBullet(exp.id)}
                    className="mt-2"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Bullet Point
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          <Button onClick={addExperience} variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Experience
          </Button>
        </TabsContent>

        <TabsContent value="education" className="space-y-4 animate-fade-in">
          {education.map((edu, index) => (
            <Card key={edu.id} className="p-5 glass-effect">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                  <h3 className="font-heading font-semibold">Education {index + 1}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEducation(edu.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Institution *</Label>
                  <Input
                    placeholder="State University"
                    value={edu.institution}
                    onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Degree *</Label>
                    <Input
                      placeholder="Bachelor of Science"
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Field of Study</Label>
                    <Input
                      placeholder="Computer Science"
                      value={edu.field || ""}
                      onChange={(e) => updateEducation(edu.id, { field: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Location</Label>
                    <Input
                      placeholder="City, State"
                      value={edu.location}
                      onChange={(e) => updateEducation(edu.id, { location: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Graduation Year</Label>
                    <Input
                      type="month"
                      value={edu.graduationDate}
                      onChange={(e) => updateEducation(edu.id, { graduationDate: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>GPA (optional)</Label>
                    <Input
                      placeholder="3.8"
                      value={edu.gpa || ""}
                      onChange={(e) => updateEducation(edu.id, { gpa: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}

          <Button onClick={addEducation} variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Education
          </Button>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4 animate-fade-in">
          <Card className="p-5 glass-effect">
            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-primary" />
              Custom Sections
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add custom sections like Certifications, Volunteering, Projects, Publications, Awards, etc.
            </p>

            {customSections.map((section, sectionIndex) => (
              <div key={section.id} className="mb-6 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 flex-1 mr-4">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <Input
                      placeholder="Section Title (e.g., Certifications)"
                      value={section.title}
                      onChange={(e) => updateCustomSection(section.id, { title: e.target.value })}
                      className="font-semibold"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCustomSection(section.id)}
                    className="text-destructive hover:text-destructive h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {(section.items || []).map((item, itemIndex) => (
                  <div key={item.id} className="ml-4 mb-4 p-3 bg-background/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">Item {itemIndex + 1}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCustomSectionItem(section.id, item.id)}
                        className="text-destructive hover:text-destructive h-7 w-7"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="grid gap-3">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label className="text-xs">Title</Label>
                          <Input
                            placeholder="AWS Solutions Architect"
                            value={item.title}
                            onChange={(e) => updateCustomSectionItem(section.id, item.id, { title: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-xs">Date (optional)</Label>
                          <Input
                            placeholder="2024"
                            value={item.date || ""}
                            onChange={(e) => updateCustomSectionItem(section.id, item.id, { date: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label className="text-xs">Subtitle (optional)</Label>
                          <Input
                            placeholder="Amazon Web Services"
                            value={item.subtitle || ""}
                            onChange={(e) => updateCustomSectionItem(section.id, item.id, { subtitle: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-xs">Project Link (optional)</Label>
                          <Input
                            placeholder="https://github.com/user/project"
                            value={item.link || ""}
                            onChange={(e) => updateCustomSectionItem(section.id, item.id, { link: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-xs">Description (optional)</Label>
                        <Textarea
                          placeholder="Brief description..."
                          value={item.description || ""}
                          onChange={(e) => updateCustomSectionItem(section.id, item.id, { description: e.target.value })}
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Bullet Points (optional)</Label>
                        {(item.bullets || []).map((bullet, bulletIndex) => (
                          <div key={bulletIndex} className="flex gap-2">
                            <Input
                              placeholder="Achievement or detail..."
                              value={bullet}
                              onChange={(e) => updateCustomItemBullet(section.id, item.id, bulletIndex, e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeCustomItemBullet(section.id, item.id, bulletIndex)}
                              disabled={(item.bullets || []).length <= 1}
                              className="shrink-0 h-9 w-9"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addCustomItemBullet(section.id, item.id)}
                          className="text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Bullet
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addCustomSectionItem(section.id)}
                  className="ml-4"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>
            ))}

            <Button onClick={addCustomSection} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Section
            </Button>
          </Card>
        </TabsContent>
      </Tabs>

      <Button
        onClick={onOptimize}
        disabled={isOptimizing}
        variant="hero"
        size="lg"
        className="w-full"
      >
        {isOptimizing ? (
          <>
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Optimizing with AI...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Optimize Resume with AI
          </>
        )}
      </Button>
    </div>
  );
};
