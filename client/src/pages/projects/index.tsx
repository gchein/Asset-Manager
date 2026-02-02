import { PageHeader } from "@/components/layout/Shell";
import { useProjects, useCreateProject, useCompanies } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertProjectSchema } from "@shared/schema";
import { useState } from "react";
import { Loader2, Plus, MapPin, Building, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsList() {
  const { data: projects, isLoading } = useProjects();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Projects" 
        description="Manage customer sites and installations."
        action={
          <CreateProjectDialog open={open} onOpenChange={setOpen}>
            <Button size="lg" className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-5 w-5" />
              New Project
            </Button>
          </CreateProjectDialog>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)
        ) : projects?.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Building className="h-16 w-16 mb-4 text-muted-foreground/30" />
            <p className="text-lg font-medium">No projects yet</p>
            <p className="mb-6">Create your first project to get started.</p>
            <Button variant="outline" onClick={() => setOpen(true)}>Create Project</Button>
          </div>
        ) : (
          projects?.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="group cursor-pointer card-hover h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="flex justify-between items-start gap-4">
                    <span className="text-xl group-hover:text-primary transition-colors">{project.customerName}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary/70" />
                      {project.address}, {project.city}, {project.state}
                    </div>
                    {project.utility && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-primary/70" />
                        {project.utility}
                      </div>
                    )}
                  </div>
                  <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {project.createdAt && format(new Date(project.createdAt), "MMM d, yyyy")}
                    </span>
                    <span className="font-medium text-foreground bg-secondary/20 px-2 py-1 rounded">
                      ID: {project.id}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <Card className="h-[200px]">
      <CardHeader>
        <Skeleton className="h-6 w-2/3" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

function CreateProjectDialog({ children, open, onOpenChange }: any) {
  const { mutateAsync: createProject, isPending } = useCreateProject();
  const { data: companies } = useCompanies();
  const form = useForm<z.infer<typeof insertProjectSchema>>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      customerName: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      utility: "",
    },
  });

  async function onSubmit(values: z.infer<typeof insertProjectSchema>) {
    try {
      await createProject(values);
      onOpenChange(false);
      form.reset();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Enter the customer and site details to start a new project.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl><Input {...field} placeholder="John Doe" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Street Address</FormLabel>
                    <FormControl><Input {...field} placeholder="123 Solar Way" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl><Input {...field} maxLength={2} placeholder="CA" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zip Code</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="utility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Utility Provider</FormLabel>
                    <FormControl><Input {...field} placeholder="PG&E" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Company</FormLabel>
                    <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select owning company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies?.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
