import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createMessages, getMessages, sendMessage } from "../actions";

export const prefetchMessages = async (queryClient: any, projectId: string) => {
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
    refetchInterval: (data: any) => {
      return data?.length ? 5000 : false;
    },
  });
};

export const useCreateMessages = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { value: string; modelConfig?: any }) =>
      createMessages({ ...payload, projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", projectId]
      });
      queryClient.invalidateQueries(
        {
          queryKey: ["status"],
        }
      )
    },
  });
};

export const useSendMessage = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      value: string;
      modelConfig?: any;
      triggerAgent?: boolean;
    }) =>
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
