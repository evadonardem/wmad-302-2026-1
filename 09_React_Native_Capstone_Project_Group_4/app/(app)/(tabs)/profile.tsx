/**
 * Profile Screen - Culinary Chef Identity, Taste DNA Analytics, Interactive Goals & Edit Profile
 * Features: Espresso hero banner, overlapping chef card with live rank & quick edit button,
 * auto-computed Taste DNA from saved favorites, interactive calorie goal stepper,
 * dietary preference pills, unlockable chef badges, Account Settings & Edit Profile modal
 */
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AnimatedCardWrapper } from '@/components/AnimatedComponents';

const CONTENT_MAX_WIDTH = 720;

const HERO_DISPLAY_FONT = Platform.select({
  web: "'Playfair Display', 'Georgia', 'Times New Roman', serif",
  ios: 'Georgia-BoldItalic',
  android: 'serif',
  default: 'serif',
});

const DIETARY_GOALS = [
  { id: 'protein', label: 'High Protein', icon: 'arm-flex' as const },
  { id: 'light', label: 'Light (<400 kcal)', icon: 'leaf' as const },
  { id: 'quick', label: 'Quick (<30 mins)', icon: 'lightning-bolt' as const },
  { id: 'balanced', label: 'Balanced Macros', icon: 'scale-balance' as const },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { favorites } = useFavorites();
  const { width } = useWindowDimensions();

  // Local editable profile state (syncs with logged-in user)
  const [firstName, setFirstName] = useState(user?.firstName || 'Emily');
  const [lastName, setLastName] = useState(user?.lastName || 'Johnson');
  const [email, setEmail] = useState(user?.email || 'emily.johnson@x.dummyjson.com');
  const [bio, setBio] = useState('Home cook & flavor explorer');

  // Edit Profile Modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [draftFirstName, setDraftFirstName] = useState(firstName);
  const [draftLastName, setDraftLastName] = useState(lastName);
  const [draftEmail, setDraftEmail] = useState(email);
  const [draftBio, setDraftBio] = useState(bio);

  // Settings Modal state
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [mealReminders, setMealReminders] = useState(true);
  const [showMacroBadges, setShowMacroBadges] = useState(true);

  // Nutrition & Dietary Goals
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState(2000);
  const [selectedGoals, setSelectedGoals] = useState<Record<string, boolean>>({
    protein: true,
    quick: true,
  });

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || 'Emily');
      setLastName(user.lastName || 'Johnson');
      setEmail(user.email || 'emily.johnson@x.dummyjson.com');
    }
  }, [user]);

  const openEditProfile = () => {
    setDraftFirstName(firstName);
    setDraftLastName(lastName);
    setDraftEmail(email);
    setDraftBio(bio);
    setEditModalVisible(true);
  };

  const handleSaveProfile = () => {
    const cleanFirst = draftFirstName.trim();
    const cleanLast = draftLastName.trim();
    const cleanEmail = draftEmail.trim();

    if (!cleanFirst || !cleanLast || !cleanEmail) {
      if (Platform.OS === 'web') {
        window.alert('Please fill in your First Name, Last Name, and Email.');
      } else {
        Alert.alert('Missing Info', 'Please fill in your First Name, Last Name, and Email.');
      }
      return;
    }

    setFirstName(cleanFirst);
    setLastName(cleanLast);
    setEmail(cleanEmail);
    setBio(draftBio.trim() || 'Home cook & flavor explorer');
    setEditModalVisible(false);
  };

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Compute Chef Rank & Taste DNA dynamically from saved favorites
  const tasteDna = useMemo(() => {
    const count = favorites.length;
    const rank =
      count >= 10
        ? { title: 'Executive Chef', level: 'LVL 4', color: '#FFB74D' }
        : count >= 5
          ? { title: 'Head Chef', level: 'LVL 3', color: '#FF9E5E' }
          : count >= 2
            ? { title: 'Sous Chef', level: 'LVL 2', color: '#FFD54F' }
            : { title: 'Home Cook', level: 'LVL 1', color: '#E0D6CC' };

    if (count === 0) {
      return {
        rank,
        topCuisine: 'Not enough data yet',
        avgCalories: 0,
        cuisineBars: [] as { cuisine: string; count: number; pct: number }[],
        uniqueCuisines: 0,
      };
    }

    const cuisineCounts: Record<string, number> = {};
    let totalCal = 0;

    favorites.forEach((item) => {
      const c = item.cuisine || 'Global';
      cuisineCounts[c] = (cuisineCounts[c] || 0) + 1;
      totalCal += item.caloriesPerServing || 350;
    });

    const sortedCuisines = Object.entries(cuisineCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([cuisine, cCount]) => ({
        cuisine,
        count: cCount,
        pct: Math.round((cCount / count) * 100),
      }));

    return {
      rank,
      topCuisine: sortedCuisines[0]?.cuisine || 'Global',
      avgCalories: Math.round(totalCal / count),
      cuisineBars: sortedCuisines.slice(0, 3),
      uniqueCuisines: sortedCuisines.length,
    };
  }, [favorites]);

  const achievements = useMemo(
    () => [
      {
        id: 'first-bite',
        title: 'First Bite',
        desc: 'Save 1st recipe',
        icon: 'heart' as const,
        unlocked: favorites.length >= 1,
      },
      {
        id: 'collector',
        title: 'Gourmet Collector',
        desc: 'Save 3+ recipes',
        icon: 'star-circle' as const,
        unlocked: favorites.length >= 3,
      },
      {
        id: 'explorer',
        title: 'World Explorer',
        desc: '2+ cuisines saved',
        icon: 'earth' as const,
        unlocked: tasteDna.uniqueCuisines >= 2,
      },
    ],
    [favorites.length, tasteDna.uniqueCuisines]
  );

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      await logout();
      router.replace('/(auth)/login');
      return;
    }

    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const fullName = `${firstName} ${lastName}`;
  const username = user?.username || 'emilys';
  const avatarUri = user?.image;
  const containerWidth = Math.min(width - 32, CONTENT_MAX_WIDTH);

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF6F2' }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#FAF6F2' }}
        contentContainerStyle={{ paddingBottom: 44, alignItems: 'center' }}
      >
        {/* Top Espresso Culinary Hero Banner */}
        <View
          style={{
            width: '100%',
            height: width >= 768 ? 210 : 185,
            backgroundColor: '#2B1B12',
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            overflow: 'hidden',
            position: 'relative',
            alignItems: 'center',
            paddingTop: Platform.OS === 'ios' ? 48 : 22,
          }}
        >
          <Image
            source={{
              uri:
                favorites[0]?.image ||
                'https://cdn.dummyjson.com/recipe-images/5.webp',
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              opacity: 0.28,
            }}
            resizeMode="cover"
          />
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(28, 18, 12, 0.55)',
            }}
          />

          {/* Top Bar Title + Chef Rank Badge */}
          <View
            style={{
              width: containerWidth,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontFamily: HERO_DISPLAY_FONT,
                fontWeight: '900',
                fontStyle: 'italic',
                color: '#FFF8F0',
              }}
            >
              Chef Profile
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'rgba(232, 93, 4, 0.25)',
                borderWidth: 1,
                borderColor: 'rgba(232, 93, 4, 0.55)',
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 16,
              }}
            >
              <MaterialCommunityIcons name="chef-hat" size={15} color={tasteDna.rank.color} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFF8F0' }}>
                {tasteDna.rank.title} · {tasteDna.rank.level}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Centered Container */}
        <View style={{ width: containerWidth, marginTop: -76 }}>
          {/* Overlapping White Identity & Stats Card */}
          <AnimatedCardWrapper index={0}>
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 24,
                padding: 20,
                borderWidth: 1,
                borderColor: '#EFE6DD',
                shadowColor: '#2B1B12',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.08,
                shadowRadius: 16,
                elevation: 4,
                marginBottom: 18,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: '#FFF3E0',
                    borderWidth: 2.5,
                    borderColor: '#E85D04',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {avatarUri ? (
                    <Image
                      source={{ uri: avatarUri }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <MaterialCommunityIcons name="account" size={38} color="#E85D04" />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: '#2B1B12', marginBottom: 2 }}>
                    {fullName}
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#E85D04', marginBottom: 2 }}>
                    @{username}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#8D6E63' }} numberOfLines={1}>
                    {email}
                  </Text>
                  {bio ? (
                    <Text
                      style={{ fontSize: 11, color: '#6D4C41', fontStyle: 'italic', marginTop: 3 }}
                      numberOfLines={1}
                    >
                      “{bio}”
                    </Text>
                  ) : null}
                </View>

                {/* Quick Edit Pencil Button */}
                <TouchableOpacity
                  onPress={openEditProfile}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: '#FFF3E0',
                    borderWidth: 1,
                    borderColor: '#FAD7B8',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={18} color="#E85D04" />
                </TouchableOpacity>
              </View>

              {/* Warm Stats Strip */}
              <View
                style={{
                  backgroundColor: '#FFF5EB',
                  borderRadius: 16,
                  paddingVertical: 14,
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                  borderWidth: 1,
                  borderColor: '#FAD7B8',
                }}
              >
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#E85D04' }}>50</Text>
                  <Text style={{ fontSize: 11, color: '#8D6E63', fontWeight: '600' }}>Recipes</Text>
                </View>

                <View style={{ width: 1, backgroundColor: '#FAD7B8' }} />

                <TouchableOpacity
                  onPress={() => router.push('/(app)/(tabs)/favorites')}
                  style={{ alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#E85D04' }}>
                    {favorites.length}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#8D6E63', fontWeight: '600' }}>Favorites</Text>
                </TouchableOpacity>

                <View style={{ width: 1, backgroundColor: '#FAD7B8' }} />

                <TouchableOpacity
                  onPress={() => router.push('/(app)/(tabs)/categories')}
                  style={{ alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#E85D04' }}>15</Text>
                  <Text style={{ fontSize: 11, color: '#8D6E63', fontWeight: '600' }}>Categories</Text>
                </TouchableOpacity>
              </View>
            </View>
          </AnimatedCardWrapper>

          {/* Taste DNA & Flavor Analytics Card */}
          <AnimatedCardWrapper index={1}>
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 22,
                padding: 18,
                borderWidth: 1,
                borderColor: '#EFE6DD',
                marginBottom: 18,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      backgroundColor: '#FFF3E0',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialCommunityIcons name="chart-donut" size={18} color="#E85D04" />
                  </View>
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#2B1B12' }}>
                      Your Taste DNA
                    </Text>
                    <Text style={{ fontSize: 11, color: '#8D6E63' }}>
                      Live analysis from your saved recipes
                    </Text>
                  </View>
                </View>

                {tasteDna.avgCalories > 0 && (
                  <View
                    style={{
                      backgroundColor: '#E8F5E9',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#2E7D32' }}>
                      ~{tasteDna.avgCalories} kcal avg
                    </Text>
                  </View>
                )}
              </View>

              {tasteDna.cuisineBars.length === 0 ? (
                <View
                  style={{
                    backgroundColor: '#FAF6F2',
                    borderRadius: 14,
                    padding: 14,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 12, color: '#8D6E63', textAlign: 'center' }}>
                    Heart a few recipes in Discover to unlock your personalized Taste DNA breakdown!
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {tasteDna.cuisineBars.map((bar) => (
                    <View key={bar.cuisine}>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          marginBottom: 4,
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#3E2723' }}>
                          {bar.cuisine} Cuisine
                        </Text>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#E85D04' }}>
                          {bar.pct}% ({bar.count})
                        </Text>
                      </View>
                      <View
                        style={{
                          height: 8,
                          backgroundColor: '#F5EFEA',
                          borderRadius: 6,
                          overflow: 'hidden',
                        }}
                      >
                        <View
                          style={{
                            width: `${bar.pct}%`,
                            height: '100%',
                            backgroundColor: '#E85D04',
                            borderRadius: 6,
                          }}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </AnimatedCardWrapper>

          {/* Nutrition Target & Dietary Preferences Card */}
          <AnimatedCardWrapper index={2}>
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 22,
                padding: 18,
                borderWidth: 1,
                borderColor: '#EFE6DD',
                marginBottom: 18,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                }}
              >
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#2B1B12' }}>
                    Daily Nutrition Goal
                  </Text>
                  <Text style={{ fontSize: 11, color: '#8D6E63' }}>
                    Adjust your daily calorie budget
                  </Text>
                </View>

                {/* Stepper Controls */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FAF6F2',
                    borderWidth: 1,
                    borderColor: '#EADFD5',
                    borderRadius: 14,
                    paddingHorizontal: 6,
                    paddingVertical: 4,
                    gap: 10,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setDailyCalorieGoal((prev) => Math.max(1200, prev - 100))}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 10,
                      backgroundColor: '#FFFFFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialCommunityIcons name="minus" size={16} color="#E85D04" />
                  </TouchableOpacity>

                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#2B1B12' }}>
                    {dailyCalorieGoal} kcal
                  </Text>

                  <TouchableOpacity
                    onPress={() => setDailyCalorieGoal((prev) => Math.min(4000, prev + 100))}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 10,
                      backgroundColor: '#E85D04',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Dietary Preference Toggles */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {DIETARY_GOALS.map((goal) => {
                  const active = !!selectedGoals[goal.id];
                  return (
                    <TouchableOpacity
                      key={goal.id}
                      onPress={() => toggleGoal(goal.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: active ? '#FFF3E0' : '#FAF6F2',
                        borderWidth: 1,
                        borderColor: active ? '#E85D04' : '#EADFD5',
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 14,
                      }}
                    >
                      <MaterialCommunityIcons
                        name={goal.icon}
                        size={15}
                        color={active ? '#E85D04' : '#8D6E63'}
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color: active ? '#D95300' : '#6D4C41',
                        }}
                      >
                        {goal.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </AnimatedCardWrapper>

          {/* Unlockable Chef Badges Row */}
          <AnimatedCardWrapper index={3}>
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 22,
                padding: 18,
                borderWidth: 1,
                borderColor: '#EFE6DD',
                marginBottom: 18,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#2B1B12', marginBottom: 12 }}>
                Chef Achievements
              </Text>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                {achievements.map((badge) => (
                  <View
                    key={badge.id}
                    style={{
                      flex: 1,
                      backgroundColor: badge.unlocked ? '#FFF5EB' : '#F7F4F0',
                      borderWidth: 1,
                      borderColor: badge.unlocked ? '#FAD7B8' : '#E6DFD8',
                      borderRadius: 16,
                      padding: 12,
                      alignItems: 'center',
                      opacity: badge.unlocked ? 1 : 0.65,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: badge.unlocked ? '#E85D04' : '#D7CCC8',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 6,
                      }}
                    >
                      <MaterialCommunityIcons name={badge.icon} size={18} color="#FFFFFF" />
                    </View>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '800',
                        color: '#2B1B12',
                        textAlign: 'center',
                        marginBottom: 2,
                      }}
                      numberOfLines={1}
                    >
                      {badge.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        color: badge.unlocked ? '#D95300' : '#8D6E63',
                        textAlign: 'center',
                      }}
                      numberOfLines={1}
                    >
                      {badge.unlocked ? 'Unlocked!' : badge.desc}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </AnimatedCardWrapper>

          {/* Quick Navigation Menu Card */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 22,
              paddingHorizontal: 16,
              paddingVertical: 6,
              borderWidth: 1,
              borderColor: '#EFE6DD',
              marginBottom: 14,
            }}
          >
            {[
              {
                title: 'Discover Recipes',
                subtitle: 'Browse curated & popular dishes',
                icon: 'compass-outline' as const,
                route: '/(app)/(tabs)/home',
              },
              {
                title: 'Browse Categories',
                subtitle: 'Explore recipes by food type',
                icon: 'shape-outline' as const,
                route: '/(app)/(tabs)/categories',
              },
              {
                title: 'Saved Favorites',
                subtitle: `${favorites.length} saved recipes`,
                icon: 'heart-outline' as const,
                route: '/(app)/(tabs)/favorites',
              },
            ].map((menu, idx, arr) => (
              <TouchableOpacity
                key={menu.title}
                onPress={() => router.push(menu.route as any)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  borderBottomWidth: idx < arr.length - 1 ? 1 : 0,
                  borderBottomColor: '#F5EFEA',
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: '#FFF3E0',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialCommunityIcons name={menu.icon} size={20} color="#E85D04" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#2B1B12' }}>
                    {menu.title}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#8D6E63' }}>{menu.subtitle}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#A1887F" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Account Management: Edit Profile & Settings Card */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 22,
              paddingHorizontal: 16,
              paddingVertical: 6,
              borderWidth: 1,
              borderColor: '#EFE6DD',
              marginBottom: 18,
            }}
          >
            <TouchableOpacity
              onPress={openEditProfile}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: '#F5EFEA',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: '#FFF3E0',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons name="account-edit-outline" size={20} color="#E85D04" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#2B1B12' }}>
                  Edit Profile
                </Text>
                <Text style={{ fontSize: 11, color: '#8D6E63' }}>
                  Update your name, email &amp; chef bio
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#A1887F" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSettingsModalVisible(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 14,
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: '#FFF3E0',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons name="cog-outline" size={20} color="#E85D04" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#2B1B12' }}>
                  Settings
                </Text>
                <Text style={{ fontSize: 11, color: '#8D6E63' }}>
                  Notifications &amp; display preferences
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#A1887F" />
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleLogout}
            style={{
              backgroundColor: '#FFFFFF',
              borderWidth: 1.5,
              borderColor: '#FFCDD2',
              borderRadius: 16,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <MaterialCommunityIcons name="logout" size={18} color="#C62828" />
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#C62828' }}>Logout</Text>
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 11,
              color: '#A1887F',
              textAlign: 'center',
              marginTop: 14,
            }}
          >
            Cookbook Capstone · v1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(26, 16, 11, 0.55)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: 22,
              borderWidth: 1,
              borderColor: '#EFE6DD',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#2B1B12' }}>
                Edit Chef Profile
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#8D6E63" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, fontWeight: '700', color: '#4E342E', marginBottom: 6 }}>
              First Name
            </Text>
            <TextInput
              value={draftFirstName}
              onChangeText={setDraftFirstName}
              placeholder="First name"
              style={{
                backgroundColor: '#FAF6F2',
                borderWidth: 1,
                borderColor: '#EADFD5',
                borderRadius: 12,
                paddingHorizontal: 14,
                height: 46,
                fontSize: 14,
                color: '#2B1B12',
                marginBottom: 12,
              }}
            />

            <Text style={{ fontSize: 12, fontWeight: '700', color: '#4E342E', marginBottom: 6 }}>
              Last Name
            </Text>
            <TextInput
              value={draftLastName}
              onChangeText={setDraftLastName}
              placeholder="Last name"
              style={{
                backgroundColor: '#FAF6F2',
                borderWidth: 1,
                borderColor: '#EADFD5',
                borderRadius: 12,
                paddingHorizontal: 14,
                height: 46,
                fontSize: 14,
                color: '#2B1B12',
                marginBottom: 12,
              }}
            />

            <Text style={{ fontSize: 12, fontWeight: '700', color: '#4E342E', marginBottom: 6 }}>
              Email Address
            </Text>
            <TextInput
              value={draftEmail}
              onChangeText={setDraftEmail}
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                backgroundColor: '#FAF6F2',
                borderWidth: 1,
                borderColor: '#EADFD5',
                borderRadius: 12,
                paddingHorizontal: 14,
                height: 46,
                fontSize: 14,
                color: '#2B1B12',
                marginBottom: 12,
              }}
            />

            <Text style={{ fontSize: 12, fontWeight: '700', color: '#4E342E', marginBottom: 6 }}>
              Chef Bio / Tagline
            </Text>
            <TextInput
              value={draftBio}
              onChangeText={setDraftBio}
              placeholder="e.g. Home cook & pasta lover"
              style={{
                backgroundColor: '#FAF6F2',
                borderWidth: 1,
                borderColor: '#EADFD5',
                borderRadius: 12,
                paddingHorizontal: 14,
                height: 46,
                fontSize: 14,
                color: '#2B1B12',
                marginBottom: 18,
              }}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: '#EADFD5',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#6D4C41' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveProfile}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 14,
                  backgroundColor: '#E85D04',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>
                  Save Changes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={settingsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(26, 16, 11, 0.55)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: 22,
              borderWidth: 1,
              borderColor: '#EFE6DD',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#2B1B12' }}>
                App Settings
              </Text>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#8D6E63" />
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#F5EFEA',
              }}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#2B1B12' }}>
                  Daily Recipe Reminders
                </Text>
                <Text style={{ fontSize: 11, color: '#8D6E63' }}>
                  Get notified with fresh meal ideas
                </Text>
              </View>
              <Switch
                value={mealReminders}
                onValueChange={setMealReminders}
                trackColor={{ false: '#D7CCC8', true: '#FFCC80' }}
                thumbColor={mealReminders ? '#E85D04' : '#F5F5F5'}
              />
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 12,
                marginBottom: 16,
              }}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#2B1B12' }}>
                  Show Nutrition &amp; Macro Tags
                </Text>
                <Text style={{ fontSize: 11, color: '#8D6E63' }}>
                  Display calories, protein &amp; carbs on recipes
                </Text>
              </View>
              <Switch
                value={showMacroBadges}
                onValueChange={setShowMacroBadges}
                trackColor={{ false: '#D7CCC8', true: '#FFCC80' }}
                thumbColor={showMacroBadges ? '#E85D04' : '#F5F5F5'}
              />
            </View>

            <TouchableOpacity
              onPress={() => setSettingsModalVisible(false)}
              style={{
                backgroundColor: '#E85D04',
                paddingVertical: 12,
                borderRadius: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}