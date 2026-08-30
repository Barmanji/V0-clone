import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createProject, getProjectById, getProjects } from "../actions";

export const useGetProjects = () => {
    return useQuery({
        queryKey: ["projects"],
        queryFn: () => getProjects()
    });
};

export const useCreateProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (value: any) => createProject(value), // Consider replacing 'any' with your actual payload type
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["status"] });
        }
    });
};

// Fix: Explicitly typed projectId as a string
export const useGetProjectById = (projectId: string) => {
    return useQuery({
        queryKey: ["project", projectId],
        queryFn: () => getProjectById(projectId),
        enabled: !!projectId // Good practice: Prevents fetching if projectId is undefined/empty
    });
};
