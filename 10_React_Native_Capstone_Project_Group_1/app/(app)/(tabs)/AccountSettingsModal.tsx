/**
 * Account Settings & Gear Button Module - Marketplace
 * Dedicated Settings button and responsive Account Settings hub:
 * 1. Account Settings (Account & Security, My Addresses, Bank Accounts / Cards, Privacy Settings, Appearance & Notifications, Delete Account, Logout, Marketplace v1.0.0 footer)
 * 2. Account & Security (My Profile, Login Info, Passkeys, Fingerprint Auth, Quick Login, Account Activity, Login Devices)
 * 3. My Addresses (Philippine PSGC Region/Province/City/Barangay picker & cart.tsx sync)
 * 4. Bank Accounts / Cards (Credit/Debit Cards, Bank Accounts, BPI & UnionBank OAuth linking)
 * 5. Privacy Settings, Appearance & Notifications, Permanent Account Deletion (blocks future login & re-registration), and Logout
 * Full-width edge-to-edge responsive layout across Website, Tablet, and Phones (Realme, Samsung, Xiaomi, OPPO, Vivo, iPhone).
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  StyleSheet,
  KeyboardAvoidingView,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Divider,
  TextInput,
  Title,
  IconButton,
  RadioButton,
  Switch,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../context/AuthContext';
import { useAppTheme, ThemePreference } from '../../../context/ThemeContext';

export const DELETED_ACCOUNTS_REGISTRY_KEY = '@marketplace_deleted_accounts_registry';

export interface DeletedAccountTombstone {
  id: string;
  username: string;
  email: string;
  phone: string;
  deletedAt: string;
}

/**
 * Helper you can also import inside AuthContext (login & register)
 * to block any deleted account from ever logging in or re-registering.
 */
export async function isAccountPermanentlyDeleted(identifier: {
  id?: string | number;
  username?: string;
  email?: string;
  phone?: string;
}): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(DELETED_ACCOUNTS_REGISTRY_KEY);
    if (!raw) return false;
    const list: DeletedAccountTombstone[] = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) return false;

    const normId = identifier.id !== undefined ? String(identifier.id).trim().toLowerCase() : '';
    const normUser = (identifier.username || '').trim().toLowerCase();
    const normEmail = (identifier.email || '').trim().toLowerCase();
    const normPhone = (identifier.phone || '').replace(/\s+/g, '').toLowerCase();

    return list.some((entry) => {
      if (normId && entry.id && entry.id.toLowerCase() === normId) return true;
      if (normUser && entry.username && entry.username.toLowerCase() === normUser) return true;
      if (normEmail && entry.email && entry.email.toLowerCase() === normEmail) return true;
      if (normPhone && entry.phone && entry.phone.replace(/\s+/g, '').toLowerCase() === normPhone) {
        return true;
      }
      return false;
    });
  } catch {
    return false;
  }
}

export interface SavedAddress {
  id: string;
  label: 'Home' | 'Work';
  fullName: string;
  phoneNumber: string;
  region: string;
  province: string;
  city: string;
  barangay: string;
  postalCode: string;
  streetDetails: string;
  deliveryInstructions?: string;
  isDefault: boolean;
}

interface PSGCItem {
  code: string;
  name: string;
  regionCode?: string;
  provinceCode?: string;
  districtCode?: string;
  typeLabel?: string;
}

interface LinkedCard {
  id: string;
  brand: 'Visa' | 'Mastercard' | 'JCB' | 'Amex';
  last4: string;
  holderName: string;
  expiry: string;
  isDefault: boolean;
  providerToken: string;
}

interface LinkedBankAccount {
  id: string;
  bankName: string;
  accountType: string;
  maskedAccount: string;
  status: 'Active' | 'Pending Verification';
  category: 'bank' | 'direct_link';
}

interface AccountActivityItem {
  id: string;
  event: string;
  timestamp: string;
  deviceType: string;
  clientInfo: string;
  location: string;
  suspicious?: boolean;
}

interface LoginDeviceItem {
  id: string;
  deviceName: string;
  deviceType: 'Mobile' | 'Tablet' | 'Desktop';
  lastActive: string;
  location: string;
  isCurrent: boolean;
}

export type SettingsRoute =
  | 'account_settings'
  | 'account_security'
  | 'edit_profile'
  | 'my_addresses'
  | 'address_form'
  | 'bank_cards'
  | 'add_card'
  | 'add_bank'
  | 'link_bank_oauth'
  | 'account_activity'
  | 'manage_devices';

interface AccountSettingsProps {
  palette: any;
  styles: any;
  isDesktop: boolean;
  isTablet: boolean;
  isMobile: boolean;
  visible: boolean;
  initialRoute: SettingsRoute;
  onOpenSettings: (route?: SettingsRoute) => void;
  onCloseSettings: () => void;
  onProfileDataUpdated?: () => void;
  onAccountDeleted?: () => void;
}

const PSGC_BASE = 'https://psgc.gitlab.io/api';

const DEFAULT_LA_TRINIDAD_ADDRESS: SavedAddress = {
  id: 'default-la-trinidad-1',
  label: 'Home',
  fullName: 'Marketplace User',
  phoneNumber: '+63 917 123 4567',
  region: 'Cordillera Administrative Region (CAR)',
  province: 'Benguet',
  city: 'La Trinidad',
  barangay: 'Balili',
  postalCode: '2601',
  streetDetails: 'Km. 5, Balili',
  deliveryInstructions: '',
  isDefault: true,
};

const formatCartDisplayAddress = (addr?: SavedAddress | null): string => {
  if (!addr) return 'Balili, La Trinidad, Benguet, Philippines';
  const parts = [addr.barangay, addr.city, addr.province, 'Philippines']
    .map((p) => (p || '').trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Balili, La Trinidad, Benguet, Philippines';
};

const maskPhoneNumber = (phone?: string): string => {
  if (!phone || !phone.trim()) return 'Set Now';
  const cleaned = phone.replace(/\s+/g, '');
  if (cleaned.length <= 4) return '****';
  const prefix = cleaned.startsWith('+63') ? '+63 9' : cleaned.slice(0, 2);
  const last2 = cleaned.slice(-2);
  return `${prefix}** *** **${last2}`;
};

const maskEmailAddress = (email?: string): string => {
  if (!email || !email.includes('@')) return 'Verify Now';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0] || '*'}***@${domain}`;
  return `${local.slice(0, 2)}${'*'.repeat(Math.min(5, Math.max(2, local.length - 2)))}@${domain}`;
};

/**
 * Reusable Gear Settings Button component for Profile header
 */
export function ProfileSettingsButton({
  palette,
  onPress,
}: {
  palette: any;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel="Account Settings"
      testID="profile-settings-gear-btn"
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: palette.isDark
          ? 'rgba(254, 44, 85, 0.18)'
          : 'rgba(254, 44, 85, 0.10)',
        borderWidth: 1,
        borderColor: 'rgba(254, 44, 85, 0.28)',
      }}
    >
      <MaterialCommunityIcons name="cog" size={16} color="#FE2C55" />
      <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#FE2C55' }}>Settings</Text>
    </TouchableOpacity>
  );
}

export default function AccountSettingsModal({
  palette,
  styles,
  isDesktop,
  isTablet,
  isMobile,
  visible,
  initialRoute,
  onCloseSettings,
  onProfileDataUpdated,
  onAccountDeleted,
}: AccountSettingsProps) {
  const {
    user,
    logout,
    isAuthenticated,
    updateUser,
    verifyCurrentUserPassword,
    updateCurrentUserPassword,
    permanentlyDeleteCurrentUser,
  } = useAuth();
  const { isDark, themePreference, setThemePreference, toggleDarkMode } = useAppTheme();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Responsive Breakpoint Derivations for Website (>=1024px), Tablet (768px-1023px) & Phones (<768px: Realme, iPhone, Samsung, Xiaomi, OPPO, Vivo)
  const resolvedDesktop = isDesktop || width >= 1024;
  const resolvedTablet = !resolvedDesktop && (isTablet || (width >= 768 && width < 1024));
  const resolvedMobile = !resolvedDesktop && !resolvedTablet;
  const isSmallPhone = width <= 375;

  const userPrefix = `@marketplace_user_${user?.id || 'guest'}`;
  const userKeys = {
    wishlist: `${userPrefix}_wishlist`,
    orders: `${userPrefix}_orders`,
    addresses: `${userPrefix}_addresses`,
    activeAddress: `${userPrefix}_address`,
    profileExtra: `${userPrefix}_profile_extra`,
    cart: `${userPrefix}_cart`,
    privacy: `${userPrefix}_privacy`,
    savedForLater: `${userPrefix}_saved_for_later`,
    securityPrefs: `${userPrefix}_security_prefs`,
    linkedCards: `${userPrefix}_linked_cards`,
    linkedBanks: `${userPrefix}_linked_banks`,
    activityLog: `${userPrefix}_activity_log`,
    loginDevices: `${userPrefix}_login_devices`,
    bonusCenter: `${userPrefix}_bonus_center`,
    coupons: `${userPrefix}_coupons`,
    notifications: `${userPrefix}_notifications`,
    paylater: `${userPrefix}_paylater`,
  };

  // Navigation Stack & Scroll Preservation
  const [settingsStack, setSettingsStack] = useState<SettingsRoute[]>(['account_settings']);
  const [settingsBanner, setSettingsBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const navLockRef = useRef(false);
  const settingsScrollRef = useRef<ScrollView | null>(null);
  const scrollPositionsRef = useRef<Record<string, number>>({});
  const currentScrollYRef = useRef(0);

  const currentSettingsRoute: SettingsRoute =
    settingsStack[settingsStack.length - 1] || 'account_settings';

  useEffect(() => {
    if (visible) {
      setSettingsBanner(null);
      setSettingsStack(
        initialRoute === 'account_settings'
          ? ['account_settings']
          : ['account_settings', initialRoute]
      );
      if (psgcRegions.length === 0) fetchPsgcRegions();
      preloadPsgcSearchIndex();
    }
  }, [visible, initialRoute]);

  const navigateSettings = (nextRoute: SettingsRoute) => {
    if (navLockRef.current) return;
    if (currentSettingsRoute === nextRoute) return;
    navLockRef.current = true;
    scrollPositionsRef.current[currentSettingsRoute] = currentScrollYRef.current;
    setSettingsBanner(null);
    setSettingsStack((prev) => [...prev, nextRoute]);
    setTimeout(() => {
      settingsScrollRef.current?.scrollTo({ y: 0, animated: false });
      navLockRef.current = false;
    }, 120);
  };

  const handleSettingsBack = () => {
    setSettingsBanner(null);
    if (settingsStack.length <= 1) {
      setSettingsStack(['account_settings']);
      onCloseSettings();
      return;
    }
    const nextStack = settingsStack.slice(0, -1);
    const prevRoute = nextStack[nextStack.length - 1];
    setSettingsStack(nextStack);
    setTimeout(() => {
      const savedY = scrollPositionsRef.current[prevRoute] || 0;
      settingsScrollRef.current?.scrollTo({ y: savedY, animated: false });
    }, 60);
  };

  // Privacy Settings State
  const [privacySettingsVisible, setPrivacySettingsVisible] = useState(false);
  const [profilePublic, setProfilePublic] = useState(true);
  const [shareOrderActivity, setShareOrderActivity] = useState(false);
  const [personalizedAds, setPersonalizedAds] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  // Appearance & Notifications State
  const [appSettingsVisible, setAppSettingsVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Permanent Delete Account Modal State
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  // Profile & Security State
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | ''>('');
  const [birthday, setBirthday] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [updatingUser, setUpdatingUser] = useState(false);

  // Field Editor Sub-Modal
  const [fieldEditorModal, setFieldEditorModal] = useState<
    null | 'name' | 'bio' | 'gender' | 'birthday' | 'phone' | 'email' | 'username'
  >(null);
  const [tempFirstName, setTempFirstName] = useState('');
  const [tempLastName, setTempLastName] = useState('');
  const [tempBio, setTempBio] = useState('');
  const [tempGender, setTempGender] = useState<'Male' | 'Female' | 'Other' | ''>('');
  const [tempBirthYear, setTempBirthYear] = useState('1998');
  const [tempBirthMonth, setTempBirthMonth] = useState('06');
  const [tempBirthDay, setTempBirthDay] = useState('15');
  const [tempPhone, setTempPhone] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [tempUsername, setTempUsername] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtpDemo, setGeneratedOtpDemo] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  // Password, Biometrics, Passkeys, Quick Login
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [fingerprintEnabled, setFingerprintEnabled] = useState(false);
  const [quickLoginEnabled, setQuickLoginEnabled] = useState(false);
  const [passkeyRegistered, setPasskeyRegistered] = useState(false);
  const [passkeyLabel, setPasskeyLabel] = useState('');

  // Identity Verification Prompt
  const [identityVerifyModal, setIdentityVerifyModal] = useState(false);
  const [identityPasswordInput, setIdentityPasswordInput] = useState('');
  const [pendingSensitiveAction, setPendingSensitiveAction] = useState<(() => void) | null>(null);
  const [verifyingIdentity, setVerifyingIdentity] = useState(false);

  // Activity Log & Login Devices
  const [accountActivities, setAccountActivities] = useState<AccountActivityItem[]>([]);
  const [loginDevices, setLoginDevices] = useState<LoginDeviceItem[]>([]);

  // Bank Accounts & Cards
  const [linkedCards, setLinkedCards] = useState<LinkedCard[]>([]);
  const [linkedBanks, setLinkedBanks] = useState<LinkedBankAccount[]>([]);
  const [newCardBrand, setNewCardBrand] = useState<'Visa' | 'Mastercard' | 'JCB' | 'Amex'>('Visa');
  const [newCardLast4, setNewCardLast4] = useState('');
  const [newCardHolder, setNewCardHolder] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardDefault, setNewCardDefault] = useState(true);

  const [selectedBankInstitution, setSelectedBankInstitution] = useState('BDO Unibank');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [bankLast4Digits, setBankLast4Digits] = useState('');
  const [oauthTargetBank, setOauthTargetBank] = useState<'BPI' | 'UnionBank'>('BPI');
  const [oauthConsentChecked, setOauthConsentChecked] = useState(true);

  // Philippine PSGC Addresses
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  const [addrLabel, setAddrLabel] = useState<'Home' | 'Work'>('Home');
  const [addrFullName, setAddrFullName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrRegion, setAddrRegion] = useState('');
  const [addrProvince, setAddrProvince] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrBarangay, setAddrBarangay] = useState('');
  const [addrPostalCode, setAddrPostalCode] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrInstructions, setAddrInstructions] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(false);

  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [pickerStep, setPickerStep] = useState<'region' | 'province' | 'city' | 'barangay'>('region');
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [loadingPsgc, setLoadingPsgc] = useState(false);
  const [locatingCurrent, setLocatingCurrent] = useState(false);

  const [psgcRegions, setPsgcRegions] = useState<PSGCItem[]>([]);
  const [psgcProvinces, setPsgcProvinces] = useState<PSGCItem[]>([]);
  const [psgcCities, setPsgcCities] = useState<PSGCItem[]>([]);
  const [psgcBarangays, setPsgcBarangays] = useState<PSGCItem[]>([]);
  const [allPsgcCitiesCache, setAllPsgcCitiesCache] = useState<PSGCItem[]>([]);
  const [allPsgcDistrictsCache, setAllPsgcDistrictsCache] = useState<PSGCItem[]>([]);

  const [tempRegion, setTempRegion] = useState<PSGCItem | null>(null);
  const [tempProvince, setTempProvince] = useState<PSGCItem | null>(null);
  const [tempCity, setTempCity] = useState<PSGCItem | null>(null);

  const webGlassStyle: any =
    Platform.OS === 'web'
      ? { backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }
      : {};

  const webAmbientBackdropStyle: any =
    Platform.OS === 'web'
      ? {
          backgroundImage: palette.isDark
            ? 'radial-gradient(circle at 12% 10%, rgba(254, 44, 85, 0.22), transparent 42%), radial-gradient(circle at 88% 16%, rgba(59, 130, 246, 0.20), transparent 44%), radial-gradient(circle at 50% 85%, rgba(16, 185, 129, 0.15), transparent 46%), linear-gradient(135deg, #0B1120 0%, #111827 50%, #17152B 100%)'
            : 'radial-gradient(circle at 10% 8%, rgba(254, 44, 85, 0.16), transparent 42%), radial-gradient(circle at 90% 14%, rgba(56, 189, 248, 0.20), transparent 44%), radial-gradient(circle at 18% 82%, rgba(168, 85, 247, 0.12), transparent 44%), radial-gradient(circle at 84% 86%, rgba(251, 146, 60, 0.14), transparent 46%), linear-gradient(135deg, #F8FAFC 0%, #EEF4FF 48%, #FFF3F6 100%)',
        }
      : {};

  const webPrimaryButtonGradient: any =
    Platform.OS === 'web'
      ? {
          backgroundImage: 'linear-gradient(90deg, #FE2C55 0%, #FF5E7E 100%)',
          boxShadow: '0 8px 20px rgba(254, 44, 85, 0.28)',
        }
      : {};

  const glassShadow: any =
    Platform.OS === 'web'
      ? { boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)' }
      : {
          elevation: 3,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
        };

  const renderAmbientOrbs = () => (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { overflow: 'hidden', zIndex: 0 }]}>
      <View
        style={{
          position: 'absolute',
          top: -125,
          left: -95,
          width: 350,
          height: 350,
          borderRadius: 999,
          backgroundColor: palette.isDark
            ? 'rgba(254, 44, 85, 0.16)'
            : 'rgba(254, 44, 85, 0.11)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 20,
          right: -115,
          width: 320,
          height: 320,
          borderRadius: 999,
          backgroundColor: palette.isDark
            ? 'rgba(59, 130, 246, 0.16)'
            : 'rgba(56, 189, 248, 0.14)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: '38%',
          left: '16%',
          width: 370,
          height: 370,
          borderRadius: 999,
          backgroundColor: palette.isDark
            ? 'rgba(139, 92, 246, 0.12)'
            : 'rgba(168, 85, 247, 0.08)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 65,
          left: -100,
          width: 290,
          height: 290,
          borderRadius: 999,
          backgroundColor: palette.isDark
            ? 'rgba(14, 165, 233, 0.12)'
            : 'rgba(251, 146, 60, 0.10)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: -100,
          right: -85,
          width: 330,
          height: 330,
          borderRadius: 999,
          backgroundColor: palette.isDark
            ? 'rgba(16, 185, 129, 0.12)'
            : 'rgba(99, 102, 241, 0.10)',
        }}
      />
    </View>
  );

  const showMessage = (title: string, message: string, onOk?: () => void) => {
    const webWin = (globalThis as any).window;
    if (Platform.OS === 'web' && webWin?.alert) {
      webWin.alert(`${title}\n\n${message}`);
      if (onOk) onOk();
    } else {
      Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
    }
  };

  const confirmAction = (title: string, message: string, onConfirm: () => void) => {
    const webWin = (globalThis as any).window;
    if (Platform.OS === 'web' && webWin?.confirm) {
      if (webWin.confirm(`${title}\n\n${message}`)) {
        onConfirm();
      }
    } else {
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', style: 'destructive', onPress: onConfirm },
      ]);
    }
  };

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setUsername(user.username || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setEmailVerified(Boolean(user.email));
      setPhoneVerified(Boolean(user.phone));
      loadAllSettingsData();
    }
  }, [user]);

  const loadAllSettingsData = async () => {
    try {
      const [extraRaw, secRaw, cardsRaw, banksRaw, actRaw, devRaw, addrRaw, privRaw] =
        await Promise.all([
          AsyncStorage.getItem(userKeys.profileExtra),
          AsyncStorage.getItem(userKeys.securityPrefs),
          AsyncStorage.getItem(userKeys.linkedCards),
          AsyncStorage.getItem(userKeys.linkedBanks),
          AsyncStorage.getItem(userKeys.activityLog),
          AsyncStorage.getItem(userKeys.loginDevices),
          AsyncStorage.getItem(userKeys.addresses),
          AsyncStorage.getItem(userKeys.privacy),
        ]);

      if (privRaw) {
        const parsedPriv = JSON.parse(privRaw);
        setProfilePublic(parsedPriv.profilePublic ?? true);
        setShareOrderActivity(parsedPriv.shareOrderActivity ?? false);
        setPersonalizedAds(parsedPriv.personalizedAds ?? true);
        setTwoFactorAuth(parsedPriv.twoFactorAuth ?? false);
      }

      if (extraRaw) {
        const parsed = JSON.parse(extraRaw);
        if (parsed.bio !== undefined) setBio(parsed.bio);
        if (parsed.gender !== undefined) setGender(parsed.gender);
        if (parsed.birthday !== undefined) setBirthday(parsed.birthday);
        if (parsed.phoneVerified !== undefined) setPhoneVerified(parsed.phoneVerified);
        if (parsed.emailVerified !== undefined) setEmailVerified(parsed.emailVerified);
      }

      if (secRaw) {
        const parsed = JSON.parse(secRaw);
        setFingerprintEnabled(Boolean(parsed.fingerprintEnabled));
        setQuickLoginEnabled(Boolean(parsed.quickLoginEnabled));
        setPasskeyRegistered(Boolean(parsed.passkeyRegistered));
        setPasskeyLabel(parsed.passkeyLabel || '');
      }

      if (cardsRaw) setLinkedCards(JSON.parse(cardsRaw));
      if (banksRaw) setLinkedBanks(JSON.parse(banksRaw));

      if (actRaw) {
        setAccountActivities(JSON.parse(actRaw));
      } else {
        const defaultActivity: AccountActivityItem[] = [
          {
            id: 'act-init-1',
            event: 'Signed in to Marketplace',
            timestamp: new Date().toLocaleString(),
            deviceType: resolvedDesktop ? 'Desktop Browser' : resolvedTablet ? 'Tablet' : 'Mobile Phone',
            clientInfo: Platform.OS === 'web' ? 'Web Browser' : `Marketplace Mobile (${Platform.OS})`,
            location: 'Philippines',
            suspicious: false,
          },
        ];
        setAccountActivities(defaultActivity);
        await AsyncStorage.setItem(userKeys.activityLog, JSON.stringify(defaultActivity));
      }

      if (devRaw) {
        setLoginDevices(JSON.parse(devRaw));
      } else {
        const currentDev: LoginDeviceItem[] = [
          {
            id: 'dev-current',
            deviceName:
              Platform.OS === 'web'
                ? 'Current Web Session'
                : Platform.OS === 'ios'
                ? 'iPhone / iPad'
                : 'Android Device',
            deviceType: resolvedDesktop ? 'Desktop' : resolvedTablet ? 'Tablet' : 'Mobile',
            lastActive: 'Active now',
            location: 'Philippines',
            isCurrent: true,
          },
        ];
        setLoginDevices(currentDev);
        await AsyncStorage.setItem(userKeys.loginDevices, JSON.stringify(currentDev));
      }

      if (addrRaw) {
        const parsedAddrs = JSON.parse(addrRaw);
        if (Array.isArray(parsedAddrs) && parsedAddrs.length > 0) {
          setAddresses(parsedAddrs);
          return;
        }
      }

      const initialAddr: SavedAddress[] = [
        {
          ...DEFAULT_LA_TRINIDAD_ADDRESS,
          fullName:
            user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`
              : user?.username || 'Marketplace User',
        },
      ];
      setAddresses(initialAddr);
      await persistAddresses(initialAddr);
    } catch (err) {
      console.error('Failed to load account settings data:', err);
    }
  };

  // ==================== PRIVACY SETTINGS HANDLER ====================
  const savePrivacySettings = async (updated: {
    profilePublic?: boolean;
    shareOrderActivity?: boolean;
    personalizedAds?: boolean;
    twoFactorAuth?: boolean;
  }) => {
    try {
      const next = {
        profilePublic: updated.profilePublic ?? profilePublic,
        shareOrderActivity: updated.shareOrderActivity ?? shareOrderActivity,
        personalizedAds: updated.personalizedAds ?? personalizedAds,
        twoFactorAuth: updated.twoFactorAuth ?? twoFactorAuth,
      };
      setProfilePublic(next.profilePublic);
      setShareOrderActivity(next.shareOrderActivity);
      setPersonalizedAds(next.personalizedAds);
      setTwoFactorAuth(next.twoFactorAuth);
      await AsyncStorage.setItem(userKeys.privacy, JSON.stringify(next));
      await logSecurityEvent('Updated privacy settings');
    } catch (err) {
      console.error('Failed to save privacy settings:', err);
    }
  };

  // ==================== LOGOUT HANDLER ====================
  const handleLogout = () => {
    confirmAction('Logout', 'Are you sure you want to logout?', async () => {
      setSettingsStack(['account_settings']);
      onCloseSettings();
      await logout();
      router.replace('/(auth)/login' as any);
    });
  };

  // ==================== PERMANENT DELETE ACCOUNT HANDLER (BLOCKS FUTURE LOGIN & REGISTRATION) ====================
  const openDeleteAccountDialog = () => {
    setDeleteErrorMessage(null);
    setDeleteAccountModalVisible(true);
  };

  const recordDeletedAccountTombstone = async () => {
    if (!user) return;
    const targetId = String(user.id || '').trim().toLowerCase();
    const targetUsername = (user.username || username || '').trim().toLowerCase();
    const targetEmail = (user.email || email || '').trim().toLowerCase();
    const targetPhone = (user.phone || phone || '').replace(/\s+/g, '').toLowerCase();

    // 1. Add permanent tombstone so this account can NEVER log in or re-register again
    const existingRaw = await AsyncStorage.getItem(DELETED_ACCOUNTS_REGISTRY_KEY);
    const existingList: DeletedAccountTombstone[] = existingRaw ? JSON.parse(existingRaw) : [];
    const alreadyExists = existingList.some(
      (item) =>
        (targetId && item.id === targetId) ||
        (targetUsername && item.username === targetUsername) ||
        (targetEmail && item.email === targetEmail)
    );

    if (!alreadyExists) {
      const updatedTombstones: DeletedAccountTombstone[] = [
        {
          id: targetId,
          username: targetUsername,
          email: targetEmail,
          phone: targetPhone,
          deletedAt: new Date().toISOString(),
        },
        ...existingList,
      ];
      await AsyncStorage.setItem(
        DELETED_ACCOUNTS_REGISTRY_KEY,
        JSON.stringify(updatedTombstones)
      );
    }

    // 2. Scrub user record from any local registered user directory keys so login/register lookups cannot authenticate it
    const candidateUserDirectoryKeys = [
      '@marketplace_registered_users',
      '@marketplace_users',
      '@marketplace_accounts',
      '@marketplace_auth_users',
      'registered_users',
      'users',
    ];

    for (const dirKey of candidateUserDirectoryKeys) {
      try {
        const dirRaw = await AsyncStorage.getItem(dirKey);
        if (!dirRaw) continue;
        const parsed = JSON.parse(dirRaw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((u: any) => {
            const uId = String(u?.id || '').trim().toLowerCase();
            const uName = String(u?.username || '').trim().toLowerCase();
            const uEmail = String(u?.email || '').trim().toLowerCase();
            const uPhone = String(u?.phone || '').replace(/\s+/g, '').toLowerCase();
            if (targetId && uId && uId === targetId) return false;
            if (targetUsername && uName && uName === targetUsername) return false;
            if (targetEmail && uEmail && uEmail === targetEmail) return false;
            if (targetPhone && uPhone && uPhone === targetPhone) return false;
            return true;
          });
          await AsyncStorage.setItem(dirKey, JSON.stringify(filtered));
        }
      } catch {
        // Continue scrubbing remaining keys
      }
    }
  };

  const handlePermanentlyDeleteAccount = async () => {
    if (!isAuthenticated || !user) {
      setDeleteErrorMessage('Unauthorized request. Please sign in again.');
      return;
    }

    setDeletingAccount(true);
    setDeleteErrorMessage(null);

    try {
      // 1. Permanently blacklist credentials (username, email, phone, id) from login & re-registration
      await recordDeletedAccountTombstone();

      // 2. Remove all user-scoped storage, saved session tokens, and quick-login records
      await AsyncStorage.multiRemove([
        userKeys.wishlist,
        userKeys.orders,
        userKeys.addresses,
        userKeys.activeAddress,
        userKeys.profileExtra,
        userKeys.cart,
        userKeys.privacy,
        userKeys.savedForLater,
        userKeys.securityPrefs,
        userKeys.linkedCards,
        userKeys.linkedBanks,
        userKeys.activityLog,
        userKeys.loginDevices,
        userKeys.bonusCenter,
        userKeys.coupons,
        userKeys.notifications,
        userKeys.paylater,
        '@marketplace_wishlist',
        '@marketplace_addresses',
        '@marketplace_active_address',
        '@marketplace_user_profile',
        '@marketplace_cart',
        '@marketplace_auth_user',
        '@marketplace_current_user',
        '@marketplace_token',
        '@marketplace_session',
        '@marketplace_quick_login_user',
      ]).catch(() => null);

      // 3. Execute AuthContext permanent account deletion
      const result = await permanentlyDeleteCurrentUser();

      if (!result.success) {
        await logout();
      }

      setDeleteAccountModalVisible(false);
      setSettingsStack(['account_settings']);
      onCloseSettings();
      if (onAccountDeleted) onAccountDeleted();

      router.replace('/(auth)/login' as any);
    } catch (error) {
      console.error('Account deletion failed:', error);
      setDeleteErrorMessage('Unable to delete your account at this time. Please try again.');
    } finally {
      setDeletingAccount(false);
    }
  };

  const logSecurityEvent = async (eventTitle: string, suspicious = false) => {
    try {
      const deviceTypeLabel = resolvedDesktop
        ? 'Desktop Browser'
        : resolvedTablet
        ? 'Tablet'
        : 'Mobile Phone';
      const primary = addresses.find((a) => a.isDefault) || addresses[0];
      const newEntry: AccountActivityItem = {
        id: `act-${Date.now()}`,
        event: eventTitle,
        timestamp: new Date().toLocaleString(),
        deviceType: deviceTypeLabel,
        clientInfo: Platform.OS === 'web' ? 'Web Client · Marketplace' : `Expo App (${Platform.OS})`,
        location: formatCartDisplayAddress(primary),
        suspicious,
      };
      setAccountActivities((prev) => {
        const updated = [newEntry, ...prev].slice(0, 30);
        AsyncStorage.setItem(userKeys.activityLog, JSON.stringify(updated)).catch(() => null);
        return updated;
      });
    } catch {
      // Ignore logging error
    }
  };

  const requireIdentityVerification = (actionCallback: () => void) => {
    setIdentityPasswordInput('');
    setPendingSensitiveAction(() => actionCallback);
    setIdentityVerifyModal(true);
  };

  const handleConfirmIdentityVerification = async () => {
    if (!identityPasswordInput.trim()) {
      showMessage('Verification Required', 'Please enter your current password to continue.');
      return;
    }
    setVerifyingIdentity(true);
    try {
      const valid = await verifyCurrentUserPassword(identityPasswordInput);
      if (!valid) {
        await logSecurityEvent('Failed identity verification attempt', true);
        showMessage('Verification Failed', 'Incorrect password. Identity could not be verified.');
        return;
      }
      setIdentityVerifyModal(false);
      setIdentityPasswordInput('');
      const fn = pendingSensitiveAction;
      setPendingSensitiveAction(null);
      if (fn) fn();
    } finally {
      setVerifyingIdentity(false);
    }
  };

  const syncActiveAddressToCartStorage = async (list: SavedAddress[]) => {
    const primary = list.find((a) => a.isDefault) || list[0] || DEFAULT_LA_TRINIDAD_ADDRESS;
    const formatted = formatCartDisplayAddress(primary);
    await Promise.all([
      AsyncStorage.setItem(userKeys.activeAddress, formatted),
      AsyncStorage.setItem('@marketplace_active_address', formatted),
      AsyncStorage.setItem(
        userKeys.profileExtra,
        JSON.stringify({
          address: formatted,
          selectedAddress: primary,
          bio,
          gender,
          birthday,
          phoneVerified,
          emailVerified,
        })
      ),
      AsyncStorage.setItem(
        '@marketplace_user_profile',
        JSON.stringify({
          address: formatted,
          selectedAddress: primary,
        })
      ),
    ]);
    if (onProfileDataUpdated) onProfileDataUpdated();
  };

  const persistAddresses = async (updatedList: SavedAddress[]) => {
    setAddresses(updatedList);
    await AsyncStorage.setItem(userKeys.addresses, JSON.stringify(updatedList));
    await AsyncStorage.setItem('@marketplace_addresses', JSON.stringify(updatedList));
    await syncActiveAddressToCartStorage(updatedList);
  };

  const handleSetDefaultAddress = async (id: string) => {
    const updated = addresses.map((item) => ({
      ...item,
      isDefault: item.id === id,
    }));
    await persistAddresses(updated);
    setSettingsBanner({
      type: 'success',
      text: 'Default delivery address updated and synced with Cart.',
    });
  };

  const resetAddressForm = () => {
    setEditingAddressId(null);
    setAddrLabel('Home');
    setAddrFullName(
      user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || ''
    );
    setAddrPhone(user?.phone || '');
    setAddrRegion('');
    setAddrProvince('');
    setAddrCity('');
    setAddrBarangay('');
    setAddrPostalCode('');
    setAddrStreet('');
    setAddrInstructions('');
    setAddrIsDefault(addresses.length === 0);
  };

  const openNewAddressForm = () => {
    resetAddressForm();
    if (psgcRegions.length === 0) fetchPsgcRegions();
    preloadPsgcSearchIndex();
    navigateSettings('address_form');
  };

  const openEditAddressForm = (addr: SavedAddress) => {
    setEditingAddressId(addr.id);
    setAddrLabel(addr.label);
    setAddrFullName(addr.fullName);
    setAddrPhone(addr.phoneNumber);
    setAddrRegion(addr.region);
    setAddrProvince(addr.province);
    setAddrCity(addr.city);
    setAddrBarangay(addr.barangay);
    setAddrPostalCode(addr.postalCode);
    setAddrStreet(addr.streetDetails);
    setAddrInstructions(addr.deliveryInstructions || '');
    setAddrIsDefault(addr.isDefault);
    navigateSettings('address_form');
  };

  const handleSubmitAddress = async () => {
    if (!addrFullName.trim() || !addrPhone.trim() || !addrStreet.trim()) {
      showMessage('Missing Fields', 'Please enter recipient name, phone number, and street address.');
      return;
    }
    if (!addrRegion || !addrProvince || !addrCity || !addrBarangay) {
      showMessage('Incomplete Location', 'Please select Region, Province, City, and Barangay.');
      return;
    }
    if (!addrPostalCode.trim()) {
      showMessage('Missing Postal Code', 'Please enter a postal code.');
      return;
    }

    const newRecord: SavedAddress = {
      id: editingAddressId || `addr-${Date.now()}`,
      label: addrLabel,
      fullName: addrFullName.trim(),
      phoneNumber: addrPhone.trim(),
      region: addrRegion,
      province: addrProvince,
      city: addrCity,
      barangay: addrBarangay,
      postalCode: addrPostalCode.trim(),
      streetDetails: addrStreet.trim(),
      deliveryInstructions: addrInstructions.trim(),
      isDefault: addrIsDefault || addresses.length === 0,
    };

    let updated = editingAddressId
      ? addresses.map((item) => (item.id === editingAddressId ? newRecord : item))
      : [newRecord, ...addresses];

    if (newRecord.isDefault) {
      updated = updated.map((item) => ({
        ...item,
        isDefault: item.id === newRecord.id,
      }));
    } else if (!updated.some((item) => item.isDefault) && updated.length > 0) {
      updated[0].isDefault = true;
    }

    await persistAddresses(updated);
    await logSecurityEvent(editingAddressId ? 'Updated delivery address' : 'Added new delivery address');
    resetAddressForm();
    handleSettingsBack();
    setSettingsBanner({
      type: 'success',
      text: editingAddressId
        ? 'Delivery address updated and synced with checkout.'
        : 'New delivery address saved and synced with checkout.',
    });
  };

  const handleDeleteAddress = (id: string, label: string) => {
    confirmAction('Delete Address', `Remove "${label}" from your saved addresses?`, async () => {
      let updated = addresses.filter((a) => a.id !== id);
      if (updated.length > 0 && !updated.some((a) => a.isDefault)) {
        updated[0].isDefault = true;
      }
      await persistAddresses(updated);
      await logSecurityEvent(`Deleted saved address (${label})`);
      if (currentSettingsRoute === 'address_form') {
        resetAddressForm();
        handleSettingsBack();
      }
      setSettingsBanner({ type: 'success', text: 'Address removed.' });
    });
  };

  // PSGC Geographic Fetching
  const preloadPsgcSearchIndex = async () => {
    try {
      if (allPsgcCitiesCache.length === 0) {
        const res = await fetch(`${PSGC_BASE}/cities-municipalities/`);
        if (res.ok) {
          const data = await res.json();
          setAllPsgcCitiesCache(
            data.map((c: any) => ({
              code: c.code,
              name: c.name,
              regionCode: c.regionCode,
              provinceCode: c.provinceCode,
              districtCode: c.districtCode,
              typeLabel: c.isCity ? 'City' : 'Municipality',
            }))
          );
        }
      }
      if (allPsgcDistrictsCache.length === 0) {
        const distRes = await fetch(`${PSGC_BASE}/districts/`);
        if (distRes.ok) {
          const distData = await distRes.json();
          setAllPsgcDistrictsCache(
            distData.map((d: any) => ({
              code: d.code,
              name: d.name,
              regionCode: d.regionCode,
              typeLabel: 'District',
            }))
          );
        }
      }
    } catch {
      // Ignore preload error
    }
  };

  const fetchPsgcRegions = async (): Promise<PSGCItem[]> => {
    setLoadingPsgc(true);
    try {
      const res = await fetch(`${PSGC_BASE}/regions/`);
      const data = await res.json();
      const formatted: PSGCItem[] = data.map((r: any) => ({
        code: r.code,
        name: r.regionName ? `${r.name} (${r.regionName})` : r.name,
        typeLabel: 'Region',
      }));
      setPsgcRegions(formatted);
      return formatted;
    } catch {
      return [];
    } finally {
      setLoadingPsgc(false);
    }
  };

  const fetchPsgcProvincesOrDistricts = async (region: PSGCItem) => {
    setLoadingPsgc(true);
    setPsgcProvinces([]);
    try {
      const isNCR = region.code === '130000000';
      const endpoint = isNCR
        ? `${PSGC_BASE}/regions/${region.code}/districts/`
        : `${PSGC_BASE}/regions/${region.code}/provinces/`;
      const res = await fetch(endpoint);
      const data = await res.json();
      const formatted: PSGCItem[] = data.map((p: any) => ({
        code: p.code,
        name: p.name,
        regionCode: region.code,
        typeLabel: isNCR ? 'District' : 'Province',
      }));
      setPsgcProvinces(
        formatted.length === 0
          ? [{ code: region.code, name: region.name, regionCode: region.code, typeLabel: 'Independent Area' }]
          : formatted
      );
    } finally {
      setLoadingPsgc(false);
    }
  };

  const fetchPsgcCitiesMunicipalities = async (provinceOrDistrict: PSGCItem) => {
    setLoadingPsgc(true);
    setPsgcCities([]);
    try {
      const isDistrict =
        provinceOrDistrict.typeLabel === 'District' ||
        provinceOrDistrict.regionCode === '130000000';
      const endpoint = isDistrict
        ? `${PSGC_BASE}/districts/${provinceOrDistrict.code}/cities-municipalities/`
        : `${PSGC_BASE}/provinces/${provinceOrDistrict.code}/cities-municipalities/`;
      const res = await fetch(endpoint);
      const data = await res.json();
      setPsgcCities(
        data.map((c: any) => ({
          code: c.code,
          name: c.name,
          regionCode: provinceOrDistrict.regionCode,
          provinceCode: provinceOrDistrict.code,
          typeLabel: c.isCity ? 'City' : 'Municipality',
        }))
      );
    } finally {
      setLoadingPsgc(false);
    }
  };

  const fetchPsgcBarangays = async (city: PSGCItem) => {
    setLoadingPsgc(true);
    setPsgcBarangays([]);
    try {
      const res = await fetch(`${PSGC_BASE}/cities-municipalities/${city.code}/barangays/`);
      const data = await res.json();
      setPsgcBarangays(
        data.map((b: any) => ({
          code: b.code,
          name: b.name,
          typeLabel: 'Barangay',
        }))
      );
    } finally {
      setLoadingPsgc(false);
    }
  };

  const openLocationPicker = async () => {
    setPickerStep('region');
    setLocationSearchQuery('');
    setTempRegion(null);
    setTempProvince(null);
    setTempCity(null);
    setLocationPickerVisible(true);
    if (psgcRegions.length === 0) await fetchPsgcRegions();
    preloadPsgcSearchIndex();
  };

  const handleSelectSearchedLocation = async (item: PSGCItem) => {
    setLocationSearchQuery('');
    let regionsList = psgcRegions.length === 0 ? await fetchPsgcRegions() : psgcRegions;
    const matchedRegion =
      regionsList.find((r) => r.code === item.regionCode) || {
        code: item.regionCode || '140000000',
        name: 'Cordillera Administrative Region (CAR)',
        typeLabel: 'Region',
      };
    setTempRegion(matchedRegion);

    if (item.typeLabel === 'District') {
      setTempProvince(item);
      setPickerStep('city');
      await fetchPsgcCitiesMunicipalities(item);
      return;
    }

    const provCode = item.provinceCode || item.districtCode;
    let matchedProv: PSGCItem = {
      code: provCode || '141100000',
      name: 'Benguet',
      regionCode: matchedRegion.code,
      typeLabel: item.districtCode ? 'District' : 'Province',
    };

    if (provCode) {
      try {
        const endpoint = item.districtCode
          ? `${PSGC_BASE}/districts/${provCode}/`
          : `${PSGC_BASE}/provinces/${provCode}/`;
        const pRes = await fetch(endpoint);
        if (pRes.ok) {
          const pData = await pRes.json();
          matchedProv = {
            code: pData.code,
            name: pData.name,
            regionCode: matchedRegion.code,
            typeLabel: item.districtCode ? 'District' : 'Province',
          };
        }
      } catch {
        // Fallback retained
      }
    }

    setTempProvince(matchedProv);
    setTempCity(item);
    setPickerStep('barangay');
    await fetchPsgcBarangays(item);
  };

  const handleUseCurrentLocation = () => {
    setLocatingCurrent(true);
    const apply = (reg: string, prov: string, city: string, brgy: string, postal: string) => {
      setAddrRegion(reg);
      setAddrProvince(prov);
      setAddrCity(city);
      setAddrBarangay(brgy);
      if (postal) setAddrPostalCode(postal);
      setLocatingCurrent(false);
      setLocationPickerVisible(false);
    };

    const webNav = (globalThis as any).navigator;
    if (Platform.OS === 'web' && webNav?.geolocation) {
      webNav.geolocation.getCurrentPosition(
        async (pos: any) => {
          try {
            const { latitude, longitude } = pos.coords;
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const geoData = await geoRes.json();
            const addr = geoData?.address || {};
            apply(
              addr.region || 'Cordillera Administrative Region (CAR)',
              addr.province || addr.state || 'Benguet',
              addr.city || addr.town || addr.municipality || 'La Trinidad',
              addr.suburb || addr.neighbourhood || 'Balili',
              addr.postcode || '2601'
            );
          } catch {
            apply('Cordillera Administrative Region (CAR)', 'Benguet', 'La Trinidad', 'Balili', '2601');
          }
        },
        () => apply('Cordillera Administrative Region (CAR)', 'Benguet', 'La Trinidad', 'Balili', '2601'),
        { timeout: 6000 }
      );
    } else {
      apply('Cordillera Administrative Region (CAR)', 'Benguet', 'La Trinidad', 'Balili', '2601');
    }
  };

  const getPsgcSearchMatches = (query: string): PSGCItem[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return [
      ...psgcRegions.filter((r) => r.name.toLowerCase().includes(q)),
      ...allPsgcDistrictsCache.filter((d) => d.name.toLowerCase().includes(q)),
      ...allPsgcCitiesCache.filter((c) => c.name.toLowerCase().includes(q)),
    ].slice(0, 20);
  };

  const pickerPsgcMatches = getPsgcSearchMatches(locationSearchQuery);

  // Edit Profile Field Handlers
  const persistExtraProfileMetadata = async (overrides?: {
    bio?: string;
    gender?: 'Male' | 'Female' | 'Other' | '';
    birthday?: string;
    phoneVerified?: boolean;
    emailVerified?: boolean;
  }) => {
    const primary = addresses.find((a) => a.isDefault) || addresses[0] || DEFAULT_LA_TRINIDAD_ADDRESS;
    await AsyncStorage.setItem(
      userKeys.profileExtra,
      JSON.stringify({
        address: formatCartDisplayAddress(primary),
        selectedAddress: primary,
        bio: overrides?.bio ?? bio,
        gender: overrides?.gender ?? gender,
        birthday: overrides?.birthday ?? birthday,
        phoneVerified: overrides?.phoneVerified ?? phoneVerified,
        emailVerified: overrides?.emailVerified ?? emailVerified,
      })
    );
    if (onProfileDataUpdated) onProfileDataUpdated();
  };

  const openFieldEditor = (
    field: 'name' | 'bio' | 'gender' | 'birthday' | 'phone' | 'email' | 'username'
  ) => {
    setOtpRequested(false);
    setOtpInput('');
    setGeneratedOtpDemo('');
    setUsernameAvailable(null);
    if (field === 'name') {
      setTempFirstName(firstName);
      setTempLastName(lastName);
    } else if (field === 'bio') {
      setTempBio(bio);
    } else if (field === 'gender') {
      setTempGender(gender);
    } else if (field === 'birthday' && birthday.includes('-')) {
      const [y, m, d] = birthday.split('-');
      setTempBirthYear(y || '1998');
      setTempBirthMonth(m || '06');
      setTempBirthDay(d || '15');
    } else if (field === 'phone') {
      setTempPhone(phone);
    } else if (field === 'email') {
      setTempEmail(email);
    } else if (field === 'username') {
      setTempUsername(username);
    }
    setFieldEditorModal(field);
  };

  const handleRequestVerificationCode = () => {
    if (fieldEditorModal === 'phone' && (!tempPhone.trim() || tempPhone.trim().length < 7)) {
      showMessage('Invalid Phone Number', 'Please enter a valid mobile number first.');
      return;
    }
    if (fieldEditorModal === 'email' && (!tempEmail.trim() || !tempEmail.includes('@'))) {
      showMessage('Invalid Email', 'Please enter a valid email address first.');
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtpDemo(code);
    setOtpRequested(true);
    showMessage(
      'Verification Code Sent',
      `A 6-digit verification code has been dispatched.\n\nVerification Code: ${code}`
    );
  };

  const handleCheckUsernameAvailability = async (candidate: string) => {
    setTempUsername(candidate);
    const clean = candidate.trim().toLowerCase();
    if (clean.length < 3) {
      setUsernameAvailable(false);
      return;
    }
    if (['admin', 'root', 'support', 'marketplace', 'system'].includes(clean)) {
      setUsernameAvailable(false);
      return;
    }
    const deletedBefore = await isAccountPermanentlyDeleted({ username: clean });
    setUsernameAvailable(!deletedBefore);
  };

  const handleSaveFieldEditor = async () => {
    if (!fieldEditorModal) return;
    setUpdatingUser(true);
    try {
      if (fieldEditorModal === 'name') {
        if (!tempFirstName.trim() || !tempLastName.trim()) {
          showMessage('Validation Error', 'First name and last name are required.');
          return;
        }
        setFirstName(tempFirstName.trim());
        setLastName(tempLastName.trim());
        await updateUser({ firstName: tempFirstName.trim(), lastName: tempLastName.trim() });
        await logSecurityEvent('Updated profile name');
        if (onProfileDataUpdated) onProfileDataUpdated();
        setSettingsBanner({ type: 'success', text: 'Profile name updated successfully.' });
      } else if (fieldEditorModal === 'bio') {
        const trimmedBio = tempBio.trim().slice(0, 160);
        setBio(trimmedBio);
        await persistExtraProfileMetadata({ bio: trimmedBio });
        setSettingsBanner({ type: 'success', text: 'Bio updated successfully.' });
      } else if (fieldEditorModal === 'gender') {
        setGender(tempGender);
        await persistExtraProfileMetadata({ gender: tempGender });
        setSettingsBanner({
          type: 'success',
          text: tempGender ? `Gender set to ${tempGender}.` : 'Gender set to Unspecified.',
        });
      } else if (fieldEditorModal === 'birthday') {
        const y = Number(tempBirthYear);
        const m = Number(tempBirthMonth);
        const d = Number(tempBirthDay);
        if (
          Number.isNaN(y) ||
          y < 1900 ||
          y > new Date().getFullYear() ||
          Number.isNaN(m) ||
          m < 1 ||
          m > 12 ||
          Number.isNaN(d) ||
          d < 1 ||
          d > 31
        ) {
          showMessage('Invalid Date', 'Please enter a valid year, month, and day.');
          return;
        }
        const formatted = `${tempBirthYear.padStart(4, '0')}-${tempBirthMonth.padStart(
          2,
          '0'
        )}-${tempBirthDay.padStart(2, '0')}`;
        setBirthday(formatted);
        await persistExtraProfileMetadata({ birthday: formatted });
        setSettingsBanner({ type: 'success', text: `Birthday saved (${formatted}).` });
      } else if (fieldEditorModal === 'phone') {
        if (!otpRequested || otpInput.trim() !== generatedOtpDemo) {
          showMessage('OTP Required', 'Enter the 6-digit OTP sent to verify your phone number.');
          return;
        }
        const blocked = await isAccountPermanentlyDeleted({ phone: tempPhone.trim() });
        if (blocked) {
          showMessage(
            'Unavailable Phone Number',
            'This phone number belongs to a permanently deleted account and cannot be used.'
          );
          return;
        }
        setPhone(tempPhone.trim());
        setPhoneVerified(true);
        await updateUser({ phone: tempPhone.trim() });
        await persistExtraProfileMetadata({ phoneVerified: true });
        await logSecurityEvent('Verified and updated phone number via OTP');
        setGeneratedOtpDemo('');
        setOtpInput('');
        setSettingsBanner({ type: 'success', text: 'Phone number verified via OTP and updated.' });
      } else if (fieldEditorModal === 'email') {
        if (!otpRequested || otpInput.trim() !== generatedOtpDemo) {
          showMessage('Verification Required', 'Enter the 6-digit code sent to your email.');
          return;
        }
        const blocked = await isAccountPermanentlyDeleted({ email: tempEmail.trim() });
        if (blocked) {
          showMessage(
            'Unavailable Email Address',
            'This email address belongs to a permanently deleted account and cannot be used.'
          );
          return;
        }
        setEmail(tempEmail.trim());
        setEmailVerified(true);
        await updateUser({ email: tempEmail.trim() });
        await persistExtraProfileMetadata({ emailVerified: true });
        await logSecurityEvent('Verified and updated email address');
        setGeneratedOtpDemo('');
        setOtpInput('');
        setSettingsBanner({ type: 'success', text: 'Email address verified and updated.' });
      } else if (fieldEditorModal === 'username') {
        const cleanUser = tempUsername.trim();
        if (cleanUser.length < 3 || usernameAvailable === false) {
          showMessage('Invalid Username', 'Please choose an available username (min 3 characters).');
          return;
        }
        const blocked = await isAccountPermanentlyDeleted({ username: cleanUser });
        if (blocked) {
          showMessage(
            'Unavailable Username',
            'This username belongs to a permanently deleted account and cannot be used.'
          );
          return;
        }
        setUsername(cleanUser);
        await updateUser({ username: cleanUser });
        await logSecurityEvent(`Changed username to @${cleanUser}`);
        setSettingsBanner({ type: 'success', text: `Username updated to @${cleanUser}.` });
      }
      setFieldEditorModal(null);
    } finally {
      setUpdatingUser(false);
    }
  };

  // Security Toggles & Passkeys
  const persistSecurityPrefs = async (next: {
    fingerprintEnabled?: boolean;
    quickLoginEnabled?: boolean;
    passkeyRegistered?: boolean;
    passkeyLabel?: string;
  }) => {
    const updated = {
      fingerprintEnabled: next.fingerprintEnabled ?? fingerprintEnabled,
      quickLoginEnabled: next.quickLoginEnabled ?? quickLoginEnabled,
      passkeyRegistered: next.passkeyRegistered ?? passkeyRegistered,
      passkeyLabel: next.passkeyLabel ?? passkeyLabel,
    };
    setFingerprintEnabled(updated.fingerprintEnabled);
    setQuickLoginEnabled(updated.quickLoginEnabled);
    setPasskeyRegistered(updated.passkeyRegistered);
    setPasskeyLabel(updated.passkeyLabel);
    await AsyncStorage.setItem(userKeys.securityPrefs, JSON.stringify(updated));
  };

  const handleToggleFingerprintAuth = (nextValue: boolean) => {
    if (!nextValue) {
      persistSecurityPrefs({ fingerprintEnabled: false });
      logSecurityEvent('Disabled Fingerprint Authentication');
      setSettingsBanner({ type: 'success', text: 'Fingerprint Authentication turned Off.' });
      return;
    }
    confirmAction(
      'Enable Fingerprint Authentication',
      'Marketplace requests permission to use your device biometric authentication. Your fingerprint data stays on your device and is never collected or stored by Marketplace.',
      () => {
        requireIdentityVerification(async () => {
          await persistSecurityPrefs({ fingerprintEnabled: true });
          await logSecurityEvent('Enabled Fingerprint Authentication');
          setSettingsBanner({ type: 'success', text: 'Fingerprint Authentication enabled.' });
        });
      }
    );
  };

  const handleToggleQuickLogin = (nextValue: boolean) => {
    if (!nextValue) {
      persistSecurityPrefs({ quickLoginEnabled: false });
      logSecurityEvent('Disabled Quick Login');
      setSettingsBanner({ type: 'success', text: 'Quick Login disabled on this device.' });
      return;
    }
    requireIdentityVerification(async () => {
      await persistSecurityPrefs({ quickLoginEnabled: true });
      await logSecurityEvent('Enabled Quick Login');
      setSettingsBanner({ type: 'success', text: 'Quick Login enabled on this device.' });
    });
  };

  const handleSetupOrRemovePasskey = () => {
    if (passkeyRegistered) {
      confirmAction('Remove Passkey', 'Remove the passkey registered on this device?', () => {
        requireIdentityVerification(async () => {
          await persistSecurityPrefs({ passkeyRegistered: false, passkeyLabel: '' });
          await logSecurityEvent('Removed device passkey');
          setSettingsBanner({ type: 'success', text: 'Passkey removed.' });
        });
      });
      return;
    }
    requireIdentityVerification(async () => {
      const label =
        Platform.OS === 'web'
          ? `WebAuthn Passkey (${new Date().toLocaleDateString()})`
          : `Device Biometric Passkey (${new Date().toLocaleDateString()})`;
      await persistSecurityPrefs({ passkeyRegistered: true, passkeyLabel: label });
      await logSecurityEvent('Registered FIDO2/WebAuthn passkey');
      setSettingsBanner({ type: 'success', text: 'Passkey registered using device authentication.' });
    });
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      showMessage('Missing Fields', 'Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      showMessage('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showMessage('Mismatch', 'New passwords do not match.');
      return;
    }
    setChangingPassword(true);
    try {
      const result = await updateCurrentUserPassword(currentPassword, newPassword);
      if (!result.success) {
        showMessage('Error', result.message);
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setChangePasswordVisible(false);
      await logSecurityEvent('Changed account password');
      setSettingsBanner({ type: 'success', text: result.message });
    } finally {
      setChangingPassword(false);
    }
  };

  // Login Devices
  const handleSignOutSingleDevice = (device: LoginDeviceItem) => {
    confirmAction('Sign Out Device', `Sign out "${device.deviceName}"?`, async () => {
      const updated = loginDevices.filter((d) => d.id !== device.id);
      setLoginDevices(updated);
      await AsyncStorage.setItem(userKeys.loginDevices, JSON.stringify(updated));
      await logSecurityEvent(`Signed out device: ${device.deviceName}`);
      setSettingsBanner({ type: 'success', text: `Signed out ${device.deviceName}.` });
    });
  };

  const handleSignOutAllOtherDevices = () => {
    confirmAction(
      'Sign Out of All Other Devices',
      'Sign out of all other sessions except this current device?',
      async () => {
        const updated = loginDevices.filter((d) => d.isCurrent);
        setLoginDevices(updated);
        await AsyncStorage.setItem(userKeys.loginDevices, JSON.stringify(updated));
        await logSecurityEvent('Signed out of all other login devices');
        setSettingsBanner({ type: 'success', text: 'Signed out of all other devices.' });
      }
    );
  };

  // Bank Accounts & Cards
  const handleAddLinkedCard = () => {
    const cleanLast4 = newCardLast4.replace(/\D/g, '').slice(-4);
    if (cleanLast4.length !== 4 || !newCardHolder.trim() || !newCardExpiry.trim()) {
      showMessage(
        'Incomplete Details',
        'Please enter cardholder name, expiry (MM/YY), and the last 4 digits.'
      );
      return;
    }
    requireIdentityVerification(async () => {
      const created: LinkedCard = {
        id: `card-${Date.now()}`,
        brand: newCardBrand,
        last4: cleanLast4,
        holderName: newCardHolder.trim(),
        expiry: newCardExpiry.trim(),
        isDefault: newCardDefault || linkedCards.length === 0,
        providerToken: `tok_${Date.now()}`,
      };
      let updated = [created, ...linkedCards];
      if (created.isDefault) {
        updated = updated.map((c) => ({ ...c, isDefault: c.id === created.id }));
      }
      setLinkedCards(updated);
      await AsyncStorage.setItem(userKeys.linkedCards, JSON.stringify(updated));
      await logSecurityEvent(`Linked ${created.brand} card ending in ${created.last4}`);
      setNewCardLast4('');
      setNewCardHolder('');
      setNewCardExpiry('');
      handleSettingsBack();
      setSettingsBanner({
        type: 'success',
        text: `${created.brand} •••• ${created.last4} linked securely.`,
      });
    });
  };

  const handleSetDefaultCard = async (cardId: string) => {
    const updated = linkedCards.map((c) => ({ ...c, isDefault: c.id === cardId }));
    setLinkedCards(updated);
    await AsyncStorage.setItem(userKeys.linkedCards, JSON.stringify(updated));
    setSettingsBanner({ type: 'success', text: 'Default payment card updated.' });
  };

  const handleRemoveCard = (card: LinkedCard) => {
    confirmAction('Remove Card', `Remove ${card.brand} •••• ${card.last4}?`, async () => {
      let updated = linkedCards.filter((c) => c.id !== card.id);
      if (updated.length > 0 && !updated.some((c) => c.isDefault)) {
        updated[0].isDefault = true;
      }
      setLinkedCards(updated);
      await AsyncStorage.setItem(userKeys.linkedCards, JSON.stringify(updated));
      await logSecurityEvent(`Removed ${card.brand} card ending in ${card.last4}`);
      setSettingsBanner({ type: 'success', text: 'Linked card removed.' });
    });
  };

  const handleAuthorizeBankAccount = () => {
    const cleanLast4 = bankLast4Digits.replace(/\D/g, '').slice(-4);
    if (!bankAccountHolder.trim() || cleanLast4.length !== 4) {
      showMessage('Incomplete Details', 'Please enter account holder name and last 4 account digits.');
      return;
    }
    requireIdentityVerification(async () => {
      const created: LinkedBankAccount = {
        id: `bank-${Date.now()}`,
        bankName: selectedBankInstitution,
        accountType: 'Savings / Checking',
        maskedAccount: `•••• •••• ${cleanLast4}`,
        status: 'Active',
        category: 'bank',
      };
      const updated = [created, ...linkedBanks];
      setLinkedBanks(updated);
      await AsyncStorage.setItem(userKeys.linkedBanks, JSON.stringify(updated));
      await logSecurityEvent(`Authorized bank account (${selectedBankInstitution})`);
      setBankAccountHolder('');
      setBankLast4Digits('');
      handleSettingsBack();
      setSettingsBanner({
        type: 'success',
        text: `${selectedBankInstitution} (${created.maskedAccount}) connected.`,
      });
    });
  };

  const handleCompleteOfficialBankLink = () => {
    if (!oauthConsentChecked) {
      showMessage('Authorization Required', `Confirm official ${oauthTargetBank} OAuth authorization.`);
      return;
    }
    requireIdentityVerification(async () => {
      const randomLast4 = Math.floor(1000 + Math.random() * 9000).toString();
      const created: LinkedBankAccount = {
        id: `oauth-${Date.now()}`,
        bankName:
          oauthTargetBank === 'BPI'
            ? 'Bank of the Philippine Islands (BPI)'
            : 'UnionBank of the Philippines',
        accountType: 'Direct Online Banking',
        maskedAccount: `•••• •••• ${randomLast4}`,
        status: 'Active',
        category: 'direct_link',
      };
      const updated = [created, ...linkedBanks];
      setLinkedBanks(updated);
      await AsyncStorage.setItem(userKeys.linkedBanks, JSON.stringify(updated));
      await logSecurityEvent(`Linked ${oauthTargetBank} account via official OAuth flow`);
      handleSettingsBack();
      setSettingsBanner({
        type: 'success',
        text: `${oauthTargetBank} account linked (${created.maskedAccount}).`,
      });
    });
  };

  const handleUnlinkBankAccount = (bank: LinkedBankAccount) => {
    confirmAction('Unlink Bank Account', `Unlink ${bank.bankName} (${bank.maskedAccount})?`, async () => {
      const updated = linkedBanks.filter((b) => b.id !== bank.id);
      setLinkedBanks(updated);
      await AsyncStorage.setItem(userKeys.linkedBanks, JSON.stringify(updated));
      await logSecurityEvent(`Unlinked ${bank.bankName}`);
      setSettingsBanner({ type: 'success', text: `${bank.bankName} unlinked.` });
    });
  };

  const filteredAddresses = addresses.filter((addr) => {
    if (!addressSearchQuery.trim()) return true;
    const q = addressSearchQuery.toLowerCase();
    return (
      addr.label.toLowerCase().includes(q) ||
      addr.fullName.toLowerCase().includes(q) ||
      addr.phoneNumber.toLowerCase().includes(q) ||
      addr.streetDetails.toLowerCase().includes(q) ||
      addr.barangay.toLowerCase().includes(q) ||
      addr.city.toLowerCase().includes(q) ||
      addr.province.toLowerCase().includes(q) ||
      addr.region.toLowerCase().includes(q) ||
      addr.postalCode.toLowerCase().includes(q)
    );
  });

  const activeAddressRecord =
    addresses.find((a) => a.isDefault) || addresses[0] || DEFAULT_LA_TRINIDAD_ADDRESS;
  const activeCartSummaryAddress = formatCartDisplayAddress(activeAddressRecord);

  const displayName =
    [firstName, lastName].filter(Boolean).join(' ').trim() || username || 'Marketplace User';

  const getSettingsPageTitle = (route: SettingsRoute): string => {
    switch (route) {
      case 'account_settings':
        return 'Account Settings';
      case 'account_security':
        return 'Account & Security';
      case 'edit_profile':
        return 'Edit Profile';
      case 'my_addresses':
        return 'My Addresses';
      case 'address_form':
        return editingAddressId ? 'Edit Address' : 'New Address';
      case 'bank_cards':
        return 'Bank Accounts / Cards';
      case 'add_card':
        return 'Add Card';
      case 'add_bank':
        return 'Add Bank Account';
      case 'link_bank_oauth':
        return `Link ${oauthTargetBank} Account`;
      case 'account_activity':
        return 'Account Activity';
      case 'manage_devices':
        return 'Manage Login Devices';
      default:
        return 'Account Settings';
    }
  };

  // Full-width edge-to-edge responsive layout across Website, Tablet, and Phones (Realme, Samsung, Xiaomi, OPPO, Vivo, iPhone)
  const horizontalEdgePadding = resolvedDesktop ? 24 : resolvedTablet ? 16 : isSmallPhone ? 10 : 12;
  const contentMaxWidth = resolvedDesktop ? 980 : resolvedTablet ? 760 : '100%';
  const bottomScrollPadding =
    Platform.OS === 'web'
      ? resolvedMobile
        ? 110
        : 64
      : Math.max(insets.bottom + 110, 120);

  // Unified glassmorphic card container style
  const sectionCardStyle = {
    width: '100%' as const,
    backgroundColor: palette.glassSurface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden' as const,
    marginBottom: 16,
    ...glassShadow,
  };

  const sectionLabelRow = (label: string) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
        marginLeft: 4,
      }}
    >
      <View
        style={{
          width: 4,
          height: 15,
          borderRadius: 999,
          backgroundColor: '#FE2C55',
        }}
      />
      <Text
        style={{
          fontSize: 12,
          fontWeight: '900',
          color: palette.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        }}
      >
        {label}
      </Text>
    </View>
  );

  const menuRowBaseStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    minHeight: isSmallPhone ? 58 : 64,
    paddingVertical: isSmallPhone ? 12 : 14,
    paddingHorizontal: resolvedMobile ? (isSmallPhone ? 11 : 13) : 16,
    gap: isSmallPhone ? 10 : 12,
  };

  const iconBoxBaseStyle = {
    width: isSmallPhone ? 36 : 40,
    height: isSmallPhone ? 36 : 40,
    borderRadius: 13,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={handleSettingsBack}
      >
        <SafeAreaView
          style={[
            {
              flex: 1,
              backgroundColor: palette.isDark ? palette.background : '#F1F5FB',
              position: 'relative',
              overflow: 'hidden',
              minHeight: 0,
              ...(Platform.OS === 'web' ? ({ height: '100dvh', overflow: 'hidden' } as any) : {}),
            },
            webAmbientBackdropStyle,
          ]}
          edges={['top', 'left', 'right', 'bottom']}
        >
          {renderAmbientOrbs()}

          {/* Top Navigation Bar with Back Button (<) and Page Title */}
          <View
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: resolvedDesktop ? 24 : resolvedTablet ? 14 : 6,
                paddingVertical: 10,
                backgroundColor: palette.glassSurface,
                borderBottomWidth: 1,
                borderBottomColor: palette.border,
                zIndex: 10,
                ...glassShadow,
              },
              webGlassStyle,
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <TouchableOpacity
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Back"
                onPress={handleSettingsBack}
                style={{
                  minWidth: 44,
                  minHeight: 44,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 22,
                }}
              >
                <MaterialCommunityIcons name="chevron-left" size={28} color={palette.textPrimary} />
              </TouchableOpacity>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: resolvedDesktop ? 20 : isSmallPhone ? 16.5 : 18,
                  fontWeight: '900',
                  color: palette.textPrimary,
                  marginLeft: 4,
                  letterSpacing: -0.2,
                  flex: 1,
                }}
              >
                {getSettingsPageTitle(currentSettingsRoute)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 9,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: 'rgba(254, 44, 85, 0.11)',
                  borderWidth: 1,
                  borderColor: 'rgba(254, 44, 85, 0.22)',
                }}
              >
                <MaterialCommunityIcons name="shield-check" size={13} color="#FE2C55" />
                <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#FE2C55' }}>
                  Protected
                </Text>
              </View>

              <IconButton
                icon="close"
                size={22}
                iconColor={palette.textSecondary}
                onPress={() => {
                  setSettingsStack(['account_settings']);
                  onCloseSettings();
                }}
                style={{ margin: 0 }}
              />
            </View>
          </View>

          {settingsBanner && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: horizontalEdgePadding,
                paddingVertical: 10,
                backgroundColor:
                  settingsBanner.type === 'success'
                    ? 'rgba(16, 185, 129, 0.16)'
                    : palette.dangerSoft,
                borderBottomWidth: 1,
                borderBottomColor:
                  settingsBanner.type === 'success' ? palette.success : palette.danger,
                zIndex: 9,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: settingsBanner.type === 'success' ? palette.success : palette.danger,
                  flex: 1,
                }}
              >
                {settingsBanner.text}
              </Text>
              <TouchableOpacity onPress={() => setSettingsBanner(null)}>
                <MaterialCommunityIcons
                  name="close"
                  size={16}
                  color={settingsBanner.type === 'success' ? palette.success : palette.danger}
                />
              </TouchableOpacity>
            </View>
          )}

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              ref={settingsScrollRef}
              onScroll={(e) => {
                currentScrollYRef.current = e.nativeEvent.contentOffset.y;
              }}
              scrollEventThrottle={32}
              keyboardShouldPersistTaps="handled"
              style={{
                flex: 1,
                minHeight: 0,
                zIndex: 1,
                ...(Platform.OS === 'web'
                  ? ({ overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any)
                  : {}),
              }}
              contentContainerStyle={{
                flexGrow: 1,
                paddingHorizontal: horizontalEdgePadding,
                paddingTop: 16,
                paddingBottom: bottomScrollPadding,
                alignItems: 'center',
              }}
              showsVerticalScrollIndicator
            >
              {/* Centered responsive container on Desktop/Tablet, full edge-to-edge on Phone */}
              <View style={{ width: '100%', maxWidth: contentMaxWidth as any }}>
                {/* ==================== 1. ACCOUNT SETTINGS ==================== */}
                {currentSettingsRoute === 'account_settings' && (
                  <>
                    {sectionLabelRow('My Account')}

                    <View style={[sectionCardStyle, webGlassStyle]}>
                      <TouchableOpacity
                        activeOpacity={0.75}
                        style={menuRowBaseStyle}
                        onPress={() => navigateSettings('account_security')}
                      >
                        <View style={[iconBoxBaseStyle, { backgroundColor: palette.accentSoft }]}>
                          <MaterialCommunityIcons
                            name="shield-account-outline"
                            size={21}
                            color={palette.accent}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14.5, fontWeight: '800', color: palette.textPrimary }}>
                            Account & Security
                          </Text>
                          <Text style={{ fontSize: 12, color: palette.textSecondary, marginTop: 2 }}>
                            Profile, login info, passkeys, fingerprint & devices
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={22}
                          color={palette.textMuted}
                        />
                      </TouchableOpacity>

                      <Divider style={{ backgroundColor: palette.border }} />

                      <TouchableOpacity
                        activeOpacity={0.75}
                        style={menuRowBaseStyle}
                        onPress={() => navigateSettings('my_addresses')}
                      >
                        <View
                          style={[iconBoxBaseStyle, { backgroundColor: 'rgba(16, 185, 129, 0.14)' }]}
                        >
                          <MaterialCommunityIcons
                            name="map-marker-outline"
                            size={21}
                            color={palette.success}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14.5, fontWeight: '800', color: palette.textPrimary }}>
                            My Addresses
                          </Text>
                          <Text
                            numberOfLines={1}
                            style={{ fontSize: 12, color: palette.textSecondary, marginTop: 2 }}
                          >
                            {activeCartSummaryAddress}
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={22}
                          color={palette.textMuted}
                        />
                      </TouchableOpacity>

                      <Divider style={{ backgroundColor: palette.border }} />

                      <TouchableOpacity
                        activeOpacity={0.75}
                        style={menuRowBaseStyle}
                        onPress={() => navigateSettings('bank_cards')}
                      >
                        <View
                          style={[iconBoxBaseStyle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}
                        >
                          <MaterialCommunityIcons
                            name="credit-card-multiple-outline"
                            size={21}
                            color="#D97706"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14.5, fontWeight: '800', color: palette.textPrimary }}>
                            Bank Accounts / Cards
                          </Text>
                          <Text style={{ fontSize: 12, color: palette.textSecondary, marginTop: 2 }}>
                            Manage credit/debit cards, BPI, UnionBank & banks
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={22}
                          color={palette.textMuted}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* ==================== ACCOUNT & SECURITY (PRIVACY, APPEARANCE & DELETE ACCOUNT) ==================== */}
                    {sectionLabelRow('Preferences & Privacy')}

                    <View style={[sectionCardStyle, webGlassStyle]}>
                      <TouchableOpacity
                        activeOpacity={0.75}
                        style={menuRowBaseStyle}
                        onPress={() => setPrivacySettingsVisible(true)}
                      >
                        <View
                          style={[iconBoxBaseStyle, { backgroundColor: 'rgba(16, 185, 129, 0.14)' }]}
                        >
                          <MaterialCommunityIcons
                            name="shield-account"
                            size={20}
                            color={palette.success}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14.5, fontWeight: '800', color: palette.textPrimary }}>
                            Privacy Settings
                          </Text>
                          <Text style={{ fontSize: 12, color: palette.textSecondary, marginTop: 2 }}>
                            Data visibility & two-factor verification
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={20}
                          color={palette.textMuted}
                        />
                      </TouchableOpacity>

                      <Divider style={{ backgroundColor: palette.border }} />

                      <TouchableOpacity
                        activeOpacity={0.75}
                        style={menuRowBaseStyle}
                        onPress={() => setAppSettingsVisible(true)}
                      >
                        <View style={[iconBoxBaseStyle, { backgroundColor: palette.accentSoft }]}>
                          <MaterialCommunityIcons
                            name="theme-light-dark"
                            size={20}
                            color={palette.accent}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14.5, fontWeight: '800', color: palette.textPrimary }}>
                            Appearance & Notifications
                          </Text>
                          <Text style={{ fontSize: 12, color: palette.textSecondary, marginTop: 2 }}>
                            Theme: {themePreference.toUpperCase()} · Push Notifications
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={20}
                          color={palette.textMuted}
                        />
                      </TouchableOpacity>

                      <Divider style={{ backgroundColor: palette.border }} />

                      {/* Permanent Delete Account Row */}
                      <TouchableOpacity
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel="Delete Account"
                        testID="delete-account-row"
                        style={{
                          width: '100%',
                          minHeight: 74,
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: resolvedMobile ? (isSmallPhone ? 11 : 13) : 16,
                          paddingVertical: 16,
                          backgroundColor: palette.dangerSoft,
                          gap: isSmallPhone ? 10 : 12,
                        }}
                        onPress={openDeleteAccountDialog}
                      >
                        <View
                          style={[
                            iconBoxBaseStyle,
                            { backgroundColor: 'rgba(239, 68, 68, 0.22)' },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="account-remove"
                            size={20}
                            color={palette.danger}
                          />
                        </View>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text
                            style={{
                              fontSize: 14.5,
                              fontWeight: '800',
                              color: palette.danger,
                              lineHeight: 20,
                            }}
                          >
                            Delete Account
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              color: palette.textSecondary,
                              marginTop: 2,
                              lineHeight: 18,
                            }}
                          >
                            Permanently delete account & block future login or registration
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={22}
                          color={palette.danger}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* ==================== FULL-WIDTH LOGOUT BUTTON ==================== */}
                    <Button
                      mode="outlined"
                      onPress={handleLogout}
                      textColor={palette.textPrimary}
                      icon="logout"
                      style={[
                        {
                          width: '100%',
                          marginHorizontal: 0,
                          marginTop: 4,
                          borderRadius: 18,
                          borderColor: palette.border,
                          backgroundColor: palette.glassSurface,
                        },
                        glassShadow,
                      ]}
                      contentStyle={{ height: 52 }}
                      labelStyle={{ fontWeight: '800', fontSize: 14.5 }}
                    >
                      Logout
                    </Button>

                    {/* ==================== FOOTER VERSION UNDER LOGOUT BUTTON ==================== */}
                    <Text
                      style={{
                        textAlign: 'center',
                        marginTop: 16,
                        marginBottom: 8,
                        width: '100%',
                        fontSize: 12,
                        fontWeight: '700',
                        color: palette.textMuted,
                      }}
                    >
                      Marketplace v1.0.0
                    </Text>
                  </>
                )}

                {/* ==================== 2. ACCOUNT & SECURITY ==================== */}
                {currentSettingsRoute === 'account_security' && (
                  <>
                    {sectionLabelRow('Account')}
                    <View style={[sectionCardStyle, webGlassStyle]}>
                      <TouchableOpacity
                        activeOpacity={0.75}
                        style={menuRowBaseStyle}
                        onPress={() => navigateSettings('edit_profile')}
                      >
                        <View style={[iconBoxBaseStyle, { backgroundColor: palette.accentSoft }]}>
                          <MaterialCommunityIcons
                            name="account-circle-outline"
                            size={21}
                            color={palette.accent}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14.5, fontWeight: '800', color: palette.textPrimary }}>
                            My Profile
                          </Text>
                          <Text style={{ fontSize: 12, color: palette.textSecondary, marginTop: 2 }}>
                            {displayName} · Edit personal details
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={22}
                          color={palette.textMuted}
                        />
                      </TouchableOpacity>
                    </View>

                    {sectionLabelRow('Login Information')}
                    <View style={[sectionCardStyle, webGlassStyle]}>
                      <TouchableOpacity
                        activeOpacity={0.75}
                        style={[menuRowBaseStyle, { minHeight: 58, paddingVertical: 12 }]}
                        onPress={() => requireIdentityVerification(() => openFieldEditor('username'))}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: palette.textPrimary }}>
                            Username
                          </Text>
                        </View>
                        <Text style={{ fontSize: 13, color: palette.textSecondary, marginRight: 4 }}>
                          @{username || 'user'}
                        </Text>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={20}
                          color={palette.textMuted}
                        />
                      </TouchableOpacity>

                      <Divider style={{ backgroundColor: palette.border }} />

                      <TouchableOpacity
                        activeOpacity={0.75}
                        style={[menuRowBaseStyle, { minHeight: 58, paddingVertical: 12 }]}
                        onPress={() => requireIdentityVerification(() => openFieldEditor('phone'))}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: palette.textPrimary }}>
                            Phone Number
                          </Text>
                        </View>
                        <Text style={{ fontSize: 13, color: palette.textSecondary, marginRight: 4 }}>
                          {maskPhoneNumber(phone)}
                        </Text>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={20}
                          color={palette.textMuted}
                        />
                      </TouchableOpacity>

                      <Divider style={{ backgroundColor: palette.border }} />

                      <TouchableOpacity
                        activeOpacity={0.75}
                        style={[menuRowBaseStyle, { minHeight: 58, paddingVertical: 12 }]}
                        onPress={() => requireIdentityVerification(() => openFieldEditor('email'))}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: palette.textPrimary }}>
                            Email Address
                          </Text>
                        </View>
                        <Text style={{ fontSize: 13, color: palette.textSecondary, marginRight: 4 }}>
                          {maskEmailAddress(email)}
                        </Text>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={20}
                          color={palette.textMuted}
                        />
                      </TouchableOpacity>

                      <Divider style={{ backgroundColor: palette.border }} />

                      <TouchableOpacity
                        activeOpacity={0.75}
                        style={[menuRowBaseStyle, { minHeight: 58, paddingVertical: 12 }]}
                        onPress={() => {
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmNewPassword('');
                          setChangePasswordVisible(true);
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: palette.textPrimary }}>
                            Change Password
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={20}
                          color={palette.textMuted}
                        />
                      </TouchableOpacity>

                      <Divider style={{ backgroundColor: palette.border }} />

                      <TouchableOpacity
                        activeOpacity={0.75}
                        style={[menuRowBaseStyle, { minHeight: 58, paddingVertical: 12 }]}
                        onPress={handleSetupOrRemovePasskey}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: palette.textPrimary }}>
                            Passkeys
                          </Text>
                          {passkeyRegistered && passkeyLabel ? (
                            <Text style={{ fontSize: 12, color: palette.textSecondary, marginTop: 2 }}>
                              {passkeyLabel}
                            </Text>
                          ) : null}
                        </View>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '800',
                            color: passkeyRegistered ? palette.success : '#FE2C55',
                            marginRight: 4,
                          }}
                        >
                          {passkeyRegistered ? 'Configured' : 'Set Now'}
                        </Text>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={20}
                          color={palette.textMuted}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Fingerprint Authentication */}
                    <View style={[sectionCardStyle, { padding: 15 }, webGlassStyle]}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14.5, fontWeight: '800', color: palette.textPrimary }}>
                            Fingerprint Authentication
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              color: palette.textSecondary,
                              marginTop: 4,
                              lineHeight: 17,
                            }}
                          >
                            Your fingerprint data stays on your device. Marketplace does not collect or store your fingerprint data.
                          </Text>
                        </View>
                        <Switch
                          value={fingerprintEnabled}
                          onValueChange={handleToggleFingerprintAuth}
                          color="#FE2C55"
                        />
                      </View>
                    </View>

                    {/* Quick Login */}
                    <View style={[sectionCardStyle, { padding: 15 }, webGlassStyle]}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14.5, fontWeight: '800', color: palette.textPrimary }}>
                            Quick Login
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              color: palette.textSecondary,
                              marginTop: 4,
                              lineHeight: 17,
                            }}
                          >
                            Allow quick login on this device.
                          </Text>
                        </View>
                        <Switch
                          value={quickLoginEnabled}
                          onValueChange={handleToggleQuickLogin}
                          color="#FE2C55"
                        />
                      </View>
                    </View>

                    {/* Security */}
                    {sectionLabelRow('Security')}
                    <View style={[sectionCardStyle, webGlassStyle]}>
                      <TouchableOpacity
                        activeOpacity={0.75}
                        style={[menuRowBaseStyle, { minHeight: 72, paddingVertical: 14 }]}
                        onPress={() => navigateSettings('account_activity')}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14.5, fontWeight: '800', color: palette.textPrimary }}>
                            Check Account Activity
                          </Text>
                          <Text style={{ fontSize: 12, color: palette.textSecondary, marginTop: 3 }}>
                            Review your login history and account changes from the last 30 days.
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={22}
                          color={palette.textMuted}
                        />
                      </TouchableOpacity>

                      <Divider style={{ backgroundColor: palette.border }} />

                      <TouchableOpacity
                        activeOpacity={0.75}
                        style={[menuRowBaseStyle, { minHeight: 72, paddingVertical: 14 }]}
                        onPress={() => navigateSettings('manage_devices')}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14.5, fontWeight: '800', color: palette.textPrimary }}>
                            Manage Login Devices
                          </Text>
                          <Text style={{ fontSize: 12, color: palette.textSecondary, marginTop: 3 }}>
                            Review the devices currently or recently logged in to your Marketplace account.
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={22}
                          color={palette.textMuted}
                        />
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {/* ==================== 2A. EDIT PROFILE PAGE ==================== */}
                {currentSettingsRoute === 'edit_profile' && (
                  <View style={[sectionCardStyle, webGlassStyle]}>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      style={[menuRowBaseStyle, { minHeight: 58, paddingVertical: 12 }]}
                      onPress={() => openFieldEditor('name')}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: palette.textPrimary }}>
                          Name
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: displayName ? '600' : '800',
                          color: displayName ? palette.textSecondary : '#FE2C55',
                          marginRight: 4,
                        }}
                      >
                        {displayName || 'Set Now'}
                      </Text>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={palette.textMuted}
                      />
                    </TouchableOpacity>

                    <Divider style={{ backgroundColor: palette.border }} />

                    <TouchableOpacity
                      activeOpacity={0.75}
                      style={[menuRowBaseStyle, { minHeight: 58, paddingVertical: 12 }]}
                      onPress={() => openFieldEditor('bio')}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: palette.textPrimary }}>
                          Bio
                        </Text>
                      </View>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 13,
                          maxWidth: 180,
                          fontWeight: bio ? '600' : '800',
                          color: bio ? palette.textSecondary : '#FE2C55',
                          marginRight: 4,
                        }}
                      >
                        {bio || 'Set Now'}
                      </Text>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={palette.textMuted}
                      />
                    </TouchableOpacity>

                    <Divider style={{ backgroundColor: palette.border }} />

                    <TouchableOpacity
                      activeOpacity={0.75}
                      style={[menuRowBaseStyle, { minHeight: 58, paddingVertical: 12 }]}
                      onPress={() => openFieldEditor('gender')}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: palette.textPrimary }}>
                          Gender
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: gender ? '600' : '800',
                          color: gender ? palette.textSecondary : '#FE2C55',
                          marginRight: 4,
                        }}
                      >
                        {gender || 'Set Now'}
                      </Text>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={palette.textMuted}
                      />
                    </TouchableOpacity>

                    <Divider style={{ backgroundColor: palette.border }} />

                    <TouchableOpacity
                      activeOpacity={0.75}
                      style={[menuRowBaseStyle, { minHeight: 58, paddingVertical: 12 }]}
                      onPress={() => openFieldEditor('birthday')}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: palette.textPrimary }}>
                          Birthday
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: birthday ? '600' : '800',
                          color: birthday ? palette.textSecondary : '#FE2C55',
                          marginRight: 4,
                        }}
                      >
                        {birthday || 'Set Now'}
                      </Text>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={palette.textMuted}
                      />
                    </TouchableOpacity>

                    <Divider style={{ backgroundColor: palette.border }} />

                    <TouchableOpacity
                      activeOpacity={0.75}
                      style={[menuRowBaseStyle, { minHeight: 58, paddingVertical: 12 }]}
                      onPress={() => openFieldEditor('phone')}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: palette.textPrimary }}>
                          Phone Number
                        </Text>
                        {phoneVerified && phone ? (
                          <Text style={{ fontSize: 11, color: palette.success }}>OTP Verified</Text>
                        ) : null}
                      </View>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: phone ? '600' : '800',
                          color: phone ? palette.textSecondary : '#FE2C55',
                          marginRight: 4,
                        }}
                      >
                        {phone ? maskPhoneNumber(phone) : 'Set Now'}
                      </Text>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={palette.textMuted}
                      />
                    </TouchableOpacity>

                    <Divider style={{ backgroundColor: palette.border }} />

                    <TouchableOpacity
                      activeOpacity={0.75}
                      style={[menuRowBaseStyle, { minHeight: 58, paddingVertical: 12 }]}
                      onPress={() => openFieldEditor('email')}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: palette.textPrimary }}>
                          Email Address
                        </Text>
                        {emailVerified && email ? (
                          <Text style={{ fontSize: 11, color: palette.success }}>Verified</Text>
                        ) : null}
                      </View>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: emailVerified ? '600' : '800',
                          color: emailVerified ? palette.textSecondary : '#FE2C55',
                          marginRight: 4,
                        }}
                      >
                        {emailVerified ? maskEmailAddress(email) : 'Verify Now'}
                      </Text>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={palette.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                )}

                {/* ==================== 2E.1 CHECK ACCOUNT ACTIVITY ==================== */}
                {currentSettingsRoute === 'account_activity' && (
                  <View style={[sectionCardStyle, { padding: 15 }, webGlassStyle]}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: palette.textSecondary,
                        marginBottom: 12,
                        lineHeight: 18,
                      }}
                    >
                      Login history and security events from the last 30 days.
                    </Text>
                    {accountActivities.map((act, index) => (
                      <View
                        key={act.id}
                        style={{
                          paddingVertical: 10,
                          borderTopWidth: index === 0 ? 0 : 1,
                          borderTopColor: palette.border,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: '700',
                              color: act.suspicious ? palette.danger : palette.textPrimary,
                              flex: 1,
                            }}
                          >
                            {act.event}
                          </Text>
                          {act.suspicious && (
                            <View
                              style={{
                                backgroundColor: palette.dangerSoft,
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 6,
                              }}
                            >
                              <Text style={{ fontSize: 10, fontWeight: '800', color: palette.danger }}>
                                Suspicious Activity
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 12, color: palette.textSecondary, marginTop: 3 }}>
                          {act.timestamp} · {act.deviceType}
                        </Text>
                        <Text style={{ fontSize: 11, color: palette.textMuted, marginTop: 2 }}>
                          {act.clientInfo} · {act.location}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* ==================== 2E.2 MANAGE LOGIN DEVICES ==================== */}
                {currentSettingsRoute === 'manage_devices' && (
                  <>
                    <View style={[sectionCardStyle, { padding: 15 }, webGlassStyle]}>
                      {loginDevices.map((dev, index) => (
                        <View
                          key={dev.id}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingVertical: 10,
                            borderTopWidth: index === 0 ? 0 : 1,
                            borderTopColor: palette.border,
                            gap: 10,
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text
                                style={{
                                  fontSize: 14,
                                  fontWeight: '700',
                                  color: palette.textPrimary,
                                }}
                              >
                                {dev.deviceName}
                              </Text>
                              {dev.isCurrent && (
                                <View
                                  style={{
                                    backgroundColor: 'rgba(16, 185, 129, 0.16)',
                                    paddingHorizontal: 8,
                                    paddingVertical: 2,
                                    borderRadius: 6,
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 10,
                                      fontWeight: '800',
                                      color: palette.success,
                                    }}
                                  >
                                    Current Device
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={{ fontSize: 12, color: palette.textSecondary, marginTop: 2 }}>
                              {dev.deviceType} · {dev.lastActive}
                            </Text>
                            <Text style={{ fontSize: 11, color: palette.textMuted }}>
                              {dev.location}
                            </Text>
                          </View>

                          {!dev.isCurrent && (
                            <Button
                              mode="outlined"
                              compact
                              textColor={palette.danger}
                              style={{ borderColor: palette.danger, borderRadius: 12 }}
                              onPress={() => handleSignOutSingleDevice(dev)}
                            >
                              Sign Out
                            </Button>
                          )}
                        </View>
                      ))}
                    </View>

                    {loginDevices.some((d) => !d.isCurrent) && (
                      <Button
                        mode="outlined"
                        icon="logout-variant"
                        textColor={palette.danger}
                        style={{ borderColor: palette.danger, borderRadius: 16, width: '100%' }}
                        onPress={handleSignOutAllOtherDevices}
                      >
                        Sign Out of All Other Devices
                      </Button>
                    )}
                  </>
                )}

                {/* ==================== 3. MY ADDRESSES PAGE ==================== */}
                {currentSettingsRoute === 'my_addresses' && (
                  <>
                    <TextInput
                      mode="outlined"
                      dense
                      placeholder="Search saved address, region, province, city..."
                      value={addressSearchQuery}
                      onChangeText={setAddressSearchQuery}
                      textColor={palette.textPrimary}
                      placeholderTextColor={palette.textMuted}
                      left={<TextInput.Icon icon="magnify" color="#FE2C55" />}
                      right={
                        addressSearchQuery ? (
                          <TextInput.Icon
                            icon="close"
                            color={palette.textMuted}
                            onPress={() => setAddressSearchQuery('')}
                          />
                        ) : undefined
                      }
                      style={{ marginBottom: 12, backgroundColor: palette.glassInput, width: '100%' }}
                    />

                    {filteredAddresses.length === 0 ? (
                      <View
                        style={[sectionCardStyle, { padding: 26, alignItems: 'center' }, webGlassStyle]}
                      >
                        <MaterialCommunityIcons
                          name="map-marker-off-outline"
                          size={40}
                          color={palette.textMuted}
                        />
                        <Text style={{ color: palette.textMuted, fontSize: 13, marginTop: 8 }}>
                          No saved delivery addresses found.
                        </Text>
                      </View>
                    ) : (
                      filteredAddresses.map((addr) => (
                        <View
                          key={addr.id}
                          style={[
                            sectionCardStyle,
                            {
                              marginBottom: 12,
                              padding: 15,
                              borderColor: addr.isDefault ? '#FE2C55' : palette.border,
                            },
                            webGlassStyle,
                          ]}
                        >
                          <View
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                              <View
                                style={{
                                  backgroundColor:
                                    addr.label === 'Home'
                                      ? palette.accentSoft
                                      : 'rgba(245, 158, 11, 0.16)',
                                  paddingHorizontal: 8,
                                  paddingVertical: 2.5,
                                  borderRadius: 6,
                                }}
                              >
                                <Text
                                  style={{
                                    fontWeight: '800',
                                    fontSize: 11,
                                    color: addr.label === 'Home' ? palette.accent : '#D97706',
                                  }}
                                >
                                  {addr.label}
                                </Text>
                              </View>

                              {addr.isDefault ? (
                                <View
                                  style={{
                                    backgroundColor: 'rgba(16, 185, 129, 0.16)',
                                    paddingHorizontal: 8,
                                    paddingVertical: 2.5,
                                    borderRadius: 6,
                                  }}
                                >
                                  <Text
                                    style={{ fontWeight: '800', fontSize: 10.5, color: palette.success }}
                                  >
                                    Default · Active in Cart
                                  </Text>
                                </View>
                              ) : (
                                <TouchableOpacity
                                  onPress={() => handleSetDefaultAddress(addr.id)}
                                  style={{
                                    backgroundColor: palette.glassInput,
                                    paddingHorizontal: 8,
                                    paddingVertical: 2.5,
                                    borderRadius: 6,
                                    borderWidth: 1,
                                    borderColor: palette.border,
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontWeight: '700',
                                      fontSize: 10.5,
                                      color: palette.textSecondary,
                                    }}
                                  >
                                    Set as Default
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <IconButton
                                icon="pencil-outline"
                                size={18}
                                iconColor={palette.accent}
                                style={{ margin: 0 }}
                                onPress={() => openEditAddressForm(addr)}
                              />
                              <IconButton
                                icon="delete-outline"
                                size={18}
                                iconColor={palette.danger}
                                style={{ margin: 0 }}
                                onPress={() => handleDeleteAddress(addr.id, addr.label)}
                              />
                            </View>
                          </View>

                          <Text
                            style={{
                              fontWeight: '800',
                              fontSize: 14.5,
                              color: palette.textPrimary,
                              marginTop: 6,
                            }}
                          >
                            {addr.fullName} · {addr.phoneNumber}
                          </Text>
                          <Text style={{ color: palette.textSecondary, fontSize: 13, marginTop: 2 }}>
                            {addr.streetDetails}
                          </Text>
                          <Text style={{ color: palette.textMuted, fontSize: 12, marginTop: 2 }}>
                            {[addr.barangay, addr.city, addr.province, addr.region, addr.postalCode]
                              .filter(Boolean)
                              .join(', ')}
                          </Text>
                          {addr.deliveryInstructions ? (
                            <Text style={{ color: palette.accent, fontSize: 11.5, marginTop: 4 }}>
                              Note: {addr.deliveryInstructions}
                            </Text>
                          ) : null}
                        </View>
                      ))
                    )}

                    <Button
                      mode="contained"
                      icon="plus"
                      buttonColor="#FE2C55"
                      textColor="#FFFFFF"
                      onPress={openNewAddressForm}
                      style={[
                        { marginTop: 8, borderRadius: 20, width: '100%' },
                        webPrimaryButtonGradient,
                      ]}
                      contentStyle={{ height: 48 }}
                      labelStyle={{ fontWeight: '800' }}
                    >
                      Add New Address
                    </Button>
                  </>
                )}

                {/* ==================== 3B. ADD / EDIT ADDRESS FORM ==================== */}
                {currentSettingsRoute === 'address_form' && (
                  <View style={[sectionCardStyle, { padding: 15 }, webGlassStyle]}>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '800',
                        color: palette.textSecondary,
                        marginBottom: 6,
                      }}
                    >
                      Contact Information
                    </Text>
                    <TextInput
                      label="Recipient Full Name"
                      placeholder="Enter recipient full name"
                      value={addrFullName}
                      onChangeText={setAddrFullName}
                      textColor={palette.textPrimary}
                      mode="outlined"
                      dense
                      style={{ marginBottom: 8, backgroundColor: palette.glassInput }}
                    />
                    <TextInput
                      label="Phone Number"
                      placeholder="e.g. +63 917 123 4567"
                      value={addrPhone}
                      onChangeText={setAddrPhone}
                      textColor={palette.textPrimary}
                      keyboardType="phone-pad"
                      mode="outlined"
                      dense
                      style={{ marginBottom: 12, backgroundColor: palette.glassInput }}
                    />

                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '800',
                        color: palette.textSecondary,
                        marginBottom: 6,
                      }}
                    >
                      Delivery Location
                    </Text>
                    <TouchableOpacity
                      onPress={openLocationPicker}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: palette.border,
                        backgroundColor: palette.glassInput,
                        marginBottom: 10,
                      }}
                    >
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        {addrRegion && addrProvince && addrCity && addrBarangay ? (
                          <Text style={{ fontSize: 13, fontWeight: '700', color: palette.textPrimary }}>
                            {`${addrRegion}, ${addrProvince}, ${addrCity}, ${addrBarangay}`}
                          </Text>
                        ) : (
                          <Text style={{ fontSize: 13, color: palette.textMuted }}>
                            Region, Province, City / Municipality, Barangay
                          </Text>
                        )}
                      </View>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={22}
                        color={palette.textMuted}
                      />
                    </TouchableOpacity>

                    <TextInput
                      label="Postal Code"
                      placeholder="e.g. 2601"
                      value={addrPostalCode}
                      onChangeText={setAddrPostalCode}
                      textColor={palette.textPrimary}
                      keyboardType="numeric"
                      mode="outlined"
                      dense
                      style={{ marginBottom: 10, backgroundColor: palette.glassInput }}
                    />

                    <TextInput
                      label="Street Name, Building, House No."
                      placeholder="House No., Building, Street Name"
                      value={addrStreet}
                      onChangeText={setAddrStreet}
                      textColor={palette.textPrimary}
                      mode="outlined"
                      dense
                      style={{ marginBottom: 10, backgroundColor: palette.glassInput }}
                    />

                    <TextInput
                      label="Delivery Instructions (Optional)"
                      placeholder="Landmark, gate code, or courier notes"
                      value={addrInstructions}
                      onChangeText={setAddrInstructions}
                      textColor={palette.textPrimary}
                      mode="outlined"
                      dense
                      style={{ marginBottom: 12, backgroundColor: palette.glassInput }}
                    />

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        backgroundColor: palette.glassInput,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: palette.border,
                        marginBottom: 10,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: palette.textPrimary }}>
                        Set as Default Delivery Address
                      </Text>
                      <Switch
                        value={addrIsDefault}
                        onValueChange={setAddrIsDefault}
                        color="#FE2C55"
                      />
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        backgroundColor: palette.glassInput,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: palette.border,
                        marginBottom: 14,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: palette.textPrimary }}>
                        Label As:
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <Button
                          mode={addrLabel === 'Work' ? 'contained' : 'outlined'}
                          compact
                          buttonColor={addrLabel === 'Work' ? '#FE2C55' : undefined}
                          textColor={addrLabel === 'Work' ? '#FFFFFF' : palette.textSecondary}
                          onPress={() => setAddrLabel('Work')}
                        >
                          Work
                        </Button>
                        <Button
                          mode={addrLabel === 'Home' ? 'contained' : 'outlined'}
                          compact
                          buttonColor={addrLabel === 'Home' ? '#FE2C55' : undefined}
                          textColor={addrLabel === 'Home' ? '#FFFFFF' : palette.textSecondary}
                          onPress={() => setAddrLabel('Home')}
                        >
                          Home
                        </Button>
                      </View>
                    </View>

                    {editingAddressId && (
                      <Button
                        mode="outlined"
                        icon="delete-outline"
                        textColor={palette.danger}
                        style={{ borderColor: palette.danger, marginBottom: 8, borderRadius: 16 }}
                        onPress={() => handleDeleteAddress(editingAddressId, addrLabel)}
                      >
                        Delete Address
                      </Button>
                    )}

                    <Button
                      mode="contained"
                      buttonColor="#FE2C55"
                      textColor="#FFFFFF"
                      onPress={handleSubmitAddress}
                      style={[{ borderRadius: 20 }, webPrimaryButtonGradient]}
                      contentStyle={{ height: 46 }}
                      labelStyle={{ fontWeight: '800' }}
                    >
                      Save Address
                    </Button>
                  </View>
                )}

                {/* ==================== 4. BANK ACCOUNTS / CARDS PAGE ==================== */}
                {currentSettingsRoute === 'bank_cards' && (
                  <>
                    {sectionLabelRow('Credit / Debit Card')}
                    <View style={[sectionCardStyle, webGlassStyle]}>
                      {linkedCards.map((card) => (
                        <React.Fragment key={card.id}>
                          <View
                            style={[
                              menuRowBaseStyle,
                              { minHeight: 62, paddingVertical: 12, justifyContent: 'space-between' },
                            ]}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                              <View style={[iconBoxBaseStyle, { backgroundColor: palette.accentSoft }]}>
                                <MaterialCommunityIcons
                                  name="credit-card-outline"
                                  size={20}
                                  color={palette.accent}
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <Text
                                    style={{ fontSize: 14, fontWeight: '800', color: palette.textPrimary }}
                                  >
                                    {card.brand} •••• {card.last4}
                                  </Text>
                                  {card.isDefault && (
                                    <View
                                      style={{
                                        backgroundColor: 'rgba(16, 185, 129, 0.16)',
                                        paddingHorizontal: 6,
                                        paddingVertical: 1.5,
                                        borderRadius: 5,
                                      }}
                                    >
                                      <Text
                                        style={{
                                          fontSize: 10,
                                          fontWeight: '800',
                                          color: palette.success,
                                        }}
                                      >
                                        Default
                                      </Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={{ fontSize: 12, color: palette.textSecondary, marginTop: 2 }}>
                                  {card.holderName} · Exp {card.expiry}
                                </Text>
                              </View>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              {!card.isDefault && (
                                <Button
                                  mode="text"
                                  compact
                                  textColor={palette.accent}
                                  onPress={() => handleSetDefaultCard(card.id)}
                                >
                                  Default
                                </Button>
                              )}
                              <IconButton
                                icon="delete-outline"
                                size={18}
                                iconColor={palette.danger}
                                style={{ margin: 0 }}
                                onPress={() => handleRemoveCard(card)}
                              />
                            </View>
                          </View>
                          <Divider style={{ backgroundColor: palette.border }} />
                        </React.Fragment>
                      ))}

                      <TouchableOpacity
                        activeOpacity={0.75}
                        style={[menuRowBaseStyle, { minHeight: 58, paddingVertical: 12 }]}
                        onPress={() => {
                          setNewCardBrand('Visa');
                          setNewCardLast4('');
                          setNewCardHolder(displayName);
                          setNewCardExpiry('');
                          setNewCardDefault(linkedCards.length === 0);
                          navigateSettings('add_card');
                        }}
                      >
                        <View
                          style={[iconBoxBaseStyle, { backgroundColor: 'rgba(254, 44, 85, 0.12)' }]}
                        >
                          <MaterialCommunityIcons name="plus" size={20} color="#FE2C55" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: '#FE2C55' }}>
                            Add New Card
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={20}
                          color={palette.textMuted}
                        />
                      </TouchableOpacity>
                    </View>

                    {sectionLabelRow('Bank Account')}
                    <View style={[sectionCardStyle, webGlassStyle]}>
                      {linkedBanks
                        .filter((b) => b.category === 'bank')
                        .map((bank) => (
                          <React.Fragment key={bank.id}>
                            <View style={[menuRowBaseStyle, { minHeight: 60, paddingVertical: 12 }]}>
                              <View
                                style={[
                                  iconBoxBaseStyle,
                                  { backgroundColor: 'rgba(16, 185, 129, 0.14)' },
                                ]}
                              >
                                <MaterialCommunityIcons
                                  name="bank-outline"
                                  size={20}
                                  color={palette.success}
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: '800', color: palette.textPrimary }}>
                                  {bank.bankName}
                                </Text>
                                <Text style={{ fontSize: 12, color: palette.textSecondary, marginTop: 2 }}>
                                  {bank.maskedAccount} · {bank.status}
                                </Text>
                              </View>
                              <IconButton
                                icon="link-off"
                                size={18}
                                iconColor={palette.danger}
                                style={{ margin: 0 }}
                                onPress={() => handleUnlinkBankAccount(bank)}
                              />
                            </View>
                            <Divider style={{ backgroundColor: palette.border }} />
                          </React.Fragment>
                        ))}

                      <TouchableOpacity
                        activeOpacity={0.75}
                        style={[menuRowBaseStyle, { minHeight: 58, paddingVertical: 12 }]}
                        onPress={() => {
                          setSelectedBankInstitution('BDO Unibank');
                          setBankAccountHolder(displayName);
                          setBankLast4Digits('');
                          navigateSettings('add_bank');
                        }}
                      >
                        <View
                          style={[iconBoxBaseStyle, { backgroundColor: 'rgba(254, 44, 85, 0.12)' }]}
                        >
                          <MaterialCommunityIcons name="plus" size={20} color="#FE2C55" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: '#FE2C55' }}>
                            Add Bank Account
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={20}
                          color={palette.textMuted}
                        />
                      </TouchableOpacity>
                    </View>

                    {sectionLabelRow('Linked Bank Accounts')}
                    <View style={[sectionCardStyle, webGlassStyle]}>
                      {linkedBanks
                        .filter((b) => b.category === 'direct_link')
                        .map((bank) => (
                          <React.Fragment key={bank.id}>
                            <View style={[menuRowBaseStyle, { minHeight: 62, paddingVertical: 12 }]}>
                              <View
                                style={[
                                  iconBoxBaseStyle,
                                  { backgroundColor: 'rgba(239, 68, 68, 0.14)' },
                                ]}
                              >
                                <MaterialCommunityIcons
                                  name="bank-check"
                                  size={20}
                                  color={palette.danger}
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: '800', color: palette.textPrimary }}>
                                  {bank.bankName}
                                </Text>
                                <Text style={{ fontSize: 12, color: palette.textSecondary, marginTop: 2 }}>
                                  {bank.maskedAccount} · Status: {bank.status}
                                </Text>
                              </View>
                              <Button
                                mode="outlined"
                                compact
                                textColor={palette.danger}
                                style={{ borderColor: palette.danger, borderRadius: 12 }}
                                onPress={() => handleUnlinkBankAccount(bank)}
                              >
                                Unlink
                              </Button>
                            </View>
                            <Divider style={{ backgroundColor: palette.border }} />
                          </React.Fragment>
                        ))}

                      <TouchableOpacity
                        activeOpacity={0.75}
                        style={[menuRowBaseStyle, { minHeight: 58, paddingVertical: 12 }]}
                        onPress={() => {
                          setOauthTargetBank('BPI');
                          setOauthConsentChecked(true);
                          navigateSettings('link_bank_oauth');
                        }}
                      >
                        <View
                          style={[iconBoxBaseStyle, { backgroundColor: 'rgba(239, 68, 68, 0.14)' }]}
                        >
                          <MaterialCommunityIcons name="bank" size={20} color="#DC2626" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: palette.accent }}>
                            + Link BPI Account
                          </Text>
                          <Text style={{ fontSize: 12, color: palette.textSecondary, marginTop: 2 }}>
                            Official BPI online banking authorization
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={20}
                          color={palette.textMuted}
                        />
                      </TouchableOpacity>

                      <Divider style={{ backgroundColor: palette.border }} />

                      <TouchableOpacity
                        activeOpacity={0.75}
                        style={[menuRowBaseStyle, { minHeight: 58, paddingVertical: 12 }]}
                        onPress={() => {
                          setOauthTargetBank('UnionBank');
                          setOauthConsentChecked(true);
                          navigateSettings('link_bank_oauth');
                        }}
                      >
                        <View
                          style={[iconBoxBaseStyle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}
                        >
                          <MaterialCommunityIcons name="bank" size={20} color="#EA580C" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: palette.accent }}>
                            + Link UnionBank Account
                          </Text>
                          <Text style={{ fontSize: 12, color: palette.textSecondary, marginTop: 2 }}>
                            Official UnionBank online authorization
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={20}
                          color={palette.textMuted}
                        />
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {/* ==================== 4A. ADD CARD PAGE ==================== */}
                {currentSettingsRoute === 'add_card' && (
                  <View style={[sectionCardStyle, { padding: 15 }, webGlassStyle]}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: palette.textSecondary,
                        marginBottom: 12,
                        lineHeight: 18,
                      }}
                    >
                      Cards are tokenized through our payment gateway. CVVs and full card numbers are never stored in plain text.
                    </Text>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                      {(['Visa', 'Mastercard', 'JCB', 'Amex'] as const).map((brand) => (
                        <Button
                          key={brand}
                          mode={newCardBrand === brand ? 'contained' : 'outlined'}
                          compact
                          buttonColor={newCardBrand === brand ? '#FE2C55' : undefined}
                          textColor={newCardBrand === brand ? '#FFFFFF' : palette.textPrimary}
                          onPress={() => setNewCardBrand(brand)}
                        >
                          {brand}
                        </Button>
                      ))}
                    </View>

                    <TextInput
                      label="Cardholder Name"
                      value={newCardHolder}
                      onChangeText={setNewCardHolder}
                      textColor={palette.textPrimary}
                      mode="outlined"
                      dense
                      style={{ marginBottom: 10, backgroundColor: palette.glassInput }}
                    />

                    <TextInput
                      label="Last 4 Digits of Card"
                      placeholder="e.g. 4242"
                      value={newCardLast4}
                      onChangeText={setNewCardLast4}
                      keyboardType="numeric"
                      maxLength={4}
                      textColor={palette.textPrimary}
                      mode="outlined"
                      dense
                      style={{ marginBottom: 10, backgroundColor: palette.glassInput }}
                    />

                    <TextInput
                      label="Expiry Date (MM/YY)"
                      placeholder="e.g. 12/28"
                      value={newCardExpiry}
                      onChangeText={setNewCardExpiry}
                      maxLength={5}
                      textColor={palette.textPrimary}
                      mode="outlined"
                      dense
                      style={{ marginBottom: 12, backgroundColor: palette.glassInput }}
                    />

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 14,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: palette.textPrimary }}>
                        Set as Default Card
                      </Text>
                      <Switch
                        value={newCardDefault}
                        onValueChange={setNewCardDefault}
                        color="#FE2C55"
                      />
                    </View>

                    <Button
                      mode="contained"
                      buttonColor="#FE2C55"
                      textColor="#FFFFFF"
                      onPress={handleAddLinkedCard}
                      style={[{ borderRadius: 20 }, webPrimaryButtonGradient]}
                      contentStyle={{ height: 46 }}
                      labelStyle={{ fontWeight: '800' }}
                    >
                      Link Card Securely
                    </Button>
                  </View>
                )}

                {/* ==================== 4B. ADD BANK ACCOUNT PAGE ==================== */}
                {currentSettingsRoute === 'add_bank' && (
                  <View style={[sectionCardStyle, { padding: 15 }, webGlassStyle]}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: palette.textSecondary,
                        marginBottom: 12,
                        lineHeight: 18,
                      }}
                    >
                      Select a supported bank to authorize connection. Banking credentials are never collected.
                    </Text>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                      {['BDO Unibank', 'Metrobank', 'LandBank', 'Security Bank', 'RCBC'].map(
                        (bankName) => (
                          <Button
                            key={bankName}
                            mode={selectedBankInstitution === bankName ? 'contained' : 'outlined'}
                            compact
                            buttonColor={
                              selectedBankInstitution === bankName ? '#FE2C55' : undefined
                            }
                            textColor={
                              selectedBankInstitution === bankName ? '#FFFFFF' : palette.textPrimary
                            }
                            onPress={() => setSelectedBankInstitution(bankName)}
                          >
                            {bankName}
                          </Button>
                        )
                      )}
                    </View>

                    <TextInput
                      label="Account Holder Name"
                      value={bankAccountHolder}
                      onChangeText={setBankAccountHolder}
                      textColor={palette.textPrimary}
                      mode="outlined"
                      dense
                      style={{ marginBottom: 10, backgroundColor: palette.glassInput }}
                    />

                    <TextInput
                      label="Last 4 Digits of Account Number"
                      placeholder="e.g. 8891"
                      value={bankLast4Digits}
                      onChangeText={setBankLast4Digits}
                      keyboardType="numeric"
                      maxLength={4}
                      textColor={palette.textPrimary}
                      mode="outlined"
                      dense
                      style={{ marginBottom: 14, backgroundColor: palette.glassInput }}
                    />

                    <Button
                      mode="contained"
                      buttonColor="#FE2C55"
                      textColor="#FFFFFF"
                      onPress={handleAuthorizeBankAccount}
                      style={[{ borderRadius: 20 }, webPrimaryButtonGradient]}
                      contentStyle={{ height: 46 }}
                      labelStyle={{ fontWeight: '800' }}
                    >
                      Authorize Bank Connection
                    </Button>
                  </View>
                )}

                {/* ==================== 4C. OFFICIAL BPI / UNIONBANK LINKING ==================== */}
                {currentSettingsRoute === 'link_bank_oauth' && (
                  <View style={[sectionCardStyle, { padding: 16 }, webGlassStyle]}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '900',
                        color: palette.textPrimary,
                        marginBottom: 8,
                      }}
                    >
                      Official {oauthTargetBank} Authorization
                    </Text>
                    <Text
                      style={{
                        fontSize: 12.5,
                        color: palette.textSecondary,
                        lineHeight: 19,
                        marginBottom: 12,
                      }}
                    >
                      Authorize Marketplace to link your {oauthTargetBank} account using official bank APIs. Your {oauthTargetBank} password and PIN are never collected or stored.
                    </Text>

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 12,
                        borderRadius: 12,
                        backgroundColor: palette.glassInput,
                        borderWidth: 1,
                        borderColor: palette.border,
                        marginBottom: 14,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12.5,
                          fontWeight: '700',
                          color: palette.textPrimary,
                          flex: 1,
                        }}
                      >
                        I authorize official {oauthTargetBank} account linking
                      </Text>
                      <Switch
                        value={oauthConsentChecked}
                        onValueChange={setOauthConsentChecked}
                        color="#FE2C55"
                      />
                    </View>

                    <Button
                      mode="contained"
                      buttonColor="#FE2C55"
                      textColor="#FFFFFF"
                      onPress={handleCompleteOfficialBankLink}
                      style={[{ borderRadius: 20 }, webPrimaryButtonGradient]}
                      contentStyle={{ height: 46 }}
                      labelStyle={{ fontWeight: '800' }}
                    >
                      Continue with {oauthTargetBank}
                    </Button>
                  </View>
                )}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* ==================== PRIVACY SETTINGS MODAL (TRANSFERRED) ==================== */}
      <Modal visible={privacySettingsVisible} animationType="slide" transparent>
        <View style={[styles.modalBackdrop, resolvedMobile && { paddingHorizontal: 10 }]}>
          <Card style={[styles.modalCard, { width: '100%', maxWidth: 480 }, webGlassStyle]}>
            <View style={styles.modalHeader}>
              <Title style={styles.modalTitle}>Privacy & Personal Data</Title>
              <IconButton
                icon="close"
                size={20}
                iconColor={palette.textPrimary}
                onPress={() => setPrivacySettingsVisible(false)}
                style={{ margin: 0 }}
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 10,
                }}
              >
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ fontSize: 13.5, fontWeight: '700', color: palette.textPrimary }}>
                    Public Profile Visibility
                  </Text>
                  <Text style={{ fontSize: 11.5, color: palette.textMuted }}>
                    Allow sellers to view your buyer rating
                  </Text>
                </View>
                <Switch
                  value={profilePublic}
                  onValueChange={(val) => savePrivacySettings({ profilePublic: val })}
                  color="#FE2C55"
                />
              </View>
              <Divider style={{ backgroundColor: palette.border }} />

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 10,
                }}
              >
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ fontSize: 13.5, fontWeight: '700', color: palette.textPrimary }}>
                    Share Review & Order Activity
                  </Text>
                  <Text style={{ fontSize: 11.5, color: palette.textMuted }}>
                    Display your name on verified product reviews
                  </Text>
                </View>
                <Switch
                  value={shareOrderActivity}
                  onValueChange={(val) => savePrivacySettings({ shareOrderActivity: val })}
                  color="#FE2C55"
                />
              </View>
              <Divider style={{ backgroundColor: palette.border }} />

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 10,
                }}
              >
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ fontSize: 13.5, fontWeight: '700', color: palette.textPrimary }}>
                    Personalized Recommendations
                  </Text>
                  <Text style={{ fontSize: 11.5, color: palette.textMuted }}>
                    Tailor deals based on browsing history
                  </Text>
                </View>
                <Switch
                  value={personalizedAds}
                  onValueChange={(val) => savePrivacySettings({ personalizedAds: val })}
                  color="#FE2C55"
                />
              </View>
              <Divider style={{ backgroundColor: palette.border }} />

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 10,
                  marginBottom: 12,
                }}
              >
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ fontSize: 13.5, fontWeight: '700', color: palette.textPrimary }}>
                    Two-Factor Verification
                  </Text>
                  <Text style={{ fontSize: 11.5, color: palette.textMuted }}>
                    Extra security prompt on sensitive actions
                  </Text>
                </View>
                <Switch
                  value={twoFactorAuth}
                  onValueChange={(val) => savePrivacySettings({ twoFactorAuth: val })}
                  color={palette.success}
                />
              </View>
            </ScrollView>

            <Button
              mode="contained"
              buttonColor="#FE2C55"
              textColor="#FFFFFF"
              onPress={() => setPrivacySettingsVisible(false)}
              style={[{ borderRadius: 20 }, webPrimaryButtonGradient]}
              labelStyle={{ fontWeight: '800' }}
            >
              Done
            </Button>
          </Card>
        </View>
      </Modal>

      {/* ==================== APPEARANCE & NOTIFICATIONS MODAL (TRANSFERRED) ==================== */}
      <Modal visible={appSettingsVisible} animationType="slide" transparent>
        <View style={[styles.modalBackdrop, resolvedMobile && { paddingHorizontal: 10 }]}>
          <Card style={[styles.modalCard, { width: '100%', maxWidth: 600 }, webGlassStyle]}>
            <View style={styles.modalHeader}>
              <Title style={styles.modalTitle}>Appearance & Notifications</Title>
              <IconButton
                icon="close"
                size={20}
                iconColor={palette.textPrimary}
                onPress={() => setAppSettingsVisible(false)}
                style={{ margin: 0 }}
              />
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: palette.textPrimary }}>
                Push Notifications
              </Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                color={palette.success}
              />
            </View>

            <Divider style={{ backgroundColor: palette.border, marginBottom: 12 }} />

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: palette.textPrimary }}>
                  Dark Mode
                </Text>
                <Text style={{ fontSize: 11.5, color: palette.textMuted }}>
                  Applies translucent glass theme across all screens
                </Text>
              </View>
              <Switch value={isDark} onValueChange={toggleDarkMode} color="#FE2C55" />
            </View>

            <Text
              style={{
                fontSize: 12,
                fontWeight: '800',
                color: palette.textSecondary,
                marginBottom: 8,
              }}
            >
              Appearance Mode
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              {(
                [
                  { key: 'light', label: 'Light Mode', icon: 'white-balance-sunny' },
                  { key: 'dark', label: 'Dark Mode', icon: 'weather-night' },
                  { key: 'system', label: 'System', icon: 'theme-light-dark' },
                ] as Array<{ key: ThemePreference; label: string; icon: any }>
              ).map((modeOption) => {
                const active = themePreference === modeOption.key;
                return (
                  <TouchableOpacity
                    key={modeOption.key}
                    onPress={() => setThemePreference(modeOption.key)}
                    style={{
                      flex: 1,
                      paddingVertical: 11,
                      paddingHorizontal: 6,
                      borderRadius: 14,
                      alignItems: 'center',
                      backgroundColor: active
                        ? 'rgba(254, 44, 85, 0.14)'
                        : palette.glassInput,
                      borderWidth: 1.2,
                      borderColor: active ? '#FE2C55' : palette.border,
                    }}
                  >
                    <MaterialCommunityIcons
                      name={modeOption.icon}
                      size={20}
                      color={active ? '#FE2C55' : palette.textMuted}
                    />
                    <Text
                      style={{
                        fontSize: 11.5,
                        fontWeight: '800',
                        color: active ? '#FE2C55' : palette.textPrimary,
                        marginTop: 4,
                      }}
                    >
                      {modeOption.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button
              mode="outlined"
              textColor={palette.textPrimary}
              onPress={() => setAppSettingsVisible(false)}
              style={{ marginTop: 4, borderColor: palette.border, borderRadius: 16 }}
            >
              Close
            </Button>
          </Card>
        </View>
      </Modal>

      {/* ==================== AUTOMATIC PERMANENT DELETE ACCOUNT CONFIRMATION MODAL ==================== */}
      <Modal
        visible={deleteAccountModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => {
          if (!deletingAccount) setDeleteAccountModalVisible(false);
        }}
      >
        <View style={[styles.modalBackdrop, resolvedMobile && { paddingHorizontal: 10 }]}>
          <Card
            style={[
              styles.modalCard,
              {
                width: '100%',
                maxWidth: 460,
                borderWidth: 1.5,
                borderColor: palette.danger,
              },
              webGlassStyle,
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: palette.dangerSoft,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <MaterialCommunityIcons name="alert-octagon" size={24} color={palette.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Title style={{ fontSize: 17, fontWeight: '900', color: palette.danger, marginVertical: 0 }}>
                  Delete Account Permanently
                </Title>
                <Text style={{ fontSize: 11.5, color: palette.textMuted }}>
                  @{user?.username || user?.email}
                </Text>
              </View>
              <IconButton
                icon="close"
                size={20}
                iconColor={palette.textPrimary}
                onPress={() => setDeleteAccountModalVisible(false)}
                disabled={deletingAccount}
                style={{ margin: 0 }}
              />
            </View>

            <View
              style={{
                backgroundColor: palette.dangerSoft,
                borderRadius: 14,
                padding: 12,
                borderWidth: 1,
                borderColor: 'rgba(239, 68, 68, 0.35)',
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: palette.textPrimary, lineHeight: 19 }}>
                Are you sure you want to delete your account? Your profile, saved data, and login credentials will be permanently deleted and blocked from future login or registration.
              </Text>
              <Text style={{ fontSize: 11.5, color: palette.textSecondary, marginTop: 6, lineHeight: 17 }}>
                • Saved addresses, wishlist, and cart items will be erased.{'\n'}
                • This username, email, and phone number can no longer log in or register again.{'\n'}
                • Your session will end immediately and return to Sign In.
              </Text>
            </View>

            {deleteErrorMessage && (
              <Text style={{ fontSize: 12, fontWeight: '700', color: palette.danger, marginBottom: 8 }}>
                {deleteErrorMessage}
              </Text>
            )}

            <View
              style={{
                flexDirection: resolvedDesktop || resolvedTablet ? 'row' : 'column-reverse',
                gap: 8,
                marginTop: 6,
              }}
            >
              <Button
                mode="outlined"
                onPress={() => setDeleteAccountModalVisible(false)}
                disabled={deletingAccount}
                textColor={palette.textPrimary}
                style={{
                  flex: resolvedDesktop || resolvedTablet ? 1 : undefined,
                  borderRadius: 16,
                  borderColor: palette.border,
                }}
                contentStyle={{ height: 44 }}
              >
                Cancel
              </Button>

              <Button
                mode="contained"
                icon="delete-forever"
                onPress={handlePermanentlyDeleteAccount}
                loading={deletingAccount}
                disabled={deletingAccount}
                buttonColor={palette.danger}
                textColor="#FFFFFF"
                style={{ flex: resolvedDesktop || resolvedTablet ? 1.4 : undefined, borderRadius: 16 }}
                contentStyle={{ height: 44 }}
                labelStyle={{ fontWeight: '800', fontSize: 13 }}
              >
                {deletingAccount ? 'Deleting Account...' : 'Delete Account Now'}
              </Button>
            </View>
          </Card>
        </View>
      </Modal>

      {/* ==================== FIELD EDITOR MODAL ==================== */}
      <Modal
        visible={fieldEditorModal !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setFieldEditorModal(null)}
      >
        <View style={[styles.modalBackdrop, resolvedMobile && { paddingHorizontal: 10 }]}>
          <Card style={[styles.modalCard, { width: '100%', maxWidth: 460 }, webGlassStyle]}>
            <View style={styles.modalHeader}>
              <Title style={styles.modalTitle}>
                {fieldEditorModal === 'name' && 'Edit Name'}
                {fieldEditorModal === 'bio' && 'Edit Bio'}
                {fieldEditorModal === 'gender' && 'Select Gender'}
                {fieldEditorModal === 'birthday' && 'Select Birthday'}
                {fieldEditorModal === 'phone' && 'Verify Phone Number (OTP)'}
                {fieldEditorModal === 'email' && 'Verify Email Address'}
                {fieldEditorModal === 'username' && 'Change Username'}
              </Title>
              <IconButton
                icon="close"
                size={20}
                iconColor={palette.textPrimary}
                onPress={() => setFieldEditorModal(null)}
                style={{ margin: 0 }}
              />
            </View>

            {fieldEditorModal === 'name' && (
              <>
                <TextInput
                  label="First Name"
                  value={tempFirstName}
                  onChangeText={setTempFirstName}
                  textColor={palette.textPrimary}
                  mode="outlined"
                  dense
                  style={{ marginBottom: 8, backgroundColor: palette.glassInput }}
                />
                <TextInput
                  label="Last Name"
                  value={tempLastName}
                  onChangeText={setTempLastName}
                  textColor={palette.textPrimary}
                  mode="outlined"
                  dense
                  style={{ marginBottom: 12, backgroundColor: palette.glassInput }}
                />
              </>
            )}

            {fieldEditorModal === 'bio' && (
              <TextInput
                label="Bio (max 160 characters)"
                value={tempBio}
                onChangeText={setTempBio}
                textColor={palette.textPrimary}
                multiline
                numberOfLines={3}
                maxLength={160}
                mode="outlined"
                style={{ marginBottom: 12, backgroundColor: palette.glassInput }}
              />
            )}

            {fieldEditorModal === 'gender' && (
              <RadioButton.Group
                onValueChange={(val) => setTempGender(val as any)}
                value={tempGender}
              >
                {(
                  [
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                    { value: 'Other', label: 'Other' },
                    { value: '', label: 'Unspecified / Prefer not to say' },
                  ] as const
                ).map((opt) => (
                  <TouchableOpacity
                    key={opt.label}
                    onPress={() => setTempGender(opt.value)}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}
                  >
                    <RadioButton value={opt.value} color="#FE2C55" />
                    <Text style={{ fontSize: 14, color: palette.textPrimary }}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </RadioButton.Group>
            )}

            {fieldEditorModal === 'birthday' && (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <TextInput
                  label="Year (YYYY)"
                  value={tempBirthYear}
                  onChangeText={setTempBirthYear}
                  keyboardType="numeric"
                  maxLength={4}
                  textColor={palette.textPrimary}
                  mode="outlined"
                  dense
                  style={{ flex: 1.3, backgroundColor: palette.glassInput }}
                />
                <TextInput
                  label="Month (01-12)"
                  value={tempBirthMonth}
                  onChangeText={setTempBirthMonth}
                  keyboardType="numeric"
                  maxLength={2}
                  textColor={palette.textPrimary}
                  mode="outlined"
                  dense
                  style={{ flex: 1, backgroundColor: palette.glassInput }}
                />
                <TextInput
                  label="Day (01-31)"
                  value={tempBirthDay}
                  onChangeText={setTempBirthDay}
                  keyboardType="numeric"
                  maxLength={2}
                  textColor={palette.textPrimary}
                  mode="outlined"
                  dense
                  style={{ flex: 1, backgroundColor: palette.glassInput }}
                />
              </View>
            )}

            {fieldEditorModal === 'phone' && (
              <>
                <TextInput
                  label="Mobile Phone Number"
                  placeholder="e.g. +63 917 123 4567"
                  value={tempPhone}
                  onChangeText={setTempPhone}
                  keyboardType="phone-pad"
                  textColor={palette.textPrimary}
                  mode="outlined"
                  dense
                  style={{ marginBottom: 8, backgroundColor: palette.glassInput }}
                />
                <Button
                  mode="outlined"
                  icon="message-text-lock-outline"
                  textColor="#FE2C55"
                  style={{ borderColor: '#FE2C55', marginBottom: 10, borderRadius: 14 }}
                  onPress={handleRequestVerificationCode}
                >
                  Send OTP Code
                </Button>
                {otpRequested && (
                  <TextInput
                    label="Enter 6-Digit OTP"
                    value={otpInput}
                    onChangeText={setOtpInput}
                    keyboardType="numeric"
                    maxLength={6}
                    textColor={palette.textPrimary}
                    mode="outlined"
                    dense
                    style={{ marginBottom: 12, backgroundColor: palette.glassInput }}
                  />
                )}
              </>
            )}

            {fieldEditorModal === 'email' && (
              <>
                <TextInput
                  label="Email Address"
                  placeholder="you@example.com"
                  value={tempEmail}
                  onChangeText={setTempEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textColor={palette.textPrimary}
                  mode="outlined"
                  dense
                  style={{ marginBottom: 8, backgroundColor: palette.glassInput }}
                />
                <Button
                  mode="outlined"
                  icon="email-check-outline"
                  textColor="#FE2C55"
                  style={{ borderColor: '#FE2C55', marginBottom: 10, borderRadius: 14 }}
                  onPress={handleRequestVerificationCode}
                >
                  Send Email Verification Code
                </Button>
                {otpRequested && (
                  <TextInput
                    label="Enter 6-Digit Verification Code"
                    value={otpInput}
                    onChangeText={setOtpInput}
                    keyboardType="numeric"
                    maxLength={6}
                    textColor={palette.textPrimary}
                    mode="outlined"
                    dense
                    style={{ marginBottom: 12, backgroundColor: palette.glassInput }}
                  />
                )}
              </>
            )}

            {fieldEditorModal === 'username' && (
              <>
                <TextInput
                  label="New Username"
                  value={tempUsername}
                  onChangeText={handleCheckUsernameAvailability}
                  autoCapitalize="none"
                  textColor={palette.textPrimary}
                  mode="outlined"
                  dense
                  style={{ marginBottom: 6, backgroundColor: palette.glassInput }}
                />
                {usernameAvailable !== null && (
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: usernameAvailable ? palette.success : palette.danger,
                      marginBottom: 10,
                    }}
                  >
                    {usernameAvailable
                      ? 'Username is available.'
                      : 'Username is unavailable, reserved, or belongs to a deleted account.'}
                  </Text>
                )}
              </>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
              <Button
                mode="outlined"
                textColor={palette.textPrimary}
                style={{ borderColor: palette.border, borderRadius: 16 }}
                onPress={() => setFieldEditorModal(null)}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                buttonColor="#FE2C55"
                textColor="#FFFFFF"
                loading={updatingUser}
                disabled={updatingUser}
                style={[{ borderRadius: 16 }, webPrimaryButtonGradient]}
                onPress={handleSaveFieldEditor}
              >
                Save
              </Button>
            </View>
          </Card>
        </View>
      </Modal>

      {/* ==================== IDENTITY VERIFICATION MODAL ==================== */}
      <Modal
        visible={identityVerifyModal}
        animationType="fade"
        transparent
        onRequestClose={() => setIdentityVerifyModal(false)}
      >
        <View style={[styles.modalBackdrop, resolvedMobile && { paddingHorizontal: 10 }]}>
          <Card style={[styles.modalCard, { width: '100%', maxWidth: 420 }, webGlassStyle]}>
            <View style={styles.modalHeader}>
              <Title style={styles.modalTitle}>Verify Your Identity</Title>
              <IconButton
                icon="close"
                size={20}
                iconColor={palette.textPrimary}
                onPress={() => setIdentityVerifyModal(false)}
                style={{ margin: 0 }}
              />
            </View>
            <Text style={{ fontSize: 12.5, color: palette.textSecondary, marginBottom: 12 }}>
              Confirm your current password before changing sensitive account or payment settings.
            </Text>
            <TextInput
              mode="outlined"
              dense
              label="Current Password"
              value={identityPasswordInput}
              onChangeText={setIdentityPasswordInput}
              secureTextEntry
              textColor={palette.textPrimary}
              style={{ backgroundColor: palette.glassInput, marginBottom: 14 }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <Button
                mode="outlined"
                textColor={palette.textPrimary}
                style={{ borderColor: palette.border, borderRadius: 16 }}
                onPress={() => setIdentityVerifyModal(false)}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                buttonColor="#FE2C55"
                textColor="#FFFFFF"
                loading={verifyingIdentity}
                disabled={verifyingIdentity}
                style={[{ borderRadius: 16 }, webPrimaryButtonGradient]}
                onPress={handleConfirmIdentityVerification}
              >
                Verify
              </Button>
            </View>
          </Card>
        </View>
      </Modal>

      {/* ==================== CHANGE PASSWORD MODAL ==================== */}
      <Modal visible={changePasswordVisible} animationType="slide" transparent>
        <View style={[styles.modalBackdrop, resolvedMobile && { paddingHorizontal: 10 }]}>
          <Card style={[styles.modalCard, { width: '100%', maxWidth: 460 }, webGlassStyle]}>
            <View style={styles.modalHeader}>
              <Title style={styles.modalTitle}>Change Password</Title>
              <IconButton
                icon="close"
                size={20}
                iconColor={palette.textPrimary}
                onPress={() => setChangePasswordVisible(false)}
                style={{ margin: 0 }}
              />
            </View>

            <TextInput
              mode="outlined"
              dense
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrentPw}
              textColor={palette.textPrimary}
              style={{ backgroundColor: palette.glassInput, marginBottom: 8 }}
              right={
                <TextInput.Icon
                  icon={showCurrentPw ? 'eye-off' : 'eye'}
                  color={palette.textMuted}
                  onPress={() => setShowCurrentPw((p) => !p)}
                />
              }
            />

            <TextInput
              mode="outlined"
              dense
              label="New Password (min 6 characters)"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPw}
              textColor={palette.textPrimary}
              style={{ backgroundColor: palette.glassInput, marginBottom: 8 }}
              right={
                <TextInput.Icon
                  icon={showNewPw ? 'eye-off' : 'eye'}
                  color={palette.textMuted}
                  onPress={() => setShowNewPw((p) => !p)}
                />
              }
            />

            <TextInput
              mode="outlined"
              dense
              label="Confirm New Password"
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              secureTextEntry={!showNewPw}
              textColor={palette.textPrimary}
              style={{ backgroundColor: palette.glassInput, marginBottom: 14 }}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <Button
                mode="outlined"
                textColor={palette.textPrimary}
                style={{ borderColor: palette.border, borderRadius: 16 }}
                onPress={() => setChangePasswordVisible(false)}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                buttonColor="#FE2C55"
                textColor="#FFFFFF"
                loading={changingPassword}
                disabled={changingPassword}
                style={[{ borderRadius: 16 }, webPrimaryButtonGradient]}
                onPress={handleChangePassword}
              >
                Update Password
              </Button>
            </View>
          </Card>
        </View>
      </Modal>

      {/* ==================== PSGC REGION -> PROVINCE -> CITY -> BARANGAY MODAL ==================== */}
      <Modal visible={locationPickerVisible} animationType="slide" transparent>
        <View style={[styles.modalBackdrop, resolvedMobile && { paddingHorizontal: 10 }]}>
          <Card style={[styles.modalCard, { width: '100%', maxWidth: 700 }, webGlassStyle]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
                {pickerStep !== 'region' && (
                  <IconButton
                    icon="arrow-left"
                    iconColor={palette.textPrimary}
                    size={20}
                    style={{ margin: 0 }}
                    onPress={() => {
                      if (pickerStep === 'barangay') setPickerStep('city');
                      else if (pickerStep === 'city') setPickerStep('province');
                      else if (pickerStep === 'province') setPickerStep('region');
                    }}
                  />
                )}
                <Title
                  numberOfLines={1}
                  style={{ fontSize: 15.5, fontWeight: '800', color: palette.textPrimary, flex: 1 }}
                >
                  {pickerStep === 'region' && 'Select Region'}
                  {pickerStep === 'province' && 'Select Province / District'}
                  {pickerStep === 'city' && 'Select City / Municipality'}
                  {pickerStep === 'barangay' && 'Select Barangay'}
                </Title>
              </View>
              <IconButton
                icon="close"
                iconColor={palette.textPrimary}
                size={20}
                style={{ margin: 0 }}
                onPress={() => setLocationPickerVisible(false)}
              />
            </View>

            <TextInput
              mode="outlined"
              dense
              placeholder="Search CAR, La Trinidad, City of Baguio, city, district..."
              value={locationSearchQuery}
              onChangeText={setLocationSearchQuery}
              textColor={palette.textPrimary}
              placeholderTextColor={palette.textMuted}
              left={<TextInput.Icon icon="magnify" color="#FE2C55" />}
              right={
                locationSearchQuery ? (
                  <TextInput.Icon
                    icon="close"
                    color={palette.textMuted}
                    onPress={() => setLocationSearchQuery('')}
                  />
                ) : undefined
              }
              style={{ marginBottom: 8, backgroundColor: palette.glassInput }}
            />

            <Button
              mode="outlined"
              icon="crosshairs-gps"
              loading={locatingCurrent}
              disabled={locatingCurrent}
              onPress={handleUseCurrentLocation}
              textColor="#FE2C55"
              style={{
                borderColor: 'rgba(254, 44, 85, 0.28)',
                backgroundColor: 'rgba(254, 44, 85, 0.08)',
                marginBottom: 10,
                borderRadius: 14,
              }}
            >
              Use My Current Location
            </Button>

            {loadingPsgc ? (
              <View style={{ paddingVertical: 28, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#FE2C55" />
              </View>
            ) : (
              <ScrollView style={{ maxHeight: height * 0.45 }}>
                {locationSearchQuery.trim().length > 0 && pickerStep !== 'barangay' ? (
                  pickerPsgcMatches.map((loc, index) => (
                    <TouchableOpacity
                      key={`${loc.code}-${index}`}
                      onPress={() => {
                        if (loc.typeLabel === 'Region') {
                          setTempRegion(loc);
                          setLocationSearchQuery('');
                          setPickerStep('province');
                          fetchPsgcProvincesOrDistricts(loc);
                        } else {
                          handleSelectSearchedLocation(loc);
                        }
                      }}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: palette.border,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: palette.textPrimary }}>
                          {loc.name}
                        </Text>
                        <Text style={{ fontSize: 11, color: palette.textMuted }}>
                          {loc.typeLabel} · PSGC: {loc.code}
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={palette.textMuted}
                      />
                    </TouchableOpacity>
                  ))
                ) : (
                  <>
                    {pickerStep === 'region' &&
                      psgcRegions.map((reg) => (
                        <TouchableOpacity
                          key={reg.code}
                          onPress={() => {
                            setTempRegion(reg);
                            setPickerStep('province');
                            fetchPsgcProvincesOrDistricts(reg);
                          }}
                          style={{
                            paddingVertical: 12,
                            paddingHorizontal: 8,
                            borderBottomWidth: 1,
                            borderBottomColor: palette.border,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '600', color: palette.textPrimary, flex: 1 }}>
                            {reg.name}
                          </Text>
                          <MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} />
                        </TouchableOpacity>
                      ))}

                    {pickerStep === 'province' &&
                      psgcProvinces.map((prov) => (
                        <TouchableOpacity
                          key={prov.code}
                          onPress={() => {
                            setTempProvince(prov);
                            setPickerStep('city');
                            fetchPsgcCitiesMunicipalities(prov);
                          }}
                          style={{
                            paddingVertical: 12,
                            paddingHorizontal: 8,
                            borderBottomWidth: 1,
                            borderBottomColor: palette.border,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '600', color: palette.textPrimary }}>
                            {prov.name}
                          </Text>
                          <MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} />
                        </TouchableOpacity>
                      ))}

                    {pickerStep === 'city' &&
                      psgcCities.map((city) => (
                        <TouchableOpacity
                          key={city.code}
                          onPress={() => {
                            setTempCity(city);
                            setPickerStep('barangay');
                            fetchPsgcBarangays(city);
                          }}
                          style={{
                            paddingVertical: 12,
                            paddingHorizontal: 8,
                            borderBottomWidth: 1,
                            borderBottomColor: palette.border,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '600', color: palette.textPrimary }}>
                            {city.name}
                          </Text>
                          <MaterialCommunityIcons name="chevron-right" size={20} color={palette.textMuted} />
                        </TouchableOpacity>
                      ))}

                    {pickerStep === 'barangay' &&
                      psgcBarangays
                        .filter((b) =>
                          !locationSearchQuery.trim()
                            ? true
                            : b.name.toLowerCase().includes(locationSearchQuery.trim().toLowerCase())
                        )
                        .map((brgy) => (
                          <TouchableOpacity
                            key={brgy.code}
                            onPress={() => {
                              if (tempRegion && tempProvince && tempCity) {
                                setAddrRegion(tempRegion.name);
                                setAddrProvince(tempProvince.name);
                                setAddrCity(tempCity.name);
                                setAddrBarangay(brgy.name);
                                if (tempCity.code === '141110000' && !addrPostalCode) {
                                  setAddrPostalCode('2601');
                                } else if (tempCity.code === '141102000' && !addrPostalCode) {
                                  setAddrPostalCode('2600');
                                }
                              }
                              setLocationSearchQuery('');
                              setLocationPickerVisible(false);
                            }}
                            style={{
                              paddingVertical: 12,
                              paddingHorizontal: 8,
                              borderBottomWidth: 1,
                              borderBottomColor: palette.border,
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{ fontSize: 13, fontWeight: '600', color: palette.textPrimary }}>
                              {brgy.name}
                            </Text>
                            <MaterialCommunityIcons name="check-circle-outline" size={20} color="#FE2C55" />
                          </TouchableOpacity>
                        ))}
                  </>
                )}
              </ScrollView>
            )}
          </Card>
        </View>
      </Modal>
    </>
  );
}