import ProjectView from "@/modules/projects/components/project-view";
import React, { Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const Page = async ({ params }: { params: Promise<{ projectId: string }> }) => {
  const { projectId } = await params;

  return (
    <Suspense fallback={<SkeletonCard />}>
      <ProjectView projectId={projectId} />
    </Suspense>
  );
};

function SkeletonCard() {
  return (
    <Card className="w-full max-w-xs">
      <CardHeader>
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="aspect-video w-full" />
      </CardContent>
    </Card>
  );
}

export default Page;
