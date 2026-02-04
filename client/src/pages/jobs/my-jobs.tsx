import { PageHeader } from "@/components/layout/Shell";
import { useJobs } from "@/hooks/use-data";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

export default function MyJobs() {
  const { user } = useAuth();
  const { data: jobs, isLoading } = useJobs();

  // Filter jobs to show only those where the user is assigned or belongs to their company
  // Note: Backend might already filter this if passing filters, but we ensure it here too.
  const myJobs = jobs?.filter(job =>
    job.assignedEngineerId === user?.id ||
    job.project.companyId === (user as any)?.companyId
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Jobs"
        description="Jobs assigned to you or your company."
      />

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <Card key={i} className="h-24">
              <CardContent className="flex items-center p-6">
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))
        ) : !myJobs || myJobs.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
            No jobs found for you.
          </div>
        ) : (
          myJobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="hover-elevate cursor-pointer">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="space-y-1">
                    <div className="font-medium">Job #{job.id} - {job.project.customerName}</div>
                    <div className="text-sm text-muted-foreground">{job.type === 'engineering' ? 'Engineering' : 'R&R'}</div>
                  </div>
                  <StatusBadge status={job.status} />
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
