import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEnergyReport } from "@/hooks/use-data";
import { Activity, Zap, Calendar, TrendingUp, BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

interface EnergyReportCardProps {
  projectId: number;
}

function formatEnergy(wh: number): string {
  if (wh >= 1000000) {
    return `${(wh / 1000000).toFixed(2)} MWh`;
  } else if (wh >= 1000) {
    return `${(wh / 1000).toFixed(2)} kWh`;
  } else {
    return `${wh.toFixed(0)} Wh`;
  }
}

function formatPower(w: number): string {
  if (w >= 1000) {
    return `${(w / 1000).toFixed(2)} kW`;
  } else {
    return `${w.toFixed(0)} W`;
  }
}

export function EnergyReportCard({ projectId }: EnergyReportCardProps) {
  const queryClient = useQueryClient();
  const { data: report, isLoading, error } = useEnergyReport(projectId);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: [api.energyReport.get.path, projectId] });
  };

  if (error || !report) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Energy Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      label: "Current Power",
      value: formatPower(report.currentPower),
      icon: Zap,
      iconColor: "text-yellow-600",
    },
    {
      label: "Today",
      value: formatEnergy(report.todayEnergy),
      icon: Calendar,
      iconColor: "text-blue-600",
    },
    {
      label: "Last 7 Days",
      value: formatEnergy(report.last7DaysEnergy),
      icon: BarChart3,
      iconColor: "text-green-600",
    },
    {
      label: "Month to Date",
      value: formatEnergy(report.monthToDateEnergy),
      icon: TrendingUp,
      iconColor: "text-purple-600",
    },
    {
      label: "Lifetime",
      value: formatEnergy(report.lifetimeEnergy),
      icon: Activity,
      iconColor: "text-orange-600",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Energy Report
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                  <span className="text-sm text-gray-600">{stat.label}</span>
                </div>
                <span className="text-lg font-semibold">{stat.value}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
