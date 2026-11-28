import { renderHook } from '@testing-library/react-native';
import { useAnimatedCard } from '@/hooks/useAnimatedCard';

describe('useAnimatedCard', () => {
  it('returns animated styles and handlers', () => {
    const { result } = renderHook(() => useAnimatedCard({ index: 0, float: false }));
    expect(result.current.entranceStyle).toBeDefined();
    expect(result.current.floatStyle).toBeDefined();
    expect(result.current.hoverStyle).toBeDefined();
    expect(typeof result.current.handlers.onHoverIn).toBe('function');
    expect(typeof result.current.handlers.onPressIn).toBe('function');
    expect(result.current.active).toBe(false);
  });
});
