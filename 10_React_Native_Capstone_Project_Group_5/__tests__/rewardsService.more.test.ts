import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadRewards, msUntilNextMidnight, saveRewards } from '@/services/rewardsService';

describe('rewardsService more', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('computes ms until next midnight', () => {
    const now = new Date(2026, 10, 26, 23, 59, 0, 0).getTime();
    expect(msUntilNextMidnight(now)).toBe(60 * 1000);
  });

  it('loads and saves rewards', async () => {
    const data = { points: 5, coupons: [], lastSpinAt: null, quiz: null, deal: null };
    await saveRewards(1, data);
    await expect(loadRewards(1)).resolves.toEqual(data);
  });

  it('returns empty rewards for invalid stored data', async () => {
    await AsyncStorage.setItem('play_earn_2', '{bad json');
    await expect(loadRewards(2)).resolves.toEqual({ points: 0, coupons: [], lastSpinAt: null, quiz: null, deal: null });
  });
});
