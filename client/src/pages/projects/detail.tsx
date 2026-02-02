import { useParams } from "wouter";
import { useProject, useJobs } from "@/hooks/use-data";
import { PageHeader } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Building, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function ProjectDetail() {
  const { id } = useParams();
  const projectId = parseInt(id!);
  const { data: project, isLoading: loadingProject } = useProject(projectId);
  const { data: allJobs, isLoading: loadingJobs } = useJobs();

  const projectJobs = allJobs?.filter(j => j.projectId === projectId);

  if (loadingProject) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) return <div>Project not found</div>;

  return (
    <div className="space-y-8">
      <PageHeader 
        title={project.customerName} 
        description="Project site details and associated jobs."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Site Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Address</p>
                <p className="text-sm text-muted-foreground">{project.address}</p>
                <p className="text-sm text-muted-foreground">{project.city}, {project.state} {project.zipCode}</p>
              </div>
            </div>
            {project.utility && (
              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Utility</p>
                  <p className="text-sm text-muted-foreground">{project.utility}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {project.createdAt && format(new Date(project.createdAt), "PPP")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-semibold">Jobs</h3>
          {loadingJobs ? (
            <Skeleton className="h-32 w-full" />
          ) : !projectJobs || projectJobs.length === 0 ? (
            <p className="text-muted-foreground italic">No jobs found for this project.</p>
          ) : (
            projectJobs.map(job => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card className="hover-elevate cursor-pointer">
                  <CardContent className="flex items-center justify-between p-6">
                    <div>
                      <div className="font-medium">Job #{job.id} - {job.type === 'engineering' ? 'Engineering' : 'R&R'}</div>
                      <div className="text-sm text-muted-foreground">Status: {job.status}</div>
                    </div>
                    <StatusBadge status={job.status} />
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
