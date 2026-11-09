
/**
 * Profile Screen - Cookbook
 * TODO: Students implement
 * - Display user info from auth context
 * - Edit profile (PUT /users/{id})
 * - View order history / saved recipes
 * - Settings (notifications, theme, etc.)
 * - Logout
 */
import React from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Card, Button, List, Avatar, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './profileStyles';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleEditProfile = () => {
    Alert.alert('TODO', 'Implement edit profile: PUT /users/{id}');
  };

  const handleSettings = () => {
    Alert.alert('TODO', 'Implement settings screen');
  };

  const handleMyRecipes = () => {
    Alert.alert('TODO', 'Implement my recipes screen');
  };

  const handleCookbook = () => {
    Alert.alert('TODO', 'Implement personal cookbook');
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.notLoggedIn}>Please log in to view profile</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Avatar.Image
          size={88}
          source={{ uri: user?.image || 'https://via.placeholder.com/150' }}
          style={styles.avatar}
        />
        <View style={styles.nameContainer}>
          <Text style={styles.name}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.username}>@{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Recipes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Collections</Text>
        </View>
      </View>

      {/* Menu Sections */}
      <View style={styles.section}>
        <Card style={styles.menuCard} elevation={1}>
          <List.Section>
            <List.Item
              title="My Recipes"
              description="Recipes you've created"
              left={(props) => (
                <MaterialCommunityIcons
                  name="book-edit"
                  size={24}
                  color="#E85D04"
                  style={props.style}
                />
              )}
              right={(props) => (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color="#8D6E63"
                  style={props.style}
                />
              )}
              onPress={handleMyRecipes}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="My Cookbook"
              description="Personal collections & meal plans"
              left={(props) => (
                <MaterialCommunityIcons
                  name="book-open-page-variant"
                  size={24}
                  color="#E85D04"
                  style={props.style}
                />
              )}
              right={(props) => (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color="#8D6E63"
                  style={props.style}
                />
              )}
              onPress={handleCookbook}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Favorites"
              description="Your saved recipes"
              left={(props) => (
                <MaterialCommunityIcons
                  name="heart"
                  size={24}
                  color="#E85D04"
                  style={props.style}
                />
              )}
              right={(props) => (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color="#8D6E63"
                  style={props.style}
                />
              )}
              onPress={() => router.push('/(app)/(tabs)/favorites')}
            />
          </List.Section>
        </Card>
      </View>

      <View style={styles.section}>
        <Card style={styles.menuCard} elevation={1}>
          <List.Section>
            <List.Item
              title="Edit Profile"
              description="Update your information"
              left={(props) => (
                <MaterialCommunityIcons
                  name="account-edit"
                  size={24}
                  color="#E85D04"
                  style={props.style}
                />
              )}
              right={(props) => (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color="#8D6E63"
                  style={props.style}
                />
              )}
              onPress={handleEditProfile}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Settings"
              description="Notifications, theme, privacy"
              left={(props) => (
                <MaterialCommunityIcons
                  name="cog"
                  size={24}
                  color="#E85D04"
                  style={props.style}
                />
              )}
              right={(props) => (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color="#8D6E63"
                  style={props.style}
                />
              )}
              onPress={handleSettings}
            />
          </List.Section>
        </Card>
      </View>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          contentStyle={styles.logoutButtonContent}
          icon="logout"
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Button>
      </View>

      {/* Student Guide */}
      <View style={styles.guideContainer}>
        <Text style={styles.guideTitle}>📝 Student Implementation Guide</Text>
        <Text style={styles.guideText}>
          Complete the profile functionality:{'\n'}
          1. Edit profile: PUT /users/{'{id}'}{' \n'}
          2. Fetch user stats (recipes, favorites){'\n'}
          3. Settings: theme, notifications, privacy{' \n'}
          4. My Recipes: filter by userId{' \n'}
          5. Cookbook: create collections/folders
        </Text>
      </View>

      <View style={styles.version}>
        <Text style={styles.versionText}>Cookbook v1.0.0</Text>
      </View>
    </ScrollView>
  );
}
