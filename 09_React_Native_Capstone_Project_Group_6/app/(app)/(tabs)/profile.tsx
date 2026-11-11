import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar, Button, Card, Dialog, Divider, List, Portal, Switch, TextInput, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useSettings } from '@/context/SettingsContext';
import { recipeApi } from '@/services/recipeApi';
import { styles } from './profileStyles';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateProfile, isAuthenticated } = useAuth();
  const { favoriteIds } = useFavorites();
  const { darkMode, setDarkMode, error: settingsError } = useSettings();
  const { colors } = useTheme();
  const [recipeCount, setRecipeCount] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [feedback, setFeedback] = useState<{ title: string; message: string } | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!user) return;
    recipeApi.getRecipes({ limit: 100 })
      .then(({ recipes }) => setRecipeCount(recipes.filter((recipe) => recipe.userId === user.id).length))
      .catch((error: unknown) => {
        setFeedback({
          title: 'Could not load profile stats',
          message: error instanceof Error ? error.message : 'Please try again later.',
        });
      });
  }, [user]);

  const handleLogout = () => {
    setLogoutDialogVisible(true);
  };

  const handleDarkModeChange = (enabled: boolean) => {
    void setDarkMode(enabled).catch((error: unknown) => {
      setFeedback({
        title: 'Appearance not saved',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    });
  };

  const confirmLogout = async () => {
    setLogoutPending(true);
    try {
      await logout();
      setLogoutDialogVisible(false);
      router.replace('/(auth)/login');
    } catch (error) {
      setLogoutDialogVisible(false);
      setFeedback({
        title: 'Could not sign out',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setLogoutPending(false);
    }
  };

  const openEditProfile = () => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setEmail(user?.email || '');
    setEditing(true);
  };

  const saveProfile = async () => {
    if (!firstName.trim() || !lastName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFeedback({
        title: 'Check your details',
        message: 'Enter your first name, last name, and a valid email address.',
      });
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });
      setEditing(false);
    } catch (error) {
      setFeedback({
        title: 'Profile not saved',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.notLoggedIn, { color: colors.onBackground }]}>Please sign in to view your profile.</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Avatar.Image size={88} source={{ uri: user.image }} style={styles.avatar} />
          <View style={styles.nameContainer}>
            <Text style={[styles.name, { color: colors.onBackground }]}>{user.firstName} {user.lastName}</Text>
            <Text style={[styles.username, { color: colors.onSurfaceVariant }]}>@{user.username}</Text>
            <Text style={[styles.email, { color: colors.onSurfaceVariant }]}>{user.email}</Text>
          </View>
        </View>

        <View style={[styles.statsContainer, { backgroundColor: colors.surfaceVariant }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.onBackground }]}>{recipeCount === null ? '—' : recipeCount}</Text>
            <Text style={styles.statLabel}>My recipes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.onBackground }]}>{favoriteIds.length}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Card style={styles.menuCard} elevation={1}>
            <List.Section>
              <List.Item
                title="My Recipes"
                description={`${recipeCount ?? '…'} recipes shared by you`}
                left={(props) => <MaterialCommunityIcons name="book-edit" size={24} color="#E85D04" style={props.style} />}
                right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color="#8D6E63" style={props.style} />}
                onPress={() => router.push(`/(app)/(tabs)/search?userId=${user.id}`)}
              />
              <Divider style={styles.divider} />
              <List.Item
                title="My Cookbook"
                description="Your saved recipes"
                left={(props) => <MaterialCommunityIcons name="book-open-variant" size={24} color="#E85D04" style={props.style} />}
                right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color="#8D6E63" style={props.style} />}
                onPress={() => router.push('/(app)/(tabs)/favorites')}
              />
              <Divider style={styles.divider} />
              <List.Item
                title="Meal Planner & Lists"
                description="Plan meals, build shopping lists, and organize collections"
                left={(props) => <MaterialCommunityIcons name="calendar-month" size={24} color="#E85D04" style={props.style} />}
                right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color="#8D6E63" style={props.style} />}
                onPress={() => router.push('/(app)/planner')}
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
                left={(props) => <MaterialCommunityIcons name="account-edit" size={24} color="#E85D04" style={props.style} />}
                right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color="#8D6E63" style={props.style} />}
                onPress={openEditProfile}
              />
              <Divider style={styles.divider} />
              <List.Item
                title="Privacy & settings"
                description="About your account and data"
                left={(props) => <MaterialCommunityIcons name="shield-account" size={24} color="#E85D04" style={props.style} />}
                right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color="#8D6E63" style={props.style} />}
                onPress={() => setFeedback({
                  title: 'Privacy',
                  message: 'Your profile and favorites are stored on this device. Cookbook uses the DummyJSON demo API for recipes and sign-in.',
                })}
              />
              <Divider style={styles.divider} />
              <List.Item
                title="Dark mode"
                description="Use a darker appearance"
                left={(props) => <MaterialCommunityIcons name="theme-light-dark" size={24} color="#E85D04" style={props.style} />}
                right={() => <Switch value={darkMode} onValueChange={handleDarkModeChange} />}
              />
              {settingsError && <Text style={{ color: colors.error, paddingHorizontal: 16, paddingBottom: 8 }}>{settingsError}</Text>}
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
            <Text style={styles.logoutButtonText}>Sign out</Text>
          </Button>
        </View>
        <View style={styles.version}>
          <Text style={styles.versionText}>Cookbook v1.0.0</Text>
        </View>
      </ScrollView>

      <Modal visible={editing} animationType="slide" transparent onRequestClose={() => setEditing(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.editCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.editTitle, { color: colors.onSurface }]}>Edit profile</Text>
            <TextInput label="First name" value={firstName} onChangeText={setFirstName} mode="outlined" />
            <TextInput label="Last name" value={lastName} onChangeText={setLastName} mode="outlined" />
            <TextInput label="Email" value={email} onChangeText={setEmail} mode="outlined" autoCapitalize="none" keyboardType="email-address" />
            <View style={styles.editActions}>
              <Button onPress={() => setEditing(false)} disabled={saving}>Cancel</Button>
              <Button mode="contained" onPress={() => { void saveProfile(); }} loading={saving} disabled={saving}>Save changes</Button>
            </View>
          </View>
        </View>
      </Modal>

      <Portal>
        <Dialog
          visible={logoutDialogVisible}
          style={{ borderRadius: 12, width: '90%', maxWidth: 400, alignSelf: 'center' }}
          onDismiss={() => {
            if (!logoutPending) setLogoutDialogVisible(false);
          }}
        >
          <Dialog.Title>Sign out?</Dialog.Title>
          <Dialog.Content>
            <Text>You can sign in again at any time.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogoutDialogVisible(false)} disabled={logoutPending}>Cancel</Button>
            <Button
              onPress={() => { void confirmLogout(); }}
              loading={logoutPending}
              disabled={logoutPending}
              textColor="#C62828"
            >
              Sign out
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog
          visible={feedback !== null}
          onDismiss={() => setFeedback(null)}
          style={{ borderRadius: 12, width: '90%', maxWidth: 400, alignSelf: 'center' }}
        >
          <Dialog.Title>{feedback?.title}</Dialog.Title>
          <Dialog.Content><Text>{feedback?.message}</Text></Dialog.Content>
          <Dialog.Actions><Button onPress={() => setFeedback(null)}>OK</Button></Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}
