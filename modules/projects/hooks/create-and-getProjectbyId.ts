import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createProject, getProjectById, getProjects, triggerCodeAgent, applyEnhancedPrompt } from "../actions";
import type { AgentTriggerPayload, CreateProjectPayload } from "@/modules/types";

export const useGetProjects = () => {
    return useQuery({
        queryKey: ["projects"],
        queryFn: () => getProjects()
    });
};

export const useCreateProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateProjectPayload) => createProject(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["status"] });
        }
    });
};

export const useTriggerCodeAgent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: AgentTriggerPayload) =>
            triggerCodeAgent(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["messages"] });
        }
    });
};

export const useApplyEnhancedPrompt = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: AgentTriggerPayload) =>
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