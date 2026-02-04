import { useRoute } from "wouter";
import { useJob, useUpdateJob, useMessages, useCreateMessage, useEngineers, useMyProfile } from "@/hooks/use-data";
import { PageHeader } from "@/components/layout/Shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Send, MapPin, Calendar, User, FileText, CheckCircle, UserPlus, Clock, Activity, Building2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function getAllowedStatuses(role: string, jobType: string, currentStatus: string, isAssigned: boolean, isCompanyJob: boolean): string[] {
  if (role === 'ops') {
    return ['new', 'assigned', 'in_progress', 'submitted', 'needs_revision', 'completed', 'cancelled'];
  }

  if (role === 'engineer' && isAssigned) {
    // Engineers can progress their assigned jobs
    if (currentStatus === 'assigned') return ['in_progress'];
    if (currentStatus === 'in_progress') return ['submitted', 'needs_revision'];
    if (currentStatus === 'needs_revision') return ['in_progress'];
  }

  if ((role === 'installer' || role === 'roofer') && isCompanyJob) {
    // Can approve/complete jobs for their company
    if (currentStatus === 'submitted') return ['completed', 'needs_revision'];
    if (currentStatus === 'in_progress') return ['completed'];
  }

  return []; // No transitions allowed
}

function canEditWorkflowStep(
  stepName: string,
  role: string,
  jobType: string,
  isAssigned: boolean,
  isCompanyJob: boolean
): boolean {
  if (role === 'ops') return true;

  if (jobType === 'engineering') {
    if (stepName === 'Site Survey' && role === 'engineer' && isAssigned) return true;
    if (stepName === 'Engineering Design' && role === 'engineer' && isAssigned) return true;
    if (stepName === 'Permit Package' && role === 'ops') return true; // Only ops
  }

  if (jobType === 'r_and_r') {
    if ((role === 'roofer' || role === 'installer') && isCompanyJob) return true;
    if (role === 'engineer' && isAssigned) return true;
  }

  return false;
}

type JobForStep = { status: string; type: string; details?: Record<string, unknown> | null };
function getWorkflowStepStatus(
  stepName: string,
  job: JobForStep,
  derived: 'pending' | 'in_progress' | 'completed'
): 'pending' | 'in_progress' | 'completed' | 'action_required' {
  const stored = (job.details?.workflowSteps as Record<string, string>)?.[stepName];
  if (stored === 'pending' || stored === 'in_progress' || stored === 'completed') return stored;
  return derived as 'pending' | 'in_progress' | 'completed';
}

export default function JobDetail() {
  const [, params] = useRoute("/jobs/:id");
  const jobId = parseInt(params?.id || "0");
  const { data: job, isLoading } = useJob(jobId);
  const { mutate: updateJob } = useUpdateJob();
  const { data: profile } = useMyProfile();
  const { data: engineers } = useEngineers();

  if (isLoading || !job) {
    return <div className="p-10"><Skeleton className="h-96 w-full" /></div>;
  }

  const isOps = profile?.role === "ops";
  const isAssigned = job.assignedEngineerId === profile?.userId;
  const isCompanyJob = job.project.companyId === profile?.companyId;

  const allowedStatuses = getAllowedStatuses(
    profile?.role || '',
    job.type,
    job.status,
    isAssigned,
    isCompanyJob
  );

  const canUpdateStatus = allowedStatuses.length > 0;

  const handleStatusChange = (status: string) => {
    updateJob({ id: jobId, data: { status: status as any } });
  };

  const handleEngineerChange = (engineerId: string) => {
    if (engineerId === "unassigned") {
      updateJob({ id: jobId, data: { assignedEngineerId: null, status: "new" } });
    } else {
      updateJob({ id: jobId, data: { assignedEngineerId: engineerId, status: "assigned" } });
    }
  };

  const handleWorkflowStepChange = (stepName: string, newStepStatus: 'pending' | 'in_progress' | 'completed') => {
    let newJobStatus = job.status;

    if (job.type === 'engineering') {
      if (stepName === 'Site Survey') {
        if (newStepStatus === 'completed') newJobStatus = 'in_progress';
        else if (newStepStatus === 'in_progress') newJobStatus = 'assigned';
      } else if (stepName === 'Engineering Design') {
        if (newStepStatus === 'completed') newJobStatus = 'submitted';
        else if (newStepStatus === 'in_progress') newJobStatus = 'in_progress';
      } else if (stepName === 'Permit Package') {
        if (newStepStatus === 'completed') newJobStatus = 'completed';
        else if (newStepStatus === 'in_progress') newJobStatus = 'submitted';
      }
    } else if (job.type === 'r_and_r') {
      // For R&R jobs, map workflow to status
      if (newStepStatus === 'completed') {
        // Check if this is the last step
        if (stepName === 'Panel Reinstallation') {
          newJobStatus = 'completed';
        } else {
          newJobStatus = 'in_progress';
        }
      } else if (newStepStatus === 'in_progress') {
        newJobStatus = 'in_progress';
      }
    }

    const workflowSteps = { ...(job.details?.workflowSteps as Record<string, string> || {}), [stepName]: newStepStatus };
    const newDetails = { ...(job.details || {}), workflowSteps };
    updateJob({ id: jobId, data: { details: newDetails as any, status: newJobStatus } });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <StatusBadge status={job.status} className="text-sm px-3 py-1" />
            <span className="text-sm text-muted-foreground uppercase font-bold tracking-wider">{job.type} Job</span>
          </div>
          <h1 className="text-3xl font-display font-bold">{job.project.customerName}</h1>
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {job.project.address}, {job.project.city}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="font-semibold">{(job.project as any).company?.name || "Loading..."}</span>
              <span className="text-muted-foreground">(Project Owner)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {canUpdateStatus && (
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Change Status</Label>
              <Select defaultValue={job.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                  {allowedStatuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button variant="outline">View Project</Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-background border p-1 rounded-xl h-auto">
          <TabsTrigger value="overview" className="rounded-lg py-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Overview</TabsTrigger>
          <TabsTrigger value="details" className="rounded-lg py-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Job Details</TabsTrigger>
          <TabsTrigger value="messages" className="rounded-lg py-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Job Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <p className="font-medium">{job.createdAt ? format(new Date(job.createdAt), "PPP") : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                    <p className="font-medium">{job.updatedAt ? format(new Date(job.updatedAt), "PPP") : "N/A"}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Assigned Engineer</p>
                    {isOps && job.type === 'engineering' ? (
                      <Select defaultValue={job.assignedEngineerId || "unassigned"} onValueChange={handleEngineerChange}>
                        <SelectTrigger className="w-full h-10">
                          <div className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4 text-primary" />
                            <SelectValue placeholder="Assign Engineer" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">No Engineer Assigned</SelectItem>
                          {engineers?.map((eng) => (
                            <SelectItem key={eng.id} value={eng.id}>
                              {eng.firstName} {eng.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : job.type === 'engineering' ? (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="font-medium">
                          {(job as any).assignedEngineer ? `${(job as any).assignedEngineer.firstName} ${(job as any).assignedEngineer.lastName}` : "Unassigned"}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Not applicable for R&R jobs</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Job related files</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button variant="ghost" className="justify-start h-auto py-3">
                    <FileText className="mr-2 h-4 w-4" /> Site Survey.pdf
                  </Button>
                  <Button variant="ghost" className="justify-start h-auto py-3">
                    <FileText className="mr-2 h-4 w-4" /> Permit.pdf
                  </Button>
                  <Button size="sm" className="mt-4">Upload File</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Workflow Status</CardTitle>
                <CardDescription>Current progress and required actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {job.type === 'engineering' ? (
                    <>
                      <WorkflowStep
                        title="Site Survey"
                        status={getWorkflowStepStatus('Site Survey', job, job.status === 'new' ? 'pending' : 'completed')}
                        description="Collection of on-site measurements and photos."
                        canEdit={canEditWorkflowStep('Site Survey', profile?.role || '', job.type, isAssigned, isCompanyJob)}
                        onStatusChange={(newStatus) => handleWorkflowStepChange('Site Survey', newStatus)}
                      />
                      <WorkflowStep
                        title="Engineering Design"
                        status={getWorkflowStepStatus('Engineering Design', job, ['assigned', 'in_progress'].includes(job.status) ? 'in_progress' : job.status === 'completed' ? 'completed' : 'pending')}
                        description="Creation of electrical and structural plans."
                        canEdit={canEditWorkflowStep('Engineering Design', profile?.role || '', job.type, isAssigned, isCompanyJob)}
                        onStatusChange={(newStatus) => handleWorkflowStepChange('Engineering Design', newStatus)}
                      />
                      <WorkflowStep
                        title="Permit Package"
                        status={getWorkflowStepStatus('Permit Package', job, job.status === 'submitted' ? 'in_progress' : job.status === 'completed' ? 'completed' : 'pending')}
                        description="Final documentation for city submittal."
                        canEdit={canEditWorkflowStep('Permit Package', profile?.role || '', job.type, isAssigned, isCompanyJob)}
                        onStatusChange={(newStatus) => handleWorkflowStepChange('Permit Package', newStatus)}
                      />
                    </>
                  ) : (
                    <>
                      <WorkflowStep
                        title="Before Removal Photos"
                        status={getWorkflowStepStatus('Before Removal Photos', job, job.status === 'new' ? 'pending' : 'completed')}
                        canEdit={canEditWorkflowStep('Before Removal Photos', profile?.role || '', job.type, isAssigned, isCompanyJob)}
                        onStatusChange={(newStatus) => handleWorkflowStepChange('Before Removal Photos', newStatus)}
                      />
                      <WorkflowStep
                        title="Panel Removal"
                        status={getWorkflowStepStatus('Panel Removal', job, job.status === 'in_progress' ? 'in_progress' : job.status === 'completed' ? 'completed' : 'pending')}
                        canEdit={canEditWorkflowStep('Panel Removal', profile?.role || '', job.type, isAssigned, isCompanyJob)}
                        onStatusChange={(newStatus) => handleWorkflowStepChange('Panel Removal', newStatus)}
                      />
                      <WorkflowStep
                        title="Roofing Work"
                        status={getWorkflowStepStatus('Roofing Work', job, job.status === 'in_progress' ? 'in_progress' : job.status === 'completed' ? 'completed' : 'pending')}
                        canEdit={canEditWorkflowStep('Roofing Work', profile?.role || '', job.type, isAssigned, isCompanyJob)}
                        onStatusChange={(newStatus) => handleWorkflowStepChange('Roofing Work', newStatus)}
                      />
                      <WorkflowStep
                        title="Panel Reinstallation"
                        status={getWorkflowStepStatus('Panel Reinstallation', job, job.status === 'submitted' ? 'in_progress' : job.status === 'completed' ? 'completed' : 'pending')}
                        canEdit={canEditWorkflowStep('Panel Reinstallation', profile?.role || '', job.type, isAssigned, isCompanyJob)}
                        onStatusChange={(newStatus) => handleWorkflowStepChange('Panel Reinstallation', newStatus)}
                      />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Technical Details</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="p-4 text-center text-xs text-muted-foreground border-2 border-dashed rounded-xl">
                   {JSON.stringify(job.details) === '{}' ? 'No additional technical data provided.' : 'Technical specifications available in files.'}
                 </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="messages">
          <MessagesPanel jobId={jobId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WorkflowStep({
  title,
  status,
  description,
  canEdit = false,
  onStatusChange
}: {
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'action_required';
  description?: string;
  canEdit?: boolean;
  onStatusChange?: (newStatus: 'pending' | 'in_progress' | 'completed') => void;
}) {
  const icons = {
    pending: <Clock className="h-5 w-5 text-muted-foreground" />,
    in_progress: <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />,
    completed: <CheckCircle className="h-5 w-5 text-green-500" />,
    action_required: <Activity className="h-5 w-5 text-orange-500" />
  };

  const bgColors = {
    pending: 'bg-muted/50',
    in_progress: 'bg-blue-50 border-blue-100',
    completed: 'bg-green-50 border-green-100',
    action_required: 'bg-orange-50 border-orange-100'
  };

  return (
    <div className={cn("flex items-start gap-4 p-4 rounded-xl border transition-all", bgColors[status])}>
      <div className="mt-0.5">{icons[status]}</div>
      <div className="flex-1">
        <p className="font-semibold text-sm">{title}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {canEdit && onStatusChange ? (
        <Select value={status} onValueChange={(val) => onStatusChange(val as any)}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <div className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-white/50 border">
          {status.replace('_', ' ')}
        </div>
      )}
    </div>
  );
}

function MessagesPanel({ jobId }: { jobId: number }) {
  const { data: messages, isLoading } = useMessages(jobId);
  const { mutate: createMessage, isPending } = useCreateMessage();
  const [content, setContent] = useState("");
  const { user } = useAuth();

  const handleSend = () => {
    if (!content.trim()) return;
    createMessage({ jobId, data: { content, isRevisionRequest: false } }, {
      onSuccess: () => setContent("")
    });
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle>Team Communication</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-4 p-1">
            {isLoading ? <Loader2 className="animate-spin" /> : messages?.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.userId === user?.id ? 'flex-row-reverse' : ''}`}>
                <div className={`
                  max-w-[80%] rounded-xl p-3 text-sm
                  ${msg.userId === user?.id
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : 'bg-muted text-foreground rounded-tl-none'}
                `}>
                  <p className="font-semibold text-xs mb-1 opacity-70">
                    {msg.user.firstName} • {format(new Date(msg.createdAt || ""), "p")}
                  </p>
                  <p>{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="mt-4 flex gap-2 pt-4 border-t">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message..."
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
          />
          <Button onClick={handleSend} disabled={isPending || !content.trim()} size="icon" className="h-[60px] w-[60px]">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
