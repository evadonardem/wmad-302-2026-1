/**
 * Spin & Win - wheel segments and weighted random prize selection.
 */
import { makeCoupon } from '@/services/rewardsService';
import { SpinOutcome, SpinSegment } from '@/types/rewards';

export const WHEEL_SEGMENTS: SpinSegment[] = [
    { label: '5% OFF', kind: 'discount', value: 5, weight: 22, color: '#CDB8F5', textColor: '#3A1E70' },
    { label: '50 PTS', kind: 'points', value: 50, weight: 18, color: '#F2C45A', textColor: '#3A1E70' },
    { label: '10% OFF', kind: 'discount', value: 10, weight: 18, color: '#E5D9F7', textColor: '#3A1E70' },
    { label: 'Free Ship', kind: 'shipping', value: 0, weight: 14, color: '#CFEBDD', textColor: '#24503B' },
    { label: '15% OFF', kind: 'discount', value: 15, weight: 10, color: '#F2C45A', textColor: '#3A1E70' },
    { label: 'Try Again', kind: 'none', value: 0, weight: 18, color: '#B5A7CE', textColor: '#FBF7FF' },
];

export function pickSpinOutcome(): SpinOutcome {
    const totalWeight = WHEEL_SEGMENTS.reduce((sum, segment) => sum + segment.weight, 0);
    let roll = Math.random() * totalWeight;
    let index = 0;

    for (let i = 0; i < WHEEL_SEGMENTS.length; i += 1) {
        roll -= WHEEL_SEGMENTS[i].weight;
        if (roll <= 0) {
            index = i;
            break;
        }
    }

    const segment = WHEEL_SEGMENTS[index];

    if (segment.kind === 'discount') {
        return {
            index,
            segment,
            points: 0,
            coupon: makeCoupon(`${segment.value}% OFF`, 'discount', segment.value, 'spin', `SPIN${segment.value}`),
        };
    }

    if (segment.kind === 'shipping') {
        return {
            index,
            segment,
            points: 0,
            coupon: makeCoupon('Free Shipping', 'shipping', 0, 'spin', 'SHIP'),
        };
    }

    if (segment.kind === 'points') {
        return { index, segment, points: segment.value, coupon: null };
    }

    return { index, segment, points: 0, coupon: null };
}
