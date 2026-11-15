/**
 * Profile Screen - Cookbook
 * Displays user profile, live stats, Edit Profile (PUT /users/{id}), My Recipes, Cookbook, Settings, and Logout
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Platform,
  Modal,
  StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/services/authApi';
import { recipeApi } from '@/services/recipeApi';
import { favoritesStorage } from '@/utils/storage';
import { Recipe } from '@/types/recipe';
import {
  Card,
  Button,
  List,
  Avatar,
  Divider,
  TextInput as PaperTextInput,
  Switch,
  Title,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './profileStyles';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUser, isAuthenticated } = useAuth();

  const [favoriteCount, setFavoriteCount] = useState(0);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [recipesModalVisible, setRecipesModalVisible] = useState(false);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [metricUnits, setMetricUnits] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const favIds = await favoritesStorage.getIds();
      setFavoriteCount(Array.isArray(favIds) ? favIds.length : 0);

      if (user?.id) {
        const res = await recipeApi.getRecipes({ limit: 50, skip: 0 });
        setUserRecipes(res.recipes.filter((r) => r.userId === user.id));
      }
    } catch {
      // Ignore stats fetch error
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const openEditModal = () => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setEmail(user?.email || '');
    setStatusMessage(null);
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setStatusMessage('Please fill in all fields.');
      return;
    }

    try {
      setSaving(true);
      setStatusMessage(null);
      const updated = await authApi.updateProfile(user.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });
      updateUser({
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
      });
      setEditModalVisible(false);
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) {
        logout();
        router.replace('/(auth)/login');
      }
      return;
    }

    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.notLoggedIn}>Please log in to view profile</Text>
        <Button
          mode="contained"
          onPress={() => router.replace('/(auth)/login')}
          style={{ marginTop: 12, backgroundColor: '#E85D04' }}
        >
          Go to Login
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Avatar.Image
          size={88}
          source={{
            uri:
              user?.image ||
              `https://dummyjson.com/icon/${encodeURIComponent(user?.username || 'chef')}/128`,
          }}
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

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userRecipes.length}</Text>
          <Text style={styles.statLabel}>My Recipes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{favoriteCount}</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>3</Text>
          <Text style={styles.statLabel}>Collections</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Card style={styles.menuCard} elevation={1}>
          <List.Section>
            <List.Item
              title="My Recipes"
              description={`Recipes authored by ${user?.firstName || 'you'} (${userRecipes.length})`}
              left={(props) => (
                <MaterialCommunityIcons name="book-edit" size={24} color="#E85D04" style={props.style} />
              )}
              right={(props) => (
                <MaterialCommunityIcons name="chevron-right" size={24} color="#8D6E63" style={props.style} />
              )}
              onPress={() => setRecipesModalVisible(true)}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="My Cookbook"
              description="Quick Weeknight, Healthy Picks & Desserts"
              left={(props) => (
                <MaterialCommunityIcons name="book-open-variant" size={24} color="#E85D04" style={props.style} />
              )}
              right={(props) => (
                <MaterialCommunityIcons name="chevron-right" size={24} color="#8D6E63" style={props.style} />
              )}
              onPress={() => router.push('/(app)/(tabs)/favorites')}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Favorites"
              description={`${favoriteCount} saved recipes`}
              left={(props) => (
                <MaterialCommunityIcons name="heart" size={24} color="#E85D04" style={props.style} />
              )}
              right={(props) => (
                <MaterialCommunityIcons name="chevron-right" size={24} color="#8D6E63" style={props.style} />
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
              description="Update your name and email"
              left={(props) => (
                <MaterialCommunityIcons name="account-edit" size={24} color="#E85D04" style={props.style} />
              )}
              right={(props) => (
                <MaterialCommunityIcons name="chevron-right" size={24} color="#8D6E63" style={props.style} />
              )}
              onPress={openEditModal}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Settings"
              description="Notifications & measurement preferences"
              left={(props) => (
                <MaterialCommunityIcons name="cog" size={24} color="#E85D04" style={props.style} />
              )}
              right={(props) => (
                <MaterialCommunityIcons name="chevron-right" size={24} color="#8D6E63" style={props.style} />
              )}
              onPress={() => setSettingsModalVisible(true)}
            />
          </List.Section>
        </Card>
      </View>

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
        <Text style={styles.versionText}>Cookbook v1.0.0 · Group 7</Text>
      </View>

      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={modalStyles.backdrop}>
          <Card style={modalStyles.card}>
            <Card.Content>
              <Title style={modalStyles.title}>Edit Profile</Title>
              {statusMessage && <Text style={modalStyles.errorText}>{statusMessage}</Text>}
              <PaperTextInput
                label="First Name"
                mode="outlined"
                value={firstName}
                onChangeText={setFirstName}
                style={modalStyles.input}
              />
              <PaperTextInput
                label="Last Name"
                mode="outlined"
                value={lastName}
                onChangeText={setLastName}
                style={modalStyles.input}
              />
              <PaperTextInput
                label="Email"
                mode="outlined"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={modalStyles.input}
              />
              <View style={modalStyles.actions}>
                <Button mode="text" onPress={() => setEditModalVisible(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSaveProfile}
                  loading={saving}
                  disabled={saving}
                  style={{ backgroundColor: '#E85D04' }}
                >
                  Save Changes
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>
      </Modal>

      <Modal
        visible={settingsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={modalStyles.backdrop}>
          <Card style={modalStyles.card}>
            <Card.Content>
              <Title style={modalStyles.title}>App Settings</Title>
              <View style={modalStyles.settingRow}>
                <Text style={modalStyles.settingLabel}>Daily Recipe Reminders</Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  color="#E85D04"
                />
              </View>
              <View style={modalStyles.settingRow}>
                <Text style={modalStyles.settingLabel}>Use Metric Measurements</Text>
                <Switch value={metricUnits} onValueChange={setMetricUnits} color="#E85D04" />
              </View>
              <Button
                mode="contained"
                onPress={() => setSettingsModalVisible(false)}
                style={{ marginTop: 16, backgroundColor: '#E85D04' }}
              >
                Done
              </Button>
            </Card.Content>
          </Card>
        </View>
      </Modal>

      <Modal
        visible={recipesModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRecipesModalVisible(false)}
      >
        <View style={modalStyles.backdrop}>
          <Card style={modalStyles.card}>
            <Card.Content>
              <Title style={modalStyles.title}>My Recipes ({userRecipes.length})</Title>
              {userRecipes.length === 0 ? (
                <Text style={{ color: '#8D6E63', marginVertical: 12 }}>
                  No recipes published under user ID #{user?.id} yet.
                </Text>
              ) : (
                userRecipes.map((r) => (
                  <List.Item
                    key={r.id}
                    title={r.name}
                    description={`${r.cuisine} · ${r.difficulty}`}
                    onPress={() => {
                      setRecipesModalVisible(false);
                      router.push(`/(app)/recipe/${r.id}`);
                    }}
                  />
                ))
              )}
              <Button
                mode="contained"
                onPress={() => setRecipesModalVisible(false)}
                style={{ marginTop: 12, backgroundColor: '#E85D04' }}
              >
                Close
              </Button>
            </Card.Content>
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 14,
    backgroundColor: '#FFFDF8',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3E2723',
    marginBottom: 12,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    color: '#C62828',
    marginBottom: 8,
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingLabel: {
    fontSize: 15,
    color: '#3E2723',
  },
});
