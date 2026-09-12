import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { createMessages, getMessages, sendMessage } from "../actions";
import type { CreateProjectPayload, SendMessagePayload } from "@/modules/types";

export const prefetchMessages = async (queryClient: QueryClient, projectId: string) => {
  await queryClient.prefetchQuery({
    queryKey: ["messages", projectId],
    queryFn: () => getMessages(projectId),
    staleTime: 10000,
  });
};

export const useGetMessages = (projectId: string) => {
  return useQuery({
    queryKey: ["messages", projectId],
    queryFn: () => getMessages(projectId),
    staleTime: 10000,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.length ? 5000 : false;
    },
  });
};

export const useCreateMessages = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProjectPayload) =>
      createMessages({ ...payload, projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", projectId]
      });
      queryClient.invalidateQueries({
        queryKey: ["status"],
      });
    },
  });
};

export const useSendMessage = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<SendMessagePayload, "projectId">) =>
      sendMessage({
        ...payload,
        projectId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", projectId]
      });
      queryClient.invalidateQueries({
        queryKey: ["status"],
      });
    },
  });
};