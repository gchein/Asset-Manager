import { PageHeader } from "@/components/layout/Shell";
import { useCompanies } from "@/hooks/use-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CompaniesList() {
  const { data: companies, isLoading } = useCompanies();

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Companies" 
        description="Manage partner installers and roofing contractors."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <Card key={i} className="h-32">
              <CardHeader>
                <Skeleton className="h-6 w-2/3" />
              </CardHeader>
            </Card>
          ))
        ) : (
          companies?.map((company) => (
            <Card key={company.id} className="hover-elevate">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {company.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground capitalize">
                  Type: {company.type}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
