
import React from 'react';

import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Link } from 'expo-router';

import {
  Button,
  Divider,
  Text,
  useTheme,
} from 'react-native-paper';

export default function AboutScreen() {
  const theme = useTheme();
  const isDarkMode = theme.dark;

  // ======================================
  // EMERALD THEME COLORS
  // ======================================

  const colors = {
    background: isDarkMode ? '#0B1712' : '#F5FBF7',
    surface: isDarkMode ? '#064332' : '#FFFFFF',
    heading: isDarkMode ? '#D1FAE5' : '#14532D',
    text: isDarkMode ? '#A7F3D0' : '#166534',
    muted: isDarkMode ? '#86A99B' : '#729487',
    primary: isDarkMode ? '#34D399' : '#0D9488',
    divider: isDarkMode ? '#176B50' : '#B7E4C7',
  };

  return (
    <ScrollView
      style={[
        styles.screen,
        { backgroundColor: colors.background },
      ]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ABOUT LAKBAY PH */}

      <View
        style={[
          styles.introSection,
          {
            backgroundColor: colors.surface,
            borderColor: colors.divider,
          },
        ]}
      >
        
        <Text
          variant="headlineSmall"
          style={[
            styles.heading,
            { color: colors.heading },
          ]}
        >
          LAKBAY PH
        </Text>

        <Text
          variant="bodyMedium"
          style={[
            styles.description,
            { color: colors.text },
          ]}
        >
          LAKBAY PH is a Philippine Tourist Destination Guide
          built with React Native and Expo. It helps users
          discover beautiful places across the Philippines,
          explore tourist attractions, and view photographs
          of destinations from different provinces.
        </Text>
      </View>

      {/* HOW IT WORKS */}

      <View style={styles.section}>
        <Text
          variant="titleMedium"
          style={[
            styles.sectionTitle,
            { color: colors.heading },
          ]}
        >
          How It Works
        </Text>

        <Text
          variant="bodyMedium"
          style={[
            styles.sectionDescription,
            { color: colors.text },
          ]}
        >
          Explore 30 featured Philippine destinations and
          discover six tourist attractions for each destination.
          Search for places, explore destination information,
          and browse photographs of beautiful tourist spots.
          Select an attraction to view its image, location,
          description, and photographer information.
        </Text>
      </View>

      <Divider
        style={[
          styles.divider,
          { backgroundColor: colors.divider },
        ]}
      />

      {/* FEATURES */}

      <View style={styles.section}>
        <Text
          variant="titleMedium"
          style={[
            styles.sectionTitle,
            { color: colors.heading },
          ]}
        >
          Key Features
        </Text>

        <Text
          variant="bodyMedium"
          style={[
            styles.sectionDescription,
            { color: colors.text },
          ]}
        >
          • Philippine destination exploration{"\n"}
          • Tourist attraction guides and photographs{"\n"}
          • Destination search and location selection{"\n"}
          • Attraction details and photographer credits{"\n"}
          • Favorite destinations{"\n"}
          • Search history{"\n"}
          • Light and dark theme support{"\n"}
          • Responsive interface for different devices
        </Text>
      </View>

      <Divider
        style={[
          styles.divider,
          { backgroundColor: colors.divider },
        ]}
      />

      {/* BUILT WITH */}

      <View style={styles.section}>
        <Text
          variant="titleMedium"
          style={[
            styles.sectionTitle,
            { color: colors.heading },
          ]}
        >
          Built With
        </Text>

        <Text
          variant="bodyMedium"
          style={[
            styles.sectionDescription,
            { color: colors.text },
          ]}
        >
          React Native · Expo · Expo Router · React Native
          Paper · TypeScript · Axios · expo-image
        </Text>
      </View>

      <Divider
        style={[
          styles.divider,
          { backgroundColor: colors.divider },
        ]}
      />

      {/* DATA SOURCES */}

      <View style={styles.section}>
        <Text
          variant="titleMedium"
          style={[
            styles.sectionTitle,
            { color: colors.heading },
          ]}
        >
          Data Sources
        </Text>

        <Text
          variant="bodyMedium"
          style={[
            styles.sectionDescription,
            { color: colors.text },
          ]}
        >
          Philippine Standard Geographic Code (PSGC) API
          {"\n"}
          Pexels Image API
        </Text>
      </View>

      <Divider
        style={[
          styles.divider,
          { backgroundColor: colors.divider },
        ]}
      />

      {/* START EXPLORING */}

      <View style={styles.cta}>
        <Text
          variant="titleMedium"
          style={[
            styles.ctaTitle,
            { color: colors.heading },
          ]}
        >
          Ready to Explore?
        </Text>

        <Text
          variant="bodyMedium"
          style={[
            styles.ctaDescription,
            { color: colors.text },
          ]}
        >
          Discover the beauty of the Philippines with
          LAKBAY PH.
        </Text>

        <Link href="/" asChild>
          <Button
            mode="contained"
            icon="compass"
            buttonColor={colors.primary}
            textColor="#FFFFFF"
            style={styles.exploreButton}
            labelStyle={styles.buttonLabel}
            contentStyle={styles.buttonContent}
          >
            Start Exploring
          </Button>
        </Link>
      </View>

      {/* FOOTER */}

      <Text
        style={[
          styles.footer,
          { color: colors.muted },
        ]}
      >
        Discover the Philippines with LAKBAY PH.
      </Text>
    </ScrollView>
  );
}

// ======================================
// STYLES
// ======================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  content: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    padding: 20,
    paddingBottom: 40,
  },

  // INTRODUCTION

  introSection: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 22,
    marginBottom: 20,
  },

  flag: {
    fontSize: 30,
    marginBottom: 8,
  },

  heading: {
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 12,
  },

  description: {
    fontSize: 15,
    lineHeight: 25,
  },

  // SECTIONS

  section: {
    paddingVertical: 12,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 12,
  },

  sectionDescription: {
    fontSize: 14,
    lineHeight: 24,
  },

  divider: {
    height: 1,
    marginVertical: 12,
  },

  // CALL TO ACTION

  cta: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 12,
  },

  ctaTitle: {
    fontSize: 21,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },

  ctaDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 18,
  },

  exploreButton: {
    borderRadius: 14,
  },

  buttonLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  buttonContent: {
    paddingHorizontal: 18,
    paddingVertical: 5,
  },

  // FOOTER

  footer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});
