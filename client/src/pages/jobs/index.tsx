import { PageHeader } from "@/components/layout/Shell";
import { useJobs } from "@/hooks/use-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function AllJobs() {
  const { data: jobs, isLoading } = useJobs();

  return (
    <div className="space-y-8">
      <PageHeader 
        title="All Jobs" 
        description="Overview of all active and historical jobs."
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
        ) : (
          jobs?.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="hover-elevate cursor-pointer">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="space-y-1">
                    <div className="font-medium">Job #{job.id} - {job.project.customerName}</div>
                    <div className="text-sm text-muted-foreground">
                      {job.type === 'engineering' ? 'Engineering' : 'R&R'} • {(job.project as any).company?.name || 'Unknown Company'}
                    </div>
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
