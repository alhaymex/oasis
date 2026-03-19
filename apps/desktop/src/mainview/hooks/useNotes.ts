import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/rpcClient";

function getNotesQueryKey(bookId?: string) {
  return ["notes", bookId ?? "all"];
}

export function useNotes(bookId?: string) {
  return useQuery({
    queryKey: getNotesQueryKey(bookId),
    queryFn: async () => (await api.getNotes(bookId)) ?? [],
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useNoteMutations(bookId?: string) {
  const queryClient = useQueryClient();

  const invalidateNotes = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["notes"] }),
      queryClient.invalidateQueries({ queryKey: getNotesQueryKey(bookId) }),
    ]);
  };

  const createNote = useMutation({
    mutationFn: async (input: {
      bookId?: string | null;
      sourceUrl?: string | null;
      sourceTitle?: string | null;
      selectedText?: string | null;
      body: string;
    }) => {
      const response = await api.createNote(input);
      if (!response) {
        throw new Error("Note service is unavailable.");
      }
      return response;
    },
    onSuccess: invalidateNotes,
  });

  const updateNote = useMutation({
    mutationFn: async (input: {
      id: string;
      sourceUrl?: string | null;
      sourceTitle?: string | null;
      selectedText?: string | null;
      body: string;
    }) => {
      const response = await api.updateNote(input);
      if (!response) {
        throw new Error("Note service is unavailable.");
      }
      return response;
    },
    onSuccess: invalidateNotes,
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.deleteNote(id);
      if (!response) {
        throw new Error("Note service is unavailable.");
      }
      return response;
    },
    onSuccess: invalidateNotes,
  });

  return {
    createNote,
    updateNote,
    deleteNote,
  };
}
