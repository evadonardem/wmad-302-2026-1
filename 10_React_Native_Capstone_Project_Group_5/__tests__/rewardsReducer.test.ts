import { rewardsReducer } from '@/context/RewardsContext';
import { RewardState } from '@/types/rewards';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const baseState: RewardState = {
  points: 10,
  coupons: [
    {
      id: 'c1',
      title: '10% OFF',
      subtitle: 'Earned from Spin & Win',
      kind: 'discount',
      value: 10,
      code: 'SPIN10-ABCD',
      source: 'spin',
      earnedAt: '2026-11-26T00:00:00.000Z',
    },
  ],
  lastSpinAt: null,
  quiz: null,
  deal: null,
  hydrated: true,
};

describe('rewardsReducer', () => {
  it('adds points', () => {
    const next = rewardsReducer(baseState, { type: 'ADD_POINTS', payload: 5 });
    expect(next.points).toBe(15);
  });

  it('records a spin and stores coupon', () => {
    const next = rewardsReducer(baseState, {
      type: 'RECORD_SPIN',
      payload: {
        at: '2026-11-26T01:00:00.000Z',
        points: 20,
        coupon: {
          id: 'c2',
          title: 'Free Shipping',
          subtitle: 'Earned from Spin & Win',
          kind: 'shipping',
          value: 0,
          code: 'SHIP-XYZ1',
          source: 'spin',
          earnedAt: '2026-11-26T01:00:00.000Z',
        },
      },
    });
    expect(next.points).toBe(30);
    expect(next.lastSpinAt).toBe('2026-11-26T01:00:00.000Z');
    expect(next.coupons[0].id).toBe('c2');
  });

  it('redeems a coupon by removing it from balance', () => {
    const next = rewardsReducer(baseState, { type: 'REDEEM_COUPON', payload: 'c1' });
    expect(next.coupons).toHaveLength(0);
    expect(next.points).toBe(10);
  });

  it('redeems points without going below zero', () => {
    const next = rewardsReducer(baseState, { type: 'REDEEM_POINTS', payload: 4 });
    expect(next.points).toBe(6);
    const clamped = rewardsReducer(baseState, { type: 'REDEEM_POINTS', payload: 999 });
    expect(clamped.points).toBe(0);
  });

  it('hydrates stored rewards', () => {
    const next = rewardsReducer(
      { ...baseState, hydrated: false },
      { type: 'HYDRATE', payload: { points: 3, coupons: [], lastSpinAt: null, quiz: null, deal: null } }
    );
    expect(next.hydrated).toBe(true);
    expect(next.points).toBe(3);
  });
});
