import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: LucideIcon;
  color?: "primary" | "success" | "warning" | "error";
  loading?: boolean;
}

const colorVariants = {
  primary: "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20",
  success: "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200",
  warning: "bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200",
  error: "bg-gradient-to-br from-red-50 to-red-100/50 border-red-200"
};

const iconColorVariants = {
  primary: "text-primary bg-primary/10",
  success: "text-emerald-600 bg-emerald-100",
  warning: "text-amber-600 bg-amber-100",
  error: "text-red-600 bg-red-100"
};

export function MetricCard({
  title,
  value,
  trend,
  icon: Icon,
  color = "primary",
  loading = false
}: MetricCardProps) {
  const isPositiveTrend = trend && trend > 0;
  const isNegativeTrend = trend && trend < 0;

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-8 w-8 bg-gray-200 rounded-xl" />
            </div>
            <div className="h-8 w-24 bg-gray-200 rounded" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-border/50 hover:shadow-lg transition-all duration-200", colorVariants[color])}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            
            {trend !== undefined && (
              <div className="flex items-center gap-1">
                {isPositiveTrend ? (
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                ) : isNegativeTrend ? (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                ) : null}
                <span
                  className={cn(
                    "text-xs font-medium",
                    isPositiveTrend && "text-emerald-600",
                    isNegativeTrend && "text-red-600",
                    !isPositiveTrend && !isNegativeTrend && "text-gray-500"
                  )}
                >
                  {trend > 0 ? "+" : ""}{trend}%
                </span>
              </div>
            )}
          </div>
          
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", iconColorVariants[color])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}