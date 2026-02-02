import { PageHeader } from "@/components/layout/Shell";
import { MessageSquare } from "lucide-react";

export default function Messages() {
  return (
    <div className="space-y-8">
      <PageHeader 
        title="Messages" 
        description="Global message center for all jobs."
      />
      
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
        <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
        <p>Select a specific job to view its message thread.</p>
      </div>
    </div>
  );
}
