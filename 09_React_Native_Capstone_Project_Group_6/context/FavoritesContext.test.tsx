import React, { useState } from 'react';
import { Text } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { FavoritesProvider, useFavorites } from './FavoritesContext';
import { favoritesStorage } from '@/utils/storage';

jest.mock('@/utils/storage', () => ({
  favoritesStorage: {
    getIds: jest.fn(),
    setIds: jest.fn(),
  },
}));

function FavoritesProbe() {
  const { favoriteIds, isLoading, error, toggleFavorite } = useFavorites();
  const [toggleError, setToggleError] = useState('');
  return (
    <>
      <Text testID="ids">{favoriteIds.join(',')}</Text>
      <Text testID="loading">{String(isLoading)}</Text>
      <Text testID="error">{error ?? toggleError}</Text>
      <Text
        testID="toggle"
        onPress={() => {
          void toggleFavorite(7).catch((saveError: unknown) => {
            setToggleError(saveError instanceof Error ? saveError.message : 'Save failed');
          });
        }}
      >
        Toggle
      </Text>
    </>
  );
}

function renderFavorites() {
  return render(
    <FavoritesProvider>
      <FavoritesProbe />
    </FavoritesProvider>
  );
}

describe('FavoritesProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hydrates favorite IDs from storage', async () => {
    jest.mocked(favoritesStorage.getIds).mockResolvedValue([2, 4]);
    const screen = renderFavorites();
    await waitFor(() => expect(screen.getByTestId('ids').props.children).toBe('2,4'));
    expect(screen.getByTestId('loading').props.children).toBe('false');
  });

  it('persists toggled favorites and rolls back if saving fails', async () => {
    jest.mocked(favoritesStorage.getIds).mockResolvedValue([2]);
    jest.mocked(favoritesStorage.setIds).mockRejectedValueOnce(new Error('Storage unavailable'));
    const screen = renderFavorites();
    await waitFor(() => expect(screen.getByTestId('ids').props.children).toBe('2'));

    fireEvent.press(screen.getByTestId('toggle'));

    await waitFor(() => expect(screen.getByTestId('error').props.children).toBe('Storage unavailable'));
    expect(screen.getByTestId('ids').props.children).toBe('2');
  });

  it('reports an error when favorite storage cannot be read', async () => {
    jest.mocked(favoritesStorage.getIds).mockRejectedValue(new Error('Read failed'));
    const screen = renderFavorites();

    await waitFor(() => expect(screen.getByTestId('error').props.children).toBe('Read failed'));
    expect(screen.getByTestId('loading').props.children).toBe('false');
  });
});
