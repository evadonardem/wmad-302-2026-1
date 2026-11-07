/**
 * Profile Screen - Marketplace
 * TODO: Students implement
 * - Display user info from auth context
 * - Edit profile (PUT /users/{id})
 * - View order history (GET /carts/user/{id})
 * - Settings (notifications, theme, addresses, payment)
 * - Logout
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Card, Title, Button, List, Avatar, Divider, Badge } from 'react-native-paper';
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

  const handleOrders = () => {
    Alert.alert('TODO', 'Implement order history: GET /carts/user/{id}');
  };

  const handleAddresses = () => {
    Alert.alert('TODO', 'Implement address management');
  };

  const handlePayment = () => {
    Alert.alert('TODO', 'Implement payment methods');
  };

  const handleSettings = () => {
    Alert.alert('TODO', 'Implement settings screen');
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
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>$0.00</Text>
          <Text style={styles.statLabel}>Spent</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Wishlist</Text>
        </View>
      </View>

      {/* Menu Sections */}
      <View style={styles.section}>
        <Card style={styles.menuCard} elevation={1}>
          <List.Section>
            <List.Item
              title="My Orders"
              description="Track and manage orders"
              left={(props) => (
                <View style={props.style}>
                  <MaterialCommunityIcons name="package-variant" size={24} color="#1A73E8" />
                  <Badge size={16} style={{ position: 'absolute', right: -4, top: -4 }}>
                    0
                  </Badge>
                </View>
              )}
              right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color="#5F6368" style={props.style} />}
              onPress={handleOrders}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Wishlist"
              description="Saved items for later"
              left={(props) => (
                <MaterialCommunityIcons name="heart" size={24} color="#1A73E8" style={props.style} />
              )}
              right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color="#5F6368" style={props.style} />}
              onPress={() => Alert.alert('TODO', 'Implement wishlist')}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Addresses"
              description="Manage delivery addresses"
              left={(props) => (
                <MaterialCommunityIcons name="map-marker" size={24} color="#1A73E8" style={props.style} />
              )}
              right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color="#5F6368" style={props.style} />}
              onPress={handleAddresses}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Payment Methods"
              description="Manage cards & wallets"
              left={(props) => (
                <MaterialCommunityIcons name="credit-card" size={24} color="#1A73E8" style={props.style} />
              )}
              right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color="#5F6368" style={props.style} />}
              onPress={handlePayment}
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
                <MaterialCommunityIcons name="account-edit" size={24} color="#1A73E8" style={props.style} />
              )}
              right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color="#5F6368" style={props.style} />}
              onPress={handleEditProfile}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Settings"
              description="Notifications, theme, privacy"
              left={(props) => (
                <MaterialCommunityIcons name="cog" size={24} color="#1A73E8" style={props.style} />
              )}
              right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color="#5F6368" style={props.style} />}
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
          Complete the profile functionality:\n
          1. Edit profile: PUT /users/{'{id}'}\n
          2. Order history: GET /carts/user/{'{id}'}\n
          3. Address management (CRUD)\n
          4. Payment methods integration\n
          5. Settings: theme, notifications, privacy
        </Text>
      </View>

      <View style={styles.version}>
        <Text style={styles.versionText}>Marketplace v1.0.0</Text>
      </View>
    </ScrollView>
  );
}