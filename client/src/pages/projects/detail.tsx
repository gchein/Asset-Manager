import { useParams } from "wouter";
import { useProject, useJobs, useMyProfile, usePpaDocuments, useSendContract, useCheckDocumentStatus } from "@/hooks/use-data";
import { PageHeader } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Building, Calendar, Send, RefreshCw, FileText, Loader2, Mail } from "lucide-react";
import { format } from "date-fns";

export default function ProjectDetail() {
  const { id } = useParams();
  const projectId = parseInt(id!);
  const { data: project, isLoading: loadingProject } = useProject(projectId);
  const { data: allJobs, isLoading: loadingJobs } = useJobs();
  const { data: profile } = useMyProfile();
  const { data: ppaDocuments, isLoading: loadingDocs } = usePpaDocuments(projectId);
  const { mutateAsync: sendContract, isPending: isSending } = useSendContract();
  const { mutateAsync: checkStatus, isPending: isChecking } = useCheckDocumentStatus();

  const isOps = profile?.role === "ops";

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
            {project.customerEmail && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Customer Email</p>
                  <p className="text-sm text-muted-foreground">{project.customerEmail}</p>
                </div>
              </div>
            )}
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

        {isOps && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                PPA Contracts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => sendContract(projectId)}
                disabled={isSending || !project.customerEmail}
                className="w-full"
              >
                {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send Contract
              </Button>
              {!project.customerEmail && (
                <p className="text-xs text-muted-foreground">Add a customer email to the project to send contracts.</p>
              )}

              {loadingDocs ? (
                <Skeleton className="h-16 w-full" />
              ) : ppaDocuments && ppaDocuments.length > 0 ? (
                <div className="space-y-3">
                  {ppaDocuments.map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{doc.customerName}</span>
                        <Badge variant={
                          doc.status === "completed" ? "default" :
                          doc.status === "declined" || doc.status === "voided" ? "destructive" :
                          "secondary"
                        }>
                          {doc.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{doc.customerEmail}</p>
                      {doc.createdAt && (
                        <p className="text-xs text-muted-foreground">
                          Sent {format(new Date(doc.createdAt), "MMM d, yyyy h:mm a")}
                        </p>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => checkStatus({ docId: doc.id, projectId })}
                        disabled={isChecking}
                        className="w-full"
                      >
                        {isChecking ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-2 h-3 w-3" />}
                        Check Status
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No contracts sent yet.</p>
              )}
            </CardContent>
          </Card>
        )}

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
