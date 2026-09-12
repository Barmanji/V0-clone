import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createProject, getProjectById, getProjects, triggerCodeAgent, applyEnhancedPrompt } from "../actions";

export const useGetProjects = () => {
    return useQuery({
        queryKey: ["projects"],
        queryFn: () => getProjects()
    });
};

export const useCreateProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: { value: string; modelConfig?: any }) => createProject(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["status"] });
        }
    });
};

export const useTriggerCodeAgent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: { projectId: string; value: string; modelConfig?: any }) =>
            triggerCodeAgent(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["messages"] });
        }
    });
};

export const useApplyEnhancedPrompt = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: { projectId: string; value: string; modelConfig?: any }) =>
        applyEnhancedPrompt(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["messages"] });
        }
    });
};

export const useGetProjectById = (projectId: string) => {
    return useQuery({
        queryKey: ["project", projectId],
        queryFn: () => getProjectById(projectId),
        enabled: !!projectId
    });
};
