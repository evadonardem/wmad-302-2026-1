/**
 * Play & Earn - the Shopping Personality result card with recommended products.
 * Each personality gets a distinct visual design and a cute character illustration.
 */
import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette } from '@/constants/theme';
import { Product } from '@/types/product';
import { Personality } from './quizData';
import { playStyles as styles } from './playEarnStyles';

interface PersonalityResultProps {
    personality: Personality;
    products: Product[];
    loading: boolean;
    earnedPoints: number;
    onShare: () => void;
    onRetake: () => void;
    onOpenProduct: (id: number) => void;
    onViewRewards: () => void;
}

function ResultActions({
    onShare,
    onRetake,
    onViewRewards,
}: Pick<PersonalityResultProps, 'onShare' | 'onRetake' | 'onViewRewards'>) {
    return (
        <View style={styles.quizActions}>
            <Pressable style={styles.primaryBtn} onPress={onViewRewards} accessibilityRole="button">
                <MaterialCommunityIcons name="gift-outline" size={18} color="#FBF7FF" />
                <Text style={styles.primaryBtnText}>My Rewards</Text>
            </Pressable>
            <Pressable style={styles.ghostBtn} onPress={onShare} accessibilityRole="button">
                <MaterialCommunityIcons name="share-variant-outline" size={18} color={palette.forest} />
                <Text style={styles.ghostBtnText}>Share result</Text>
            </Pressable>
            <Pressable style={styles.ghostBtn} onPress={onRetake} accessibilityRole="button">
                <MaterialCommunityIcons name="refresh" size={18} color={palette.forest} />
                <Text style={styles.ghostBtnText}>Retake quiz</Text>
            </Pressable>
        </View>
    );
}

function Recommendations({
    products,
    loading,
    onOpenProduct,
    accent,
}: Pick<PersonalityResultProps, 'products' | 'loading' | 'onOpenProduct'> & { accent: string }) {
    return (
        <View style={styles.section}>
            <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Picked for you</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color={accent} />
            </View>
            <Text style={styles.sectionSub}>Products that match your personality.</Text>

            {loading ? (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={accent} />
                </View>
            ) : products.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No recommendations right now. Try again later.</Text>
                </View>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productRow}>
                    {products.map((product) => (
                        <Pressable
                            key={product.id}
                            style={styles.productCard}
                            onPress={() => onOpenProduct(product.id)}
                            accessibilityRole="button"
                            accessibilityLabel={`Open ${product.title}`}
                        >
                            <View style={styles.productImageWrap}>
                                <Image source={{ uri: product.thumbnail }} style={styles.productImage} resizeMode="contain" />
                            </View>
                            <View style={styles.productInfo}>
                                <Text style={styles.productTitle} numberOfLines={2}>
                                    {product.title}
                                </Text>
                                <View style={styles.productPriceRow}>
                                    <Text style={[styles.productPrice, { color: accent }]}>₱{product.price.toFixed(2)}</Text>
                                    {product.discountPercentage > 0 ? (
                                        <Text style={styles.productDiscount}>-{Math.round(product.discountPercentage)}%</Text>
                                    ) : null}
                                </View>
                            </View>
                        </Pressable>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

function EarnedPoints({ earnedPoints, color }: { earnedPoints: number; color: string }) {
    if (earnedPoints <= 0) return null;
    return (
        <View style={styles.resultPoints}>
            <MaterialCommunityIcons name="star-four-points" size={16} color={color} />
            <Text style={[styles.resultPointsText, { color }]}>+{earnedPoints} points added to your balance</Text>
        </View>
    );
}

function BudgetHero({ personality, earnedPoints }: { personality: Personality; earnedPoints: number }) {
    return (
        <View style={[styles.resultHeroBase, styles.budgetHero]}>
            <View style={styles.budgetGlowA} />
            <View style={styles.budgetGlowB} />
            <View style={styles.budgetRow}>
                <View style={styles.budgetCopy}>
                    <View style={styles.budgetBadge}>
                        <MaterialCommunityIcons name="tag-multiple-outline" size={14} color="#7A5200" />
                        <Text style={styles.budgetBadgeText}>Deal Finder</Text>
                    </View>
                    <Text style={styles.budgetEyebrow}>Your shopping personality</Text>
                    <Text style={styles.budgetTitle}>{personality.title}</Text>
                    <Text style={styles.budgetTagline}>{personality.tagline}</Text>
                    <Text style={styles.budgetDesc}>{personality.description}</Text>
                    <View style={styles.resultChips}>
                        {personality.tags.map((tag) => (
                            <View key={tag} style={styles.budgetChip}>
                                <Text style={styles.budgetChipText}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                    <EarnedPoints earnedPoints={earnedPoints} color="#FFE08A" />
                </View>
                <View style={styles.budgetCharacterWrap}>
                    <View style={styles.budgetCharacterRing} />
                    <Image source={personality.character} style={styles.budgetCharacter} resizeMode="contain" />
                </View>
            </View>
        </View>
    );
}

function FashionHero({ personality, earnedPoints }: { personality: Personality; earnedPoints: number }) {
    return (
        <View style={[styles.resultHeroBase, styles.fashionHero]}>
            <View style={styles.fashionGlow} />
            <View style={styles.fashionFrame}>
                <Text style={styles.fashionEyebrow}>Your shopping personality</Text>
                <View style={styles.fashionCharacterWrap}>
                    <Image source={personality.character} style={styles.fashionCharacter} resizeMode="contain" />
                </View>
                <Text style={styles.fashionTitle}>{personality.title}</Text>
                <View style={styles.fashionDivider} />
                <Text style={styles.fashionTagline}>{personality.tagline}</Text>
                <Text style={styles.fashionDesc}>{personality.description}</Text>
                <View style={[styles.resultChips, { justifyContent: 'center' }]}>
                    {personality.tags.map((tag) => (
                        <View key={tag} style={styles.fashionChip}>
                            <Text style={styles.fashionChipText}>{tag}</Text>
                        </View>
                    ))}
                </View>
                <View style={{ alignItems: 'center' }}>
                    <EarnedPoints earnedPoints={earnedPoints} color="#FFD1E6" />
                </View>
            </View>
        </View>
    );
}

function TechHero({ personality, earnedPoints }: { personality: Personality; earnedPoints: number }) {
    return (
        <View style={[styles.resultHeroBase, styles.techHero]}>
            <View style={styles.techGridLine} />
            <View style={styles.techGridLineB} />
            <View style={styles.techGlow} />
            <View style={styles.techRow}>
                <View style={styles.techCharacterWrap}>
                    <View style={styles.techCharacterFrame}>
                        <Image source={personality.character} style={styles.techCharacter} resizeMode="contain" />
                    </View>
                </View>
                <View style={styles.techCopy}>
                    <View style={styles.techBadge}>
                        <MaterialCommunityIcons name="chip" size={14} color="#CFE0FF" />
                        <Text style={styles.techBadgeText}>Upgrade Mode</Text>
                    </View>
                    <Text style={styles.techEyebrow}>Your shopping personality</Text>
                    <Text style={styles.techTitle}>{personality.title}</Text>
                    <Text style={styles.techTagline}>{personality.tagline}</Text>
                    <Text style={styles.techDesc}>{personality.description}</Text>
                    <View style={styles.resultChips}>
                        {personality.tags.map((tag) => (
                            <View key={tag} style={styles.techChip}>
                                <Text style={styles.techChipText}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                    <EarnedPoints earnedPoints={earnedPoints} color="#A9C7FF" />
                </View>
            </View>
        </View>
    );
}

function AestheticHero({ personality, earnedPoints }: { personality: Personality; earnedPoints: number }) {
    return (
        <View style={[styles.resultHeroBase, styles.aestheticHero]}>
            <View style={styles.aestheticGlowA} />
            <View style={styles.aestheticGlowB} />
            <View style={styles.aestheticTop}>
                <Text style={styles.aestheticEyebrow}>Your shopping personality</Text>
                <View style={styles.aestheticCharacterWrap}>
                    <Image source={personality.character} style={styles.aestheticCharacter} resizeMode="contain" />
                </View>
                <View style={styles.aestheticIconBubble}>
                    <MaterialCommunityIcons name={personality.icon} size={20} color="#F3E8FF" />
                </View>
            </View>
            <Text style={styles.aestheticTitle}>{personality.title}</Text>
            <Text style={styles.aestheticTagline}>{personality.tagline}</Text>
            <Text style={styles.aestheticDesc}>{personality.description}</Text>
            <View style={[styles.resultChips, { justifyContent: 'center' }]}>
                {personality.tags.map((tag) => (
                    <View key={tag} style={styles.aestheticChip}>
                        <Text style={styles.aestheticChipText}>{tag}</Text>
                    </View>
                ))}
            </View>
            <View style={{ alignItems: 'center' }}>
                <EarnedPoints earnedPoints={earnedPoints} color="#E8D4FF" />
            </View>
        </View>
    );
}

function ResultHero({ personality, earnedPoints }: { personality: Personality; earnedPoints: number }) {
    switch (personality.key) {
        case 'budget':
            return <BudgetHero personality={personality} earnedPoints={earnedPoints} />;
        case 'fashion':
            return <FashionHero personality={personality} earnedPoints={earnedPoints} />;
        case 'tech':
            return <TechHero personality={personality} earnedPoints={earnedPoints} />;
        case 'aesthetic':
            return <AestheticHero personality={personality} earnedPoints={earnedPoints} />;
    }
}

export function PersonalityResult({
    personality,
    products,
    loading,
    earnedPoints,
    onShare,
    onRetake,
    onOpenProduct,
    onViewRewards,
}: PersonalityResultProps) {
    return (
        <View>
            <ResultHero personality={personality} earnedPoints={earnedPoints} />
            <Recommendations products={products} loading={loading} onOpenProduct={onOpenProduct} accent={personality.accent} />
            <ResultActions onShare={onShare} onRetake={onRetake} onViewRewards={onViewRewards} />
        </View>
    );
}