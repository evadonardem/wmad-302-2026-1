/**
 * Shopping Personality Quiz - questions, personalities and the scoring algorithm.
 * Each answer maps to one personality; the most-picked personality wins.
 */
import type { ComponentProps } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { MaterialCommunityIcons } from '@expo/vector-icons';
import { PersonalityKey } from '@/types/rewards';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface QuizOption {
    key: 'A' | 'B' | 'C' | 'D';
    label: string;
    personality: PersonalityKey;
}

export interface QuizQuestion {
    id: number;
    prompt: string;
    options: QuizOption[];
}

export interface Personality {
    key: PersonalityKey;
    title: string;
    tagline: string;
    description: string;
    icon: IconName;
    accent: string;
    soft: string;
    /** Cute character illustration shown on the result card */
    character: ImageSourcePropType;
    /** DummyJSON category slugs used for the recommendations */
    categories: string[];
    tags: string[];
}

export const QUESTIONS: QuizQuestion[] = [
    {
        id: 1,
        prompt: "What's your shopping priority?",
        options: [
            { key: 'A', label: 'Getting the best deals.', personality: 'budget' },
            { key: 'B', label: 'Finding fashionable items.', personality: 'fashion' },
            { key: 'C', label: 'Buying the latest technology.', personality: 'tech' },
            { key: 'D', label: 'Finding cute and aesthetic products.', personality: 'aesthetic' },
        ],
    },
    {
        id: 2,
        prompt: "What's your ideal shopping budget?",
        options: [
            { key: 'A', label: 'Under ₱500.', personality: 'budget' },
            { key: 'B', label: '₱500–₱1,500.', personality: 'fashion' },
            { key: 'C', label: '₱1,500–₱5,000.', personality: 'tech' },
            { key: 'D', label: '₱5,000 and above.', personality: 'aesthetic' },
        ],
    },
    {
        id: 3,
        prompt: 'Your dream weekend browse looks like…',
        options: [
            { key: 'A', label: 'Hunting flash sales and coupon stacks.', personality: 'budget' },
            { key: 'B', label: 'Scrolling a new-arrivals lookbook.', personality: 'fashion' },
            { key: 'C', label: 'Watching gadget reviews and spec sheets.', personality: 'tech' },
            { key: 'D', label: 'Saving home décor and aesthetic finds.', personality: 'aesthetic' },
        ],
    },
    {
        id: 4,
        prompt: 'When you spot a sale, you…',
        options: [
            { key: 'A', label: 'Compare prices across stores first.', personality: 'budget' },
            { key: 'B', label: 'Check if the piece is trending.', personality: 'fashion' },
            { key: 'C', label: 'Read the specs before deciding.', personality: 'tech' },
            { key: 'D', label: 'Save it because it just looks beautiful.', personality: 'aesthetic' },
        ],
    },
    {
        id: 5,
        prompt: 'Pick a vibe for your next purchase.',
        options: [
            { key: 'A', label: 'Practical, useful and affordable.', personality: 'budget' },
            { key: 'B', label: 'Bold, trendy and statement-making.', personality: 'fashion' },
            { key: 'C', label: 'Smart, fast and cutting-edge.', personality: 'tech' },
            { key: 'D', label: 'Soft, unique and beautifully made.', personality: 'aesthetic' },
        ],
    },
];

export const PERSONALITIES: Record<PersonalityKey, Personality> = {
    budget: {
        key: 'budget',
        title: 'The Budget Hunter',
        tagline: 'Always looking for the biggest discounts.',
        description:
            'You know the value of every peso. You compare, stack coupons and never pay full price when a better deal is one tap away.',
        icon: 'tag-outline',
        accent: '#C98A1B',
        soft: 'rgba(242,196,90,0.24)',
        character: require('../../assets/images/quiz/budget-hunter.png'),
        categories: ['groceries', 'kitchen-accessories', 'mens-shirts'],
        tags: ['Deals', 'Value picks', 'Smart savings'],
    },
    fashion: {
        key: 'fashion',
        title: 'The Fashionista',
        tagline: 'Loves trendy and stylish products.',
        description:
            'You shop for the look, the fit and the moment. New arrivals and statement pieces are your happy place.',
        icon: 'hanger',
        accent: '#B0477A',
        soft: 'rgba(176,71,122,0.18)',
        character: require('../../assets/images/quiz/fashionista.png'),
        categories: ['womens-dresses', 'womens-shoes', 'womens-bags', 'womens-jewellery'],
        tags: ['New arrivals', 'Trending', 'Style'],
    },
    tech: {
        key: 'tech',
        title: 'The Tech Enthusiast',
        tagline: 'Always interested in the latest gadgets.',
        description:
            'Specs, speed and the newest release — you love a product that does more. You research first, then upgrade.',
        icon: 'laptop',
        accent: '#3F6FD8',
        soft: 'rgba(63,111,216,0.18)',
        character: require('../../assets/images/quiz/tech-enthusiast.png'),
        categories: ['laptops', 'smartphones', 'tablets', 'mobile-accessories'],
        tags: ['Gadgets', 'Upgrades', 'Innovation'],
    },
    aesthetic: {
        key: 'aesthetic',
        title: 'The Aesthetic Shopper',
        tagline: 'Loves beautiful and unique finds.',
        description:
            'You buy with your eyes and your heart. Soft colours, lovely details and pieces that make a space feel like you.',
        icon: 'flower-tulip-outline',
        accent: '#8B5FD0',
        soft: 'rgba(139,95,208,0.2)',
        character: require('../../assets/images/quiz/aesthetic-shopper.png'),
        categories: ['home-decoration', 'fragrances', 'skin-care', 'womens-jewellery'],
        tags: ['Beautiful finds', 'Home décor', 'Self-care'],
    },
};

const ORDER: PersonalityKey[] = ['budget', 'fashion', 'tech', 'aesthetic'];

export function scoreAnswers(answers: PersonalityKey[]): PersonalityKey {
    const tally: Record<PersonalityKey, number> = { budget: 0, fashion: 0, tech: 0, aesthetic: 0 };
    answers.forEach((answer) => {
        tally[answer] += 1;
    });
    return ORDER.reduce((best, key) => (tally[key] > tally[best] ? key : best), ORDER[0]);
}
