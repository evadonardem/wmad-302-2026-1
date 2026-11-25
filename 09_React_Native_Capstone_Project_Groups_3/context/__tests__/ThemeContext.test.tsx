/**
 * Tests for light / dark mode: the choice is applied and remembered.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppThemeProvider, useThemePreference } from '../ThemeContext';
import { darkTheme, lightTheme } from '@/constants/theme';

const renderTheme = () => renderHook(() => useThemePreference(), { wrapper: AppThemeProvider });

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('AppThemeProvider', () => {
  it('follows the phone setting by default', () => {
    const { result } = renderTheme();
    expect(result.current.preference).toBe('system');
    expect(result.current.theme).toBe(result.current.isDark ? darkTheme : lightTheme);
  });

  it('switches to dark and light and saves the choice', async () => {
    const { result } = renderTheme();

    act(() => result.current.setPreference('dark'));
    expect(result.current.isDark).toBe(true);
    expect(result.current.theme).toBe(darkTheme);
    await waitFor(async () =>
      expect(JSON.parse((await AsyncStorage.getItem('theme_preference')) ?? 'null')).toBe('dark')
    );

    act(() => result.current.setPreference('light'));
    expect(result.current.isDark).toBe(false);
    expect(result.current.theme).toBe(lightTheme);
  });

  it('restores the saved choice on app start', async () => {
    await AsyncStorage.setItem('theme_preference', JSON.stringify('dark'));
    const { result } = renderTheme();
    await waitFor(() => expect(result.current.preference).toBe('dark'));
    expect(result.current.isDark).toBe(true);
  });

  it('ignores invalid saved values', async () => {
    await AsyncStorage.setItem('theme_preference', JSON.stringify('purple'));
    const { result } = renderTheme();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(result.current.preference).toBe('system');
  });
});

describe('useThemePreference', () => {
  it('throws when used outside AppThemeProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useThemePreference())).toThrow(
      'useThemePreference must be used within an AppThemeProvider'
    );
    spy.mockRestore();
  });
});
