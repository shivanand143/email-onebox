import { useQuery } from "@tanstack/react-query";

import { api, EmailRecord } from "@/lib/api";
import { useFilterStore } from "@/stores/filterStore";

export const useEmails = () => {
  const { accountId, folder, query, categories } = useFilterStore();

  const emailsQuery = useQuery({
    queryKey: ["emails", { accountId, folder, query, categories }],
    queryFn: async () => {
      const response = await api.fetchEmails({ accountId, folder, query, categories });
      return response;
    },
    refetchInterval: 15_000
  });

  return emailsQuery;
};

export const useEmail = (id?: string) => {
  return useQuery<EmailRecord | null>({
    queryKey: ["email", id],
    queryFn: async () => {
      if (!id) return null;
      return api.getEmail(id);
    },
    enabled: Boolean(id)
  });
};

