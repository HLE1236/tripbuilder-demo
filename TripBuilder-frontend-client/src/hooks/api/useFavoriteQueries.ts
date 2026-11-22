import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getFavoritesApi, removeFavoriteApi, saveFavoriteApi } from '../../api/favorite';

export const favoriteKeys = {
  all: ['favorites'] as const,
  list: () => [...favoriteKeys.all, 'list'] as const,
};

export function useFavoritesQuery(enabled = true) {
  return useQuery({
    queryKey: favoriteKeys.list(),
    queryFn: getFavoritesApi,
    enabled,
  });
}

export function useToggleFavoriteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tourId,
      isCurrentlySaved,
    }: {
      tourId: number;
      isCurrentlySaved: boolean;
    }) => (isCurrentlySaved ? removeFavoriteApi(tourId) : saveFavoriteApi(tourId)),
    onSuccess: (nextIds) => {
      queryClient.setQueryData(favoriteKeys.list(), nextIds);
      queryClient.invalidateQueries({ queryKey: favoriteKeys.list() });
    },
  });
}
