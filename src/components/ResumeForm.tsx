import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, GripVertical, Briefcase, GraduationCap, User, Sparkles } from "lucide-react";
import { ResumeData, ExperienceItem, EducationItem } from "@/types/resume";
import { createEmptyExperience, createEmptyEducation } from "@/lib/resumeUtils";
import { Checkbox } from "@/components/ui/checkbox";

interface ResumeFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  onOptimize: () => void;
  isOptimizing: boolean;
}

export const ResumeForm = ({ data, onChange, onOptimize, isOptimizing }: ResumeFormProps) => {
  const updatePersonalInfo = (field: keyof ResumeData["personalInfo"], value: string) => {
    onChange({
      ...data,
      personalInfo: { ...data.personalInfo, [field]: value },
    });
  };

  const addExperience = () => {
    onChange({
      ...data,
      experience: [...data.experience, createEmptyExperience()],
    });
  };

  const updateExperience = (id: string, updates: Partial<ExperienceItem>) => {
    onChange({
      ...data,
      experience: data.experience.map((exp) =>
        exp.id === id ? { ...exp, ...updates } : exp
      ),
    });
  };

  const removeExperience = (id: string) => {
    onChange({
      ...data,
      experience: data.experience.filter((exp) => exp.id !== id),
    });
  };

  const addBullet = (expId: string) => {
    const exp = data.experience.find((e) => e.id === expId);
    if (exp) {
      updateExperience(expId, { bullets: [...exp.bullets, ""] });
    }
  };

  const updateBullet = (expId: string, bulletIndex: number, value: string) => {
    const exp = data.experience.find((e) => e.id === expId);
    if (exp) {
      const newBullets = [...exp.bullets];
      newBullets[bulletIndex] = value;
      updateExperience(expId, { bullets: newBullets });
    }
  };

  const removeBullet = (expId: string, bulletIndex: number) => {
    const exp = data.experience.find((e) => e.id === expId);
    if (exp && exp.bullets.length > 1) {
      updateExperience(expId, {
        bullets: exp.bullets.filter((_, idx) => idx !== bulletIndex),
      });
    }
  };

  const addEducation = () => {
    onChange({
      ...data,
      education: [...data.education, createEmptyEducation()],
    });
  };

  const updateEducation = (id: string, updates: Partial<EducationItem>) => {
    onChange({
      ...data,
      education: data.education.map((edu) =>
        edu.id === id ? { ...edu, ...updates } : edu
      ),
    });
  };

  const removeEducation = (id: string) => {
    onChange({
      ...data,
      education: data.education.filter((edu) => edu.id !== id),
    });
  };

  const updateSkills = (value: string) => {
    onChange({
      ...data,
      skills: value.split(",").map((s) => s.trim()),
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="personal" className="gap-1.5 text-xs sm:text-sm">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Personal</span>
          </TabsTrigger>
          <TabsTrigger value="experience" className="gap-1.5 text-xs sm:text-sm">
            <Briefcase className="w-4 h-4" />
            <span className="hidden sm:inline">Experience</span>
          </TabsTrigger>
          <TabsTrigger value="education" className="gap-1.5 text-xs sm:text-sm">
            <GraduationCap className="w-4 h-4" />
            <span className="hidden sm:inline">Education</span>
          </TabsTrigger>
          <TabsTrigger value="skills" className="gap-1.5 text-xs sm:text-sm">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Skills</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4 animate-fade-in">
          <Card className="p-5 bg-card border-border">
            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Contact Information
            </h3>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Smith"
                  value={data.personalInfo.fullName}
                  onChange={(e) => updatePersonalInfo("fullName", e.target.value)}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={data.personalInfo.email}
                    onChange={(e) => updatePersonalInfo("email", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="(555) 123-4567"
                    value={data.personalInfo.phone}
                    onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="New York, NY"
                    value={data.personalInfo.location}
                    onChange={(e) => updatePersonalInfo("location", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="linkedin">LinkedIn (optional)</Label>
                  <Input
                    id="linkedin"
                    placeholder="linkedin.com/in/johnsmith"
                    value={data.personalInfo.linkedin || ""}
                    onChange={(e) => updatePersonalInfo("linkedin", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-card border-border">
            <h3 className="font-heading font-semibold mb-4">Professional Summary</h3>
            <Textarea
              placeholder="Results-driven professional with 5+ years of experience..."
              value={data.summary}
              onChange={(e) => onChange({ ...data, summary: e.target.value })}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Write 2-3 sentences highlighting your key qualifications and career goals.
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="experience" className="space-y-4 animate-fade-in">
          {data.experience.map((exp, index) => (
            <Card key={exp.id} className="p-5 bg-card border-border">
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
                    <Label>Job Title</Label>
                    <Input
                      placeholder="Senior Software Engineer"
                      value={exp.jobTitle}
                      onChange={(e) => updateExperience(exp.id, { jobTitle: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Company</Label>
                    <Input
                      placeholder="Tech Company Inc."
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Location</Label>
                    <Input
                      placeholder="San Francisco, CA"
                      value={exp.location}
                      onChange={(e) => updateExperience(exp.id, { location: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Start Date</Label>
                    <Input
                      type="month"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>End Date</Label>
                    <Input
                      type="month"
                      value={exp.endDate}
                      onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                      disabled={exp.current}
                    />
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
                  <Label>Accomplishments (bullet points)</Label>
                  {exp.bullets.map((bullet, bulletIndex) => (
                    <div key={bulletIndex} className="flex gap-2">
                      <Textarea
                        placeholder="Led development of new feature resulting in 25% increase in user engagement..."
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
          {data.education.map((edu, index) => (
            <Card key={edu.id} className="p-5 bg-card border-border">
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
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Degree</Label>
                    <Input
                      placeholder="Bachelor of Science in Computer Science"
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Institution</Label>
                    <Input
                      placeholder="University of California, Berkeley"
                      value={edu.institution}
                      onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Location</Label>
                    <Input
                      placeholder="Berkeley, CA"
                      value={edu.location}
                      onChange={(e) => updateEducation(edu.id, { location: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Graduation Date</Label>
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

        <TabsContent value="skills" className="animate-fade-in">
          <Card className="p-5 bg-card border-border">
            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Skills & Keywords
            </h3>
            <Textarea
              placeholder="JavaScript, React, Node.js, Python, SQL, Project Management, Agile..."
              value={data.skills.join(", ")}
              onChange={(e) => updateSkills(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Separate skills with commas. Include technical skills, tools, and soft skills.
            </p>
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
