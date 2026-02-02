import { PageHeader } from "@/components/layout/Shell";
import { useCompanies } from "@/hooks/use-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, User, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function CompaniesList() {
  const { data: companies, isLoading } = useCompanies();
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

  const { data: companyUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ["/api/users/company", selectedCompanyId],
    queryFn: async () => {
      const res = await fetch(`/api/users/company/${selectedCompanyId}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json() as Promise<{ id: string; firstName: string; lastName: string; role: string }[]>;
    },
    enabled: selectedCompanyId !== null,
  });

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Companies" 
        description="Manage partner installers and roofing contractors."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
        <div className="md:col-span-2 space-y-6">
          <h3 className="text-lg font-semibold px-1">Registered Companies</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isLoading ? (
              [1, 2, 3, 4].map((i) => (
                <Card key={i} className="h-32">
                  <CardHeader>
                    <Skeleton className="h-6 w-2/3" />
                  </CardHeader>
                </Card>
              ))
            ) : (
              companies?.map((company) => (
                <Card 
                  key={company.id} 
                  className={`cursor-pointer transition-all hover:border-primary/50 ${selectedCompanyId === company.id ? 'border-primary ring-1 ring-primary bg-primary/5' : ''}`}
                  onClick={() => setSelectedCompanyId(company.id)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Building2 className="h-4 w-4 text-primary" />
                      {company.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                      {company.type}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="md:col-span-1 lg:col-span-2 space-y-6">
          <h3 className="text-lg font-semibold px-1">Company Staff</h3>
          <Card className="h-full min-h-[400px]">
            <CardContent className="p-6">
              {!selectedCompanyId ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-20 italic">
                  Select a company to view staff
                </div>
              ) : loadingUsers ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : companyUsers?.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  No users registered for this company.
                </div>
              ) : (
                <div className="space-y-4">
                  {companyUsers?.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

