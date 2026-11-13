/** Profile, account editing, saved recipes, settings, and logout. */
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { favoritesStorage } from '@/utils/storage';
import { Card, Title, Button, List, Avatar, Divider, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from '@/styles/profileStyles';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isAuthenticated, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [favoriteCount, setFavoriteCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      favoritesStorage.getIds().then((ids) => {
        if (active) setFavoriteCount(ids.length);
      }).catch(() => {
        if (active) setFavoriteCount(0);
      });

      return () => {
        active = false;
      };
    }, [])
  );

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  const handleEditProfile = () => {
    setEditing(true);
  };

  const handleSettings = () => {
    router.push('/(app)/settings');
  };

  const handleMyRecipes = () => {
    router.push('/(app)/my-recipes');
  };

  const handleCookbook = () => {
    router.push('/(app)/(tabs)/favorites');
  };

  const saveProfile = async () => {
    try {
      await updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() });
      setEditing(false);
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Unable to update profile.');
    }
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
      {editing && (
        <Card style={styles.menuCard} elevation={1}>
          <Card.Content>
            <Title>Edit Profile</Title>
            <TextInput label="First name" value={firstName} onChangeText={setFirstName} mode="outlined" />
            <TextInput label="Last name" value={lastName} onChangeText={setLastName} mode="outlined" />
            <Button mode="contained" onPress={saveProfile}>Save changes</Button>
          </Card.Content>
        </Card>
      )}
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
          <Text style={styles.statValue}>{favoriteCount}</Text>
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
                <MaterialCommunityIcons name="book-edit" size={24} color="#E85D04" style={props.style} />
              )}
              right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color="#8D6E63" style={props.style} />}
              onPress={handleMyRecipes}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="My Cookbook"
              description="Personal collections & meal plans"
              left={(props) => (
                <MaterialCommunityIcons name="book" size={24} color="#E85D04" style={props.style} />
              )}
              right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color="#8D6E63" style={props.style} />}
              onPress={handleCookbook}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Favorites"
              description="Your saved recipes"
              left={(props) => (
                <MaterialCommunityIcons name="heart" size={24} color="#E85D04" style={props.style} />
              )}
              right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color="#8D6E63" style={props.style} />}
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
                <MaterialCommunityIcons name="account-edit" size={24} color="#E85D04" style={props.style} />
              )}
              right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color="#8D6E63" style={props.style} />}
              onPress={handleEditProfile}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Settings"
              description="Notifications, theme, privacy"
              left={(props) => (
                <MaterialCommunityIcons name="cog" size={24} color="#E85D04" style={props.style} />
              )}
              right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color="#8D6E63" style={props.style} />}
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

      <View style={styles.version}>
        <Text style={styles.versionText}>Cookbook v1.0.0</Text>
      </View>
    </ScrollView>
  );
}