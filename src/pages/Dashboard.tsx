import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Briefcase, TrendingUp, Clock, Plus, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface DashboardStats {
  totalResumes: number;
  totalApplications: number;
  activeApplications: number;
  interviewCount: number;
}

interface RecentApplication {
  id: string;
  company_name: string;
  position_title: string;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalResumes: 0,
    totalApplications: 0,
    activeApplications: 0,
    interviewCount: 0,
  });
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch resume count
      const { count: resumeCount } = await supabase
        .from("saved_resumes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user?.id);

      // Fetch application stats
      const { data: applications } = await supabase
        .from("job_applications")
        .select("id, status, company_name, position_title, created_at")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      const appList = applications || [];
      const activeCount = appList.filter((a) =>
        ["applied", "interviewing"].includes(a.status)
      ).length;
      const interviewCount = appList.filter((a) => a.status === "interviewing").length;

      setStats({
        totalResumes: resumeCount || 0,
        totalApplications: appList.length,
        activeApplications: activeCount,
        interviewCount,
      });

      setRecentApplications(appList.slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied":
        return "bg-primary/20 text-primary";
      case "interviewing":
        return "bg-accent/20 text-accent";
      case "offer":
        return "bg-success/20 text-success";
      case "rejected":
        return "bg-destructive/20 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen gradient-surface">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Applications Dashboard</h1>
          <p className="text-muted-foreground">
            Track your job search progress and manage your resumes
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="glass-effect">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Resumes
              </CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalResumes}</div>
              <p className="text-xs text-muted-foreground mt-1">Saved in your library</p>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Applications
              </CardTitle>
              <Briefcase className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalApplications}</div>
              <p className="text-xs text-muted-foreground mt-1">Total submitted</p>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeApplications}</div>
              <p className="text-xs text-muted-foreground mt-1">In progress</p>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Interviews
              </CardTitle>
              <Clock className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.interviewCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Scheduled / In process</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button
            onClick={() => navigate("/")}
            className="h-auto py-6 flex flex-col items-center gap-2"
          >
            <Plus className="h-6 w-6" />
            <span>Create New Resume</span>
          </Button>

          <Button
            variant="secondary"
            onClick={() => navigate("/saved-resumes")}
            className="h-auto py-6 flex flex-col items-center gap-2"
          >
            <FileText className="h-6 w-6" />
            <span>View Saved Resumes</span>
          </Button>

          <Button
            variant="secondary"
            onClick={() => navigate("/job-tracker")}
            className="h-auto py-6 flex flex-col items-center gap-2"
          >
            <Briefcase className="h-6 w-6" />
            <span>Job Tracker</span>
          </Button>
        </div>

        {/* Recent Applications */}
        <Card className="glass-effect">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Applications</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/job-tracker")}
              className="gap-1"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : recentApplications.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">No applications yet</p>
                <Button onClick={() => navigate("/job-tracker")}>
                  Start Tracking Applications
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentApplications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate("/job-tracker")}
                  >
                    <div>
                      <div className="font-medium">{app.position_title}</div>
                      <div className="text-sm text-muted-foreground">{app.company_name}</div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                        app.status
                      )}`}
                    >
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
