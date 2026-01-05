import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, MoreVertical, Download, Trash2, Edit, Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ResumeData } from "@/types/resume";
import { generatePDF, generateDOCX } from "@/lib/documentExport";

interface SavedResume {
  id: string;
  name: string;
  resume_data: ResumeData;
  ats_score: number | null;
  target_job: string | null;
  created_at: string;
  updated_at: string;
}

const SavedResumes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchResumes();
    }
  }, [user]);

  const fetchResumes = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_resumes")
        .select("*")
        .eq("user_id", user?.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setResumes((data as unknown as SavedResume[]) || []);
    } catch (error) {
      console.error("Error fetching resumes:", error);
      toast.error("Failed to load resumes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase.from("saved_resumes").delete().eq("id", deleteId);

      if (error) throw error;

      setResumes((prev) => prev.filter((r) => r.id !== deleteId));
      toast.success("Resume deleted");
    } catch (error) {
      console.error("Error deleting resume:", error);
      toast.error("Failed to delete resume");
    } finally {
      setDeleteId(null);
    }
  };

  const handleDownloadPDF = (resume: SavedResume) => {
    try {
      generatePDF(resume.resume_data);
      toast.success("PDF downloaded");
    } catch (error) {
      toast.error("Failed to generate PDF");
    }
  };

  const handleDownloadDOCX = async (resume: SavedResume) => {
    try {
      await generateDOCX(resume.resume_data);
      toast.success("DOCX downloaded");
    } catch (error) {
      toast.error("Failed to generate DOCX");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen gradient-surface">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Saved Resumes</h1>
              <p className="text-muted-foreground">
                {resumes.length} resume{resumes.length !== 1 ? "s" : ""} saved
              </p>
            </div>
          </div>
          <Button onClick={() => navigate("/")}>
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : resumes.length === 0 ? (
          <Card className="glass-effect">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No resumes saved yet</h2>
              <p className="text-muted-foreground mb-6">
                Create and save your first resume to see it here
              </p>
              <Button onClick={() => navigate("/")}>Create Resume</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map((resume) => (
              <Card key={resume.id} className="glass-effect hover:border-primary/50 transition-colors">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{resume.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {resume.resume_data?.personalInfo?.fullName || "No name"}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDownloadPDF(resume)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadDOCX(resume)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download DOCX
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteId(resume.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {resume.target_job && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Target: </span>
                        <span>{resume.target_job}</span>
                      </div>
                    )}
                    {resume.ats_score && (
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${resume.ats_score}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{resume.ats_score}%</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                      <span>Updated {formatDate(resume.updated_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resume</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this resume? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SavedResumes;
