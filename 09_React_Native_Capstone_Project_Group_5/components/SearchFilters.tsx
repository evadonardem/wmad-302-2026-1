/**
 * SearchFilters - the search box and collapsible filter groups for the Search page.
 * Each group (Meal Type, Cuisine, Tags, ...) opens like an accordion and lists its options with counts.
 */
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { IconName } from '@/components';
import { createStyles, tc, useAppTheme } from '@/context/ThemeContext';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterSection {
  key: string;
  title: string;
  icon: IconName;
  options: FilterOption[];
  selected: string | null;
  onSelect: (value: string | null) => void;
  /** The "no filter" value (e.g. 'relevance' for sorting): the group is not highlighted while it is selected */
  defaultValue?: string | null;
  /** Show only this many options until "Show all" is pressed */
  collapsedLimit?: number;
}

interface Props {
  query: string;
  onQueryChange: (value: string) => void;
  sections: FilterSection[];
  /** false hides the groups (used on phones until the filter button is pressed) */
  showSections?: boolean;
  /** 'search' = only the search box, 'sections' = only the groups, default = both */
  part?: 'all' | 'search' | 'sections';
  /** icon button at the right of the search box */
  filterButton: { icon: IconName; label: string; onPress: () => void; badge?: number };
}

function Section({ section }: { section: FilterSection }) {
  useAppTheme();
  const active = section.selected !== null && section.selected !== (section.defaultValue ?? null);
  const [open, setOpen] = useState(active || section.key === 'meal');
  const [showAll, setShowAll] = useState(false);
  const limit = section.collapsedLimit ?? section.options.length;
  const options = showAll ? section.options : section.options.slice(0, limit);

  return (
    <View style={styles.section}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={[styles.sectionHeader, active && styles.sectionHeaderActive]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={section.title}
      >
        <MaterialCommunityIcons name={section.icon} size={22} color={tc('#3E2723')} />
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <MaterialCommunityIcons name={open ? 'chevron-up' : 'chevron-down'} size={22} color={tc('#3E2723')} />
      </Pressable>

      {open && (
        <View style={styles.options}>
          {options.map((o) => {
            const selected = section.selected === o.value;
            return (
              <Pressable
                key={o.value}
                onPress={() => section.onSelect(selected ? (section.defaultValue ?? null) : o.value)}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <MaterialCommunityIcons name="subdirectory-arrow-right" size={18} color={selected ? tc('#3E2723') : tc('#BCAAA4')} />
                <Text style={[styles.optionText, selected && styles.optionTextSelected]} numberOfLines={1}>
                  {o.label}
                </Text>
                {o.count !== undefined && (
                  <View style={[styles.count, selected && styles.countSelected]}>
                    <Text style={[styles.countText, selected && styles.countTextSelected]}>{o.count}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
          {section.options.length > limit && (
            <Pressable onPress={() => setShowAll((v) => !v)} style={styles.showAll} accessibilityRole="button">
              <Text style={styles.showAllText}>{showAll ? 'Show less' : `Show all ${section.options.length}`}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

export function SearchFilters({ query, onQueryChange, sections, showSections = true, part = 'all', filterButton }: Props) {
  useAppTheme();
  if (part === 'sections') {
    return <View>{sections.map((s) => <Section key={s.key} section={s} />)}</View>;
  }
  return (
    <View>
      <View style={styles.searchBox}>
        <MaterialCommunityIcons name="magnify" size={22} color={tc('#8D6E63')} />
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder="Search recipes, ingredients..."
          placeholderTextColor={tc('#A1887F')}
          style={styles.input}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Search recipes"
        />
        {query.length > 0 && (
          <Pressable onPress={() => onQueryChange('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear search">
            <MaterialCommunityIcons name="close-circle" size={18} color={tc('#BCAAA4')} />
          </Pressable>
        )}
        <Pressable
          onPress={filterButton.onPress}
          hitSlop={8}
          style={styles.filterButton}
          accessibilityRole="button"
          accessibilityLabel={filterButton.label}
        >
          <MaterialCommunityIcons name={filterButton.icon} size={22} color={tc('#3E2723')} />
          {!!filterButton.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{filterButton.badge}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {part === 'all' && showSections && sections.map((s) => <Section key={s.key} section={s} />)}
    </View>
  );
}

const styles = createStyles({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F1EBE3',
    borderRadius: 26,
    paddingHorizontal: 16,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#3E2723',
    height: '100%',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  filterButton: { position: 'relative', padding: 2 },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#E85D04',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },

  section: { marginTop: 14 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 52,
    borderRadius: 26,
    paddingHorizontal: 16,
  },
  sectionHeaderActive: { backgroundColor: '#FFE082' },
  sectionTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#2B2320' },
  options: { paddingLeft: 14, paddingTop: 4 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 42, paddingHorizontal: 6, borderRadius: 12 },
  optionPressed: { backgroundColor: '#F6F1EA' },
  optionText: { flex: 1, fontSize: 15, color: '#5D4037' },
  optionTextSelected: { color: '#2B2320', fontWeight: '800' },
  count: { minWidth: 28, paddingHorizontal: 8, height: 24, borderRadius: 12, backgroundColor: '#F1E7DC', alignItems: 'center', justifyContent: 'center' },
  countSelected: { backgroundColor: '#FFE082' },
  countText: { fontSize: 12, fontWeight: '700', color: '#8D6E63' },
  countTextSelected: { color: '#2B2320' },
  showAll: { paddingVertical: 8, paddingHorizontal: 8 },
  showAllText: { fontSize: 13, fontWeight: '700', color: '#E85D04' },
});