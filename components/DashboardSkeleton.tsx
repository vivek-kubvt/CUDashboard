import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="skeleton h-3 w-24" />
            </CardHeader>
            <CardContent>
              <div className="skeleton mb-2 h-8 w-32" />
              <div className="skeleton h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="skeleton h-3 w-32" />
            </CardHeader>
            <CardContent>
              <div className="skeleton h-3 w-full" />
              <div className="skeleton mt-3 h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="skeleton h-3 w-40" />
          </CardHeader>
          <CardContent>
            <div className="skeleton h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="skeleton h-3 w-40" />
          </CardHeader>
          <CardContent>
            <div className="skeleton h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
