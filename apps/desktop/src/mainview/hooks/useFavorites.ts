import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/rpcClient";

const FAVORITES_QUERY_KEY = ["favorites"];

export function useFavorites() {
  return useQuery({
    queryKey: FAVORITES_QUERY_KEY,
    queryFn: async () => (await api.getFavorites()) ?? [],
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useFavoriteMutations() {
  const queryClient = useQueryClient();

  const addFavorite = useMutation({
    mutationFn: async (bookId: string) => {
      const response = await api.addFavorite(bookId);
      if (!response) {
        throw new Error("Favorite service is unavailable.");
      }
      return response;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ["local-library"] }),
      ]);
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async (bookId: string) => {
      const response = await api.removeFavorite(bookId);
      if (!response) {
        throw new Error("Favorite service is unavailable.");
      }
      return response;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ["local-library"] }),
      ]);
    },
  });

  return {
    addFavorite,
    removeFavorite,
  };
}
