import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DesignReferencesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="mt-2 h-5 w-64" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-40" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-32" />
            </div>

            <div className="rounded-md border">
              <div className="border-b p-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border-b p-4 last:border-0">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-10 w-10 rounded" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-48" />
              <div className="flex space-x-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-16" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
