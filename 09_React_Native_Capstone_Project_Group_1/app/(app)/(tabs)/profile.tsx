
/**
 * Profile Screen - Cookbook
 * Includes Light Mode / Dark Mode Theme Switching
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useThemeMode } from '@/context/ThemeContext';
import {
  Card,
  Button,
  List,
  Avatar,
  Divider,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './profileStyles';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useThemeMode();
  const paperTheme = useTheme();

  const colors = {
    background: paperTheme.colors.background,
    surface: paperTheme.colors.surface,
    text: paperTheme.colors.onSurface,
    secondary: paperTheme.colors.onSurfaceVariant,
    primary: paperTheme.colors.primary,
    border: paperTheme.colors.outline,
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing will be available soon.');
  };

  const handleSettings = () => {
    Alert.alert('Settings', 'More settings will be available soon.');
  };

  const handleMyRecipes = () => {
    Alert.alert('My Recipes', 'Your created recipes will appear here.');
  };

  const handleCookbook = () => {
    Alert.alert('My Cookbook', 'Your personal collections will appear here.');
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.notLoggedIn, { color: colors.text }]}>
          Please log in to view profile
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <Avatar.Image
          size={88}
          source={{
            uri: user?.image || 'https://via.placeholder.com/150',
          }}
          style={styles.avatar}
        />

        <View style={styles.nameContainer}>
          <Text style={[styles.name, { color: colors.text }]}>
            {user?.firstName} {user?.lastName}
          </Text>

          <Text style={[styles.username, { color: colors.secondary }]}>
            @{user?.username}
          </Text>

          <Text style={[styles.email, { color: colors.secondary }]}>
            {user?.email}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View
        style={[
          styles.statsContainer,
          { backgroundColor: colors.surface },
        ]}
      >
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
          <Text style={[styles.statLabel, { color: colors.secondary }]}>
            Recipes
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
          <Text style={[styles.statLabel, { color: colors.secondary }]}>
            Favorites
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
          <Text style={[styles.statLabel, { color: colors.secondary }]}>
            Collections
          </Text>
        </View>
      </View>

      {/* My Cookbook Menu */}
      <View style={styles.section}>
        <Card
          style={[styles.menuCard, { backgroundColor: colors.surface }]}
          elevation={1}
        >
          <List.Section>
            <List.Item
              title="My Recipes"
              description="Recipes you've created"
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.secondary }}
              left={(props) => (
                <MaterialCommunityIcons
                  name="book-edit"
                  size={24}
                  color={colors.primary}
                  style={props.style}
                />
              )}
              right={(props) => (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={colors.secondary}
                  style={props.style}
                />
              )}
              onPress={handleMyRecipes}
            />

            <Divider style={[styles.divider, { backgroundColor: colors.border }]} />

            <List.Item
              title="My Cookbook"
              description="Personal collections & meal plans"
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.secondary }}
              left={(props) => (
                <MaterialCommunityIcons
                  name="book-open"
                  size={24}
                  color={colors.primary}
                  style={props.style}
                />
              )}
              right={(props) => (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={colors.secondary}
                  style={props.style}
                />
              )}
              onPress={handleCookbook}
            />

            <Divider style={[styles.divider, { backgroundColor: colors.border }]} />

            <List.Item
              title="Favorites"
              description="Your saved recipes"
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.secondary }}
              left={(props) => (
                <MaterialCommunityIcons
                  name="heart"
                  size={24}
                  color={colors.primary}
                  style={props.style}
                />
              )}
              right={(props) => (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={colors.secondary}
                  style={props.style}
                />
              )}
              onPress={() => router.push('/(app)/(tabs)/favorites')}
            />
          </List.Section>
        </Card>
      </View>

      {/* Account Menu */}
      <View style={styles.section}>
        <Card
          style={[styles.menuCard, { backgroundColor: colors.surface }]}
          elevation={1}
        >
          <List.Section>
            <List.Item
              title="Edit Profile"
              description="Update your information"
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.secondary }}
              left={(props) => (
                <MaterialCommunityIcons
                  name="account-edit"
                  size={24}
                  color={colors.primary}
                  style={props.style}
                />
              )}
              right={(props) => (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={colors.secondary}
                  style={props.style}
                />
              )}
              onPress={handleEditProfile}
            />

            <Divider style={[styles.divider, { backgroundColor: colors.border }]} />

            <List.Item
              title="Settings"
              description="Notifications, theme, privacy"
              titleStyle={{ color: colors.text }}
              descriptionStyle={{ color: colors.secondary }}
              left={(props) => (
                <MaterialCommunityIcons
                  name="cog"
                  size={24}
                  color={colors.primary}
                  style={props.style}
                />
              )}
              right={(props) => (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={colors.secondary}
                  style={props.style}
                />
              )}
              onPress={handleSettings}
            />
          </List.Section>
        </Card>
      </View>

      {/* Appearance / Dark Mode */}
      <View style={styles.section}>
        <Card
          style={[styles.menuCard, { backgroundColor: colors.surface }]}
          elevation={1}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 18,
            }}
          >
            <MaterialCommunityIcons
              name={isDark ? 'moon-waning-crescent' : 'white-balance-sunny'}
              size={26}
              color={colors.primary}
            />

            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 16,
                  fontWeight: '700',
                }}
              >
                Dark Mode
              </Text>

              <Text
                style={{
                  color: colors.secondary,
                  fontSize: 12,
                  marginTop: 4,
                }}
              >
                {isDark ? 'Dark appearance is enabled' : 'Light appearance is enabled'}
              </Text>
            </View>

            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{
                false: '#C8D4C8',
                true: '#78C6A3',
              }}
              thumbColor={isDark ? '#176B63' : '#F4F4F4'}
            />
          </View>
        </Card>
      </View>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={[
            styles.logoutButton,
            { borderColor: colors.primary },
          ]}
          contentStyle={styles.logoutButtonContent}
          icon="logout"
          textColor={colors.primary}
        >
          Logout
        </Button>
      </View>

      <View style={styles.version}>
        <Text style={[styles.versionText, { color: colors.secondary }]}>
          Cookbook v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}
