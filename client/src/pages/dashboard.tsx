import { useAuth } from "@/hooks/use-auth";
import { useMyProfile, useJobs, useProjects } from "@/hooks/use-data";
import { PageHeader } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ArrowRight, Activity, CheckCircle2, Clock } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: profile } = useMyProfile();
  
  if (!profile) return <div className="p-8">Loading profile...</div>;

  return (
    <div className="space-y-8">
      <PageHeader 
        title={user?.firstName ? `Welcome back, ${user.firstName}` : "Welcome back"} 
        description={`Here's what's happening with your ${profile.role === "ops" ? "operations" : "tasks"} today.`}
        action={profile.role === "ops" && (
          <Link href="/projects">
            <Button size="lg" className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-5 w-5" />
              New Project
            </Button>
          </Link>
        )}
      />

      <StatsOverview role={profile.role} profile={profile} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentJobs role={profile.role} profile={profile} />
        <ActivityChart />
      </div>
    </div>
  );
}

function StatsOverview({ role, profile }: { role: string, profile: any }) {
  const { user } = useAuth();
  const { data: jobs } = useJobs();
  
  if (!jobs) return <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    {[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
  </div>;

  const filteredJobs = role === "ops" ? jobs : jobs.filter(j => 
    j.assignedEngineerId === user?.id || 
    j.project.companyId === profile.companyId
  );

  const active = filteredJobs.filter(j => ['in_progress', 'assigned'].includes(j.status)).length;
  const completed = filteredJobs.filter(j => j.status === 'completed').length;
  const pending = filteredJobs.filter(j => j.status === 'submitted').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="glass-panel border-l-4 border-l-blue-500">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Active Jobs</p>
              <h3 className="text-4xl font-bold font-display mt-2 text-foreground">{active}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Activity className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-panel border-l-4 border-l-orange-500">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
              <h3 className="text-4xl font-bold font-display mt-2 text-foreground">
                {pending}
              </h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-panel border-l-4 border-l-green-500">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed This Month</p>
              <h3 className="text-4xl font-bold font-display mt-2 text-foreground">{completed}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RecentJobs({ role, profile }: { role: string, profile: any }) {
  const { user } = useAuth();
  const { data: jobs, isLoading } = useJobs();

  if (isLoading) return <Skeleton className="h-[400px] rounded-2xl" />;

  const filteredJobs = role === "ops" ? (jobs || []) : (jobs || []).filter(j => 
    j.assignedEngineerId === user?.id || 
    j.project.companyId === profile?.companyId
  );

  const recentJobs = filteredJobs.slice(0, 5);

  return (
    <Card className="col-span-1 shadow-md border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Activity</CardTitle>
        <Link href="/jobs">
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {recentJobs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No jobs found.</div>
          ) : (
            recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between group">
                <div className="space-y-1">
                  <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {job.project.customerName}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="uppercase text-[10px] font-bold tracking-wider bg-secondary/20 text-secondary-foreground px-1.5 py-0.5 rounded">
                      {job.type}
                    </span>
                    <span>•</span>
                    <span>{job.project.city}, {job.project.state}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={job.status} />
                  <Link href={`/jobs/${job.id}`}>
                    <Button variant="outline" size="sm" className="hidden group-hover:flex">
                      Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityChart() {
  const data = [
    { name: 'Mon', jobs: 4 },
    { name: 'Tue', jobs: 3 },
    { name: 'Wed', jobs: 7 },
    { name: 'Thu', jobs: 5 },
    { name: 'Fri', jobs: 8 },
    { name: 'Sat', jobs: 2 },
    { name: 'Sun', jobs: 1 },
  ];

  return (
    <Card className="col-span-1 shadow-md border-border/50">
      <CardHeader>
        <CardTitle>Weekly Job Volume</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))'}} />
              <Tooltip 
                cursor={{fill: 'hsl(var(--muted))', opacity: 0.3}}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="jobs" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
