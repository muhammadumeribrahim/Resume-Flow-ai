import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  ArrowLeft,
  MoreVertical,
  Trash2,
  ExternalLink,
  StickyNote,
  Building2,
  MapPin,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

interface JobApplication {
  id: string;
  company_name: string;
  position_title: string;
  location: string | null;
  work_type: "remote" | "onsite" | "hybrid" | null;
  status: "saved" | "applied" | "interviewing" | "offer" | "rejected" | "withdrawn";
  applied_date: string | null;
  job_url: string | null;
  salary_range: string | null;
  created_at: string;
  updated_at: string;
}

interface ApplicationNote {
  id: string;
  application_id: string;
  note_type: "general" | "interview" | "followup" | "feedback";
  content: string;
  note_date: string;
}

const statusOptions = [
  { value: "saved", label: "Saved", color: "bg-muted text-muted-foreground" },
  { value: "applied", label: "Applied", color: "bg-primary/20 text-primary" },
  { value: "interviewing", label: "Interviewing", color: "bg-accent/20 text-accent" },
  { value: "offer", label: "Offer", color: "bg-success/20 text-success" },
  { value: "rejected", label: "Rejected", color: "bg-destructive/20 text-destructive" },
  { value: "withdrawn", label: "Withdrawn", color: "bg-muted text-muted-foreground" },
];

const workTypeOptions = [
  { value: "remote", label: "Remote" },
  { value: "onsite", label: "On-site" },
  { value: "hybrid", label: "Hybrid" },
];

const JobTracker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [notes, setNotes] = useState<ApplicationNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [formData, setFormData] = useState({
    company_name: "",
    position_title: "",
    location: "",
    work_type: "",
    status: "applied",
    applied_date: new Date().toISOString().split("T")[0],
    job_url: "",
    salary_range: "",
  });

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications((data as JobApplication[]) || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async (applicationId: string) => {
    try {
      const { data, error } = await supabase
        .from("application_notes")
        .select("*")
        .eq("application_id", applicationId)
        .order("note_date", { ascending: false });

      if (error) throw error;
      setNotes((data as ApplicationNote[]) || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const handleAddApplication = async () => {
    if (!formData.company_name || !formData.position_title) {
      toast.error("Please fill in company and position");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("job_applications")
        .insert({
          user_id: user?.id,
          company_name: formData.company_name,
          position_title: formData.position_title,
          location: formData.location || null,
          work_type: formData.work_type || null,
          status: formData.status,
          applied_date: formData.applied_date || null,
          job_url: formData.job_url || null,
          salary_range: formData.salary_range || null,
        })
        .select()
        .single();

      if (error) throw error;

      setApplications((prev) => [data as JobApplication, ...prev]);
      setIsAddDialogOpen(false);
      setFormData({
        company_name: "",
        position_title: "",
        location: "",
        work_type: "",
        status: "applied",
        applied_date: new Date().toISOString().split("T")[0],
        job_url: "",
        salary_range: "",
      });
      toast.success("Application added");
    } catch (error) {
      console.error("Error adding application:", error);
      toast.error("Failed to add application");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("job_applications")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      setApplications((prev) =>
        prev.map((app) =>
          app.id === id ? { ...app, status: newStatus as JobApplication["status"] } : app
        )
      );
      toast.success("Status updated");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase.from("job_applications").delete().eq("id", deleteId);

      if (error) throw error;

      setApplications((prev) => prev.filter((a) => a.id !== deleteId));
      toast.success("Application deleted");
    } catch (error) {
      console.error("Error deleting application:", error);
      toast.error("Failed to delete application");
    } finally {
      setDeleteId(null);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedApp) return;

    try {
      const { data, error } = await supabase
        .from("application_notes")
        .insert({
          application_id: selectedApp.id,
          user_id: user?.id,
          content: newNote,
          note_type: "general",
        })
        .select()
        .single();

      if (error) throw error;

      setNotes((prev) => [data as ApplicationNote, ...prev]);
      setNewNote("");
      toast.success("Note added");
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    }
  };

  const openNotesDialog = (app: JobApplication) => {
    setSelectedApp(app);
    fetchNotes(app.id);
    setIsNotesDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    return statusOptions.find((s) => s.value === status)?.color || "bg-muted";
  };

  const filteredApplications =
    filterStatus === "all"
      ? applications
      : applications.filter((a) => a.status === filterStatus);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
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
              <h1 className="text-3xl font-bold">Job Tracker</h1>
              <p className="text-muted-foreground">
                {applications.length} application{applications.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Application
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Job Application</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Company Name *</Label>
                  <Input
                    placeholder="e.g., Acme Corp"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Position Title *</Label>
                  <Input
                    placeholder="e.g., Software Engineer"
                    value={formData.position_title}
                    onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      placeholder="e.g., New York, NY"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Work Type</Label>
                    <Select
                      value={formData.work_type}
                      onValueChange={(v) => setFormData({ ...formData, work_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {workTypeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) => setFormData({ ...formData, status: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Applied Date</Label>
                    <Input
                      type="date"
                      value={formData.applied_date}
                      onChange={(e) => setFormData({ ...formData, applied_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Job URL</Label>
                  <Input
                    placeholder="https://..."
                    value={formData.job_url}
                    onChange={(e) => setFormData({ ...formData, job_url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Salary Range</Label>
                  <Input
                    placeholder="e.g., $80k - $100k"
                    value={formData.salary_range}
                    onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddApplication} className="w-full">
                  Add Application
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Applications</SelectItem>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : filteredApplications.length === 0 ? (
          <Card className="glass-effect">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Building2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No applications yet</h2>
              <p className="text-muted-foreground mb-6">
                Start tracking your job applications
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Application
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredApplications.map((app) => (
              <Card key={app.id} className="glass-effect hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg truncate">{app.position_title}</h3>
                        <Select
                          value={app.status}
                          onValueChange={(v) => handleUpdateStatus(app.id, v)}
                        >
                          <SelectTrigger
                            className={`w-auto h-7 text-xs font-medium border-0 ${getStatusColor(
                              app.status
                            )}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {app.company_name}
                        </span>
                        {app.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {app.location}
                          </span>
                        )}
                        {app.work_type && (
                          <span className="capitalize">{app.work_type}</span>
                        )}
                        {app.applied_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(app.applied_date)}
                          </span>
                        )}
                        {app.salary_range && <span>{app.salary_range}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {app.job_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(app.job_url!, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openNotesDialog(app)}
                      >
                        <StickyNote className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setDeleteId(app.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Notes Dialog */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Notes - {selectedApp?.position_title} at {selectedApp?.company_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Add a note (interview details, follow-up reminders, etc.)"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
              />
              <Button onClick={handleAddNote} disabled={!newNote.trim()} className="w-full">
                Add Note
              </Button>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {notes.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No notes yet</p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm">{note.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(note.note_date)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this application? This will also delete all associated notes.
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

export default JobTracker;
