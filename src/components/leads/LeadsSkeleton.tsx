import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Skeleton para la vista de insights/resumen
export function InsightsSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Overview Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-20" />
                  <div className="text-right space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-8 w-2" />
                  <Skeleton className="h-4 w-8" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Source Distribution Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-20 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Skeleton para la vista Kanban
export function KanbanSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6 gap-x-5 gap-y-5 px-1 pb-4">
      {Array.from({ length: 6 }).map((_, stageIndex) => (
        <div key={stageIndex} className="flex-shrink-0 w-full">
          <Card className="min-h-[300px] max-h-[80vh] flex flex-col">
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <Skeleton className="h-2.5 w-2.5 rounded-full mr-2.5" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-6 w-16" />
            </CardHeader>
            <CardContent className="space-y-3 flex-1 p-3 pt-3">
              {Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map((_, cardIndex) => (
                <Card key={cardIndex} className="bg-muted">
                  <CardHeader className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-7 w-24" />
                      <Skeleton className="h-7 w-7" />
                    </div>
                    <div className="flex items-start justify-between space-x-2">
                      <div className="flex-grow space-y-2 min-w-0">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-28" />
                        <div className="flex gap-1">
                          <Skeleton className="h-4 w-12 rounded-full" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-1">
                    <div className="flex items-center justify-start space-x-1 mb-2.5">
                      {Array.from({ length: 3 }).map((_, iconIndex) => (
                        <Skeleton key={iconIndex} className="h-6 w-6 rounded-full" />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {Array.from({ length: 2 }).map((_, btnIndex) => (
                        <Skeleton key={btnIndex} className="h-6 w-16" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}

// Skeleton para la vista de tabla
export function TableSkeleton() {
  return (
    <div className="p-0">
      <Card className="border-border/30 bg-card text-card-foreground rounded-[var(--radius)] overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b-border/20">
                  <th className="text-left p-4">
                    <Skeleton className="h-4 w-12" />
                  </th>
                  <th className="text-left p-4">
                    <Skeleton className="h-4 w-16" />
                  </th>
                  <th className="text-left p-4 hidden md:table-cell">
                    <Skeleton className="h-4 w-20" />
                  </th>
                  <th className="text-left p-4">
                    <Skeleton className="h-4 w-12" />
                  </th>
                  <th className="text-left p-4">
                    <Skeleton className="h-4 w-12" />
                  </th>
                  <th className="text-left p-4 hidden sm:table-cell">
                    <Skeleton className="h-4 w-20" />
                  </th>
                  <th className="text-left p-4">
                    <Skeleton className="h-4 w-16" />
                  </th>
                  <th className="text-left p-4">
                    <Skeleton className="h-4 w-20" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b-border/20">
                    <td className="p-4">
                      <Skeleton className="h-9 w-9 rounded-full" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <Skeleton className="h-4 w-40" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-6 w-20 rounded-md" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: 3 }).map((_, iconIndex) => (
                          <Skeleton key={iconIndex} className="h-7 w-7 rounded" />
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <Skeleton className="h-8 w-32" />
                        <div className="flex gap-1">
                          <Skeleton className="h-6 w-12" />
                          <Skeleton className="h-6 w-12" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Skeleton para stats y filtros
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <Skeleton className="h-6 w-12 mb-2" />
            <Skeleton className="h-4 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function FiltersSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-20" />
    </div>
  );
}