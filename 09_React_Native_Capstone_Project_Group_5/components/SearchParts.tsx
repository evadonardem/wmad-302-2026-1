/**
 * Search screen pieces: icon section title and the horizontal card row with arrow buttons.
 */
import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Recipe } from '@/types/recipe';
import { IconName } from '@/components';
import { createStyles, tc, useAppTheme } from '@/context/ThemeContext';

/** Section title with a small icon, e.g. "Top Rated". */
export function RowTitle({ icon, title }: { icon: IconName; title: string }) {
    useAppTheme();
    return (
        <View style={styles.rowTitle}>
            <MaterialCommunityIcons name={icon} size={24} color={tc('#3E2723')} />
            <Text style={styles.rowTitleText}>{title}</Text>
        </View>
    );
}

/**
 * Horizontal row of cards with arrow buttons. Card width is worked out from the row width so a
 * whole number of cards always fits (no half-cut card at the right edge); the arrows scroll by a page.
 */
export function CardRow({
    title,
    icon,
    items,
    columns,
    renderCard,
}: {
    title: string;
    icon: IconName;
    items: Recipe[];
    columns: number;
    renderCard: (recipe: Recipe) => React.ReactNode;
}) {
    useAppTheme();
    const ref = useRef<ScrollView>(null);
    const [width, setWidth] = useState(0);
    const [content, setContent] = useState(0);
    const [x, setX] = useState(0);
    const gap = 16;
    // Phones show one card with a peek of the next one; wider panes show exactly `columns` cards
    const cardW = width > 0 ? (columns > 1 ? (width - gap * (columns - 1)) / columns : width * 0.86) : 290;
    const step = (cardW + gap) * Math.max(1, columns);
    const canPrev = x > 4;
    const canNext = content - width - x > 4;
    const scrollBy = (dir: 1 | -1) => ref.current?.scrollTo({ x: Math.max(0, x + dir * step), animated: true });

    return (
        <View>
            <View style={styles.rowHeader}>
                <RowTitle icon={icon} title={title} />
                {(canPrev || canNext) && (
                    <View style={styles.arrows}>
                        <Pressable
                            onPress={() => scrollBy(-1)}
                            disabled={!canPrev}
                            style={[styles.arrow, !canPrev && styles.arrowOff]}
                            accessibilityRole="button"
                            accessibilityLabel={`${title}: previous`}
                        >
                            <MaterialCommunityIcons name="chevron-left" size={24} color={tc('#2B2320')} />
                        </Pressable>
                        <Pressable
                            onPress={() => scrollBy(1)}
                            disabled={!canNext}
                            style={[styles.arrow, !canNext && styles.arrowOff]}
                            accessibilityRole="button"
                            accessibilityLabel={`${title}: next`}
                        >
                            <MaterialCommunityIcons name="chevron-right" size={24} color={tc('#2B2320')} />
                        </Pressable>
                    </View>
                )}
            </View>
            <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
                <ScrollView
                    ref={ref}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={cardW + gap}
                    decelerationRate="fast"
                    scrollEventThrottle={16}
                    onScroll={(e) => setX(e.nativeEvent.contentOffset.x)}
                    onContentSizeChange={(w) => setContent(w)}
                    contentContainerStyle={{ gap, paddingVertical: 12 }}
                >
                    {items.map((r) => (
                        <View key={r.id} style={{ width: cardW }}>
                            {renderCard(r)}
                        </View>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = createStyles({
    rowHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    arrows: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    arrow: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6D6C4', alignItems: 'center', justifyContent: 'center' },
    arrowOff: { opacity: 0.35 },
    rowTitle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 12 },
    rowTitleText: { fontSize: 22, fontWeight: '800', color: '#2B2320' },
});