"use client"

import { useGetProjects } from "@/modules/projects/hooks/create-and-getProjectbyId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { FolderKanban, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

const ProjectList = () => {
  const { data: projects, isPending } = useGetProjects();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isPending) {
    return (
      <div className="w-full mt-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Your Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return null;
  }

  // Card classes separated for cleaner code
  const cardStyles =
    "group transition-all duration-300 cursor-pointer bg-card dark:bg-zinc-900/30 backdrop-blur-sm overflow-hidden " +
    // Light mode border & shadow
    "border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-500/50 " +
    // Dark mode overrides
    "dark:border-zinc-800/50 dark:shadow-none dark:hover:border-emerald-500/50";

  return (
    <div className="w-full mt-16">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-foreground">
        Your Projects
      </h2>

      {/* Desktop Grid View */}
      <div className="hidden lg:grid grid-cols-3 gap-4 max-w-6xl mx-auto">
        {projects.map((project) => (
          <Link href={`/projects/${project.id}`} key={project.id} className="block">
            <Card className={cardStyles}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                    <FolderKanban className="w-5 h-5 text-emerald-500" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </div>
                <CardTitle className="text-lg text-card-foreground group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                  {project.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 mr-2" />
                  <span>{formatDate(project.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Mobile/Tablet Carousel View */}
      <div className="lg:hidden max-w-4xl mx-auto px-4">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {projects.map((project) => (
              <CarouselItem key={project.id} className="pl-4 md:basis-1/2">
                <Link href={`/projects/${project.id}`} className="block">
                  <Card className={cardStyles}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2.5 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                          <FolderKanban className="w-5 h-5 text-emerald-500" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                      </div>
                      <CardTitle className="text-lg text-card-foreground group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {project.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5 mr-2" />
                        <span>{formatDate(project.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </div>
  );
};

export default ProjectList;
