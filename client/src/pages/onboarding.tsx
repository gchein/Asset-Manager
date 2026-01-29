import { useState } from "react";
import { useCreateProfile, useCompanies } from "@/hooks/use-data";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Briefcase, HardHat, Settings, PenTool } from "lucide-react";
import { userRoleEnum } from "@shared/schema";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  role: z.enum(userRoleEnum.enumValues),
  companyId: z.string().optional(),
});

export default function Onboarding() {
  const { user } = useAuth();
  const { data: companies, isLoading: loadingCompanies } = useCompanies();
  const { mutateAsync: createProfile, isPending } = useCreateProfile();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: "installer",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    try {
      await createProfile({
        userId: user.id,
        role: values.role,
        companyId: values.companyId ? parseInt(values.companyId) : undefined,
      });
      toast({ title: "Profile created", description: "Welcome to SolarOps!" });
      window.location.href = "/"; // Force full reload to refresh auth state
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to create profile. Please try again.",
        variant: "destructive" 
      });
    }
  }

  const selectedRole = form.watch("role");

  const roles = [
    { value: "ops", label: "Operations Manager", icon: Settings, desc: "Manage projects, jobs, and teams." },
    { value: "installer", label: "Installer", icon: HardHat, desc: "Execute installation jobs and update status." },
    { value: "roofer", label: "Roofer", icon: HardHat, desc: "Handle roofing jobs and repairs." },
    { value: "engineer", label: "Engineer", icon: PenTool, desc: "Create and review engineering plans." },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-800 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
      
      <Card className="w-full max-w-xl relative z-10 border-2 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
            <Briefcase className="text-primary-foreground h-6 w-6" />
          </div>
          <CardTitle className="text-3xl font-display">Complete Your Profile</CardTitle>
          <CardDescription className="text-lg">
            Tell us about your role to set up your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Select your role</FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      {roles.map((role) => (
                        <div
                          key={role.value}
                          className={`
                            relative flex flex-col p-4 cursor-pointer rounded-xl border-2 transition-all duration-200
                            ${field.value === role.value 
                              ? "border-primary bg-primary/5 shadow-md scale-[1.02]" 
                              : "border-border hover:border-primary/50 hover:bg-muted/50"}
                          `}
                          onClick={() => field.onChange(role.value)}
                        >
                          <role.icon className={`h-6 w-6 mb-3 ${field.value === role.value ? "text-primary" : "text-muted-foreground"}`} />
                          <div className="font-semibold">{role.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">{role.desc}</div>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-xl">
                          <SelectValue placeholder="Select a company..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadingCompanies ? (
                          <div className="p-4 flex justify-center"><Loader2 className="animate-spin h-5 w-5" /></div>
                        ) : (
                          companies?.map((company) => (
                            <SelectItem key={company.id} value={company.id.toString()}>
                              {company.name} ({company.type})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={isPending}
                className="w-full h-12 text-lg font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
              >
                {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                {isPending ? "Setting up..." : "Complete Setup"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
