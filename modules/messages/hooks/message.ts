import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createMessages, getMessages } from "../actions";

export const prefetchMessages = async (queryClient: any, projectId: string) => {
  await queryClient.prefetchQuery({ // prefetching every 10 sec
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
    mutationFn: (value: string) => createMessages(value, projectId),
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
