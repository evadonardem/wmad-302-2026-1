
import React, { useState } from 'react';

import {
  View,
  Image,
  Text,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native';

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeMode } from '@/themeMode';

export default function TabsLayout() {
  const { isDarkMode } = useThemeMode();

  // LOGO POPUP STATE
  const [logoVisible, setLogoVisible] = useState(false);

  // ======================================
  // EMERALD THEME COLORS
  // ======================================

  const headerBackground = isDarkMode
    ? '#064332'
    : '#D8F3DC';

  const headerText = isDarkMode
    ? '#6EE7B7'
    : '#0D6B50';

  const activeColor = isDarkMode
    ? '#6EE7B7'
    : '#0D6B50';

  const inactiveColor = isDarkMode
    ? '#86A99B'
    : '#729487';

  const navigationBackground = isDarkMode
    ? '#064332'
    : '#D8F3DC';

  const navigationBorder = isDarkMode
    ? '#176B50'
    : '#B7E4C7';

  return (
    <>
      <Tabs
        screenOptions={{
          // ======================================
          // BOTTOM NAVIGATION COLORS
          // ======================================

          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: inactiveColor,

          tabBarStyle: {
            backgroundColor: navigationBackground,
            borderTopColor: navigationBorder,
            borderTopWidth: 1,
            paddingHorizontal: '50%',
          },

          // ======================================
          // CLICKABLE LOGO + TITLE
          // ======================================

          headerTitleAlign: 'center',

          headerTitle: () => (
            <Pressable
              onPress={() => setLogoVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="View LAKBAY PH logo"
              style={({ pressed }) => [
                styles.headerTitleContainer,
                {
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Image
                source={require('../../../assets/images/lakbay-ph-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />

              <Text
                style={[
                  styles.headerTitle,
                  { color: headerText },
                ]}
              >
                LAKBAY PH
              </Text>
            </Pressable>
          ),

          // ======================================
          // HEADER BACKGROUND
          // ======================================

          headerStyle: {
            backgroundColor: headerBackground,
            elevation: 0,
            borderBottomWidth: 1,
            borderBottomColor: navigationBorder,
          },
        }}
      >
        {/* MAIN HOME SCREEN */}

        <Tabs.Screen
          name="index"
          options={{
            title: 'LAKBAY PH',
            tabBarButton: () => null,
          }}
        />

        {/* ABOUT SCREEN */}

        <Tabs.Screen
          name="about"
          options={{
            title: 'About',
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="information-circle-outline"
                size={size}
                color={String(color)}
              />
            ),
          }}
        />
      </Tabs>

      {/* ======================================
          LAKBAY PH LOGO POPUP
      ====================================== */}

      <Modal
        visible={logoVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setLogoVisible(false)}
      >
        <View style={styles.modalBackground}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setLogoVisible(false)}
          />

          <View style={styles.modalContent}>
            {/* CLOSE BUTTON */}

            <Pressable
              onPress={() => setLogoVisible(false)}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close logo popup"
            >
              <Ionicons
                name="close-circle"
                size={34}
                color="#FFFFFF"
              />
            </Pressable>

            {/* LARGE LOGO */}

            <Image
              source={require('../../../assets/images/lakbay-ph-logo.png')}
              style={styles.largeLogo}
              resizeMode="contain"
            />

            {/* LOGO TITLE */}

            <Text style={styles.modalTitle}>
              LAKBAY PH
            </Text>

            <Text style={styles.modalSubtitle}>
              Islands • Mountains • Memories
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ======================================
// STYLES
// ======================================

const styles = StyleSheet.create({
  // HEADER

  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  logo: {
    width: 42,
    height: 42,
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 2,
  },

  // LOGO POPUP

  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalBackdrop: {
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
},

  modalContent: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 16,
    backgroundColor: '#064332',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#34D399',
    elevation: 15,
  },

  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    padding: 5,
  },

  largeLogo: {
    width: 300,
    height: 300,
    maxWidth: '90%',
  },

  modalTitle: {
    color: '#6EE7B7',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 3,
    marginTop: 12,
  },

  modalSubtitle: {
    color: '#D1FAE5',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 8,
    textAlign: 'center',
  },
});
