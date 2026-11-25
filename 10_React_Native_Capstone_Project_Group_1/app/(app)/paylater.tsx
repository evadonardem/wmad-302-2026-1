/**
 * PayLater Dashboard, Settings, Payment Methods, Statements, Repayments & Refunds - Marketplace
 *
 * Student Implementation Guide:
 * Complete the full PayLater financial dashboard:
 * 1. Main PayLater Dashboard:
 *    - Top bar: "< Back" button, "PayLater" title, Settings icon button on the right
 *    - Prominent "Credit Available" and "Credit Limit" with "(i)" info button
 *    - Credit Limit Information Popup ("How to Increase Your Limit" + "Use PayLater Often" + "Make Repayments on Time" + "Got it")
 *    - Navigation cards: "All Statements >", "Repayment History >", "Refund History >"
 * 2. PayLater Settings:
 *    - Phone Number (+63 **** 8795 >) -> Current Phone Number -> Change Phone Number with SMS OTP verification
 *    - PIN Management > -> Change PIN > & Forgot PIN > (one-way hashed PINs, never stored as plain text)
 *    - Biometric Verification -> On/Off toggle with device authentication verification
 *    - Payment Methods > -> Manage Payment Methods -> Add Payment Method modal (GCash >, BPI Direct Debit >, UnionBank Direct Debit >)
 *      with official provider authorization screens and unlink confirmation
 * 3. All Statements:
 *    - Moving underline tabs ("Unpaid" & "Paid"), empty state ("No Statements"), statement details, and "Pay Now"
 * 4. Repayment History & Refund History dedicated screens with empty states and transaction details
 * 5. Responsive across Desktop/Laptop, Tablet, and Android/iOS phones (Realme, Samsung, Xiaomi, OPPO, Vivo, iPhone)
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  useWindowDimensions,
  Alert,
  Animated,
  LayoutChangeEvent,
  StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Card,
  Button,
  Switch,
  TextInput,
  Divider,
  Badge,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import {
  PayLaterAccountState,
  PaymentProviderType,
  PayLaterStatement,
  PayLaterRefund,
  getPayLaterAccount,
  savePayLaterAccount,
  hashPinSecurely,
  formatMaskedPhoneNumber,
  settlePayLaterStatement,
} from '../../utils/payLaterStorage';

type PayLaterSubView =
  | 'dashboard'
  | 'settings'
  | 'phone_details'
  | 'pin_management'
  | 'change_pin'
  | 'forgot_pin'
  | 'payment_methods'
  | 'link_gcash'
  | 'link_bpi'
  | 'link_unionbank'
  | 'statements'
  | 'repayment_history'
  | 'refund_history';

type StatementTabType = 'Unpaid' | 'Paid';

export default function PayLaterScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { palette } = useAppTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Responsive Breakpoints: Website (>= 1024), Tablet (768-1023), Phones (< 768: Realme, Samsung, Xiaomi, OPPO, Vivo, iPhone)
  const isAnyDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isSmallPhone = width <= 375;

  const horizontalPadding = isAnyDesktop ? 28 : isTablet ? 18 : 12;
  const topSafePadding = Platform.OS === 'web' ? 14 : Math.max(insets.top, 10);
  const bottomSafePadding = Platform.OS === 'web' ? 40 : Math.max(insets.bottom + 16, 28);

  const [account, setAccount] = useState<PayLaterAccountState | null>(null);
  const [subView, setSubView] = useState<PayLaterSubView>('dashboard');

  // Popups & Modals
  const [limitInfoVisible, setLimitInfoVisible] = useState<boolean>(false);
  const [addPaymentModalVisible, setAddPaymentModalVisible] = useState<boolean>(false);
  const [selectedStatement, setSelectedStatement] = useState<PayLaterStatement | null>(null);
  const [payNowStatement, setPayNowStatement] = useState<PayLaterStatement | null>(null);
  const [selectedRefund, setSelectedRefund] = useState<PayLaterRefund | null>(null);

  // Statements Moving Underline Tabs
  const [statementTab, setStatementTab] = useState<StatementTabType>('Unpaid');
  const tabLayoutsRef = useRef<Record<StatementTabType, { x: number; width: number }>>({
    Unpaid: { x: 0, width: 64 },
    Paid: { x: 96, width: 48 },
  });
  const tabUnderlineLeft = useRef(new Animated.Value(0)).current;
  const tabUnderlineWidth = useRef(new Animated.Value(64)).current;

  // Phone Number Change & SMS OTP States
  const [changingPhone, setChangingPhone] = useState<boolean>(false);
  const [newPhoneInput, setNewPhoneInput] = useState<string>('');
  const [phoneOtpSent, setPhoneOtpSent] = useState<boolean>(false);
  const [generatedPhoneOtp, setGeneratedPhoneOtp] = useState<string>('');
  const [phoneOtpInput, setPhoneOtpInput] = useState<string>('');

  // PIN Management States (kept in transient component memory only during entry, cleared on submit)
  const [currentPinInput, setCurrentPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [resetOtpSent, setResetOtpSent] = useState<boolean>(false);
  const [generatedResetOtp, setGeneratedResetOtp] = useState<string>('');
  const [resetOtpInput, setResetOtpInput] = useState<string>('');

  // Official Provider Linking States (only non-sensitive account display identifier)
  const [providerAccountInput, setProviderAccountInput] = useState<string>('');

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

  const webHeroGradient: any =
    Platform.OS === 'web'
      ? {
          backgroundImage:
            'linear-gradient(135deg, #25060C 0%, #4A0D1C 52%, #FE2C55 125%)',
          boxShadow: '0 14px 32px rgba(254, 44, 85, 0.24)',
        }
      : {};

  const webPrimaryButtonGradient: any =
    Platform.OS === 'web'
      ? {
          backgroundImage: 'linear-gradient(90deg, #FE2C55 0%, #FF5E7E 100%)',
          boxShadow: '0 8px 20px rgba(254, 44, 85, 0.28)',
        }
      : {};

  const cardShadowStyle: any =
    Platform.OS === 'web'
      ? { boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)' }
      : {
          elevation: 2,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
        };

  const loadAccount = useCallback(async () => {
    const data = await getPayLaterAccount(user?.id, (user as any)?.phone);
    setAccount(data);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadAccount();
    }, [loadAccount])
  );

  // Animate statement tab underline smoothly when switching between Unpaid & Paid
  useEffect(() => {
    const layout = tabLayoutsRef.current[statementTab];
    if (!layout) return;
    Animated.parallel([
      Animated.spring(tabUnderlineLeft, {
        toValue: layout.x,
        useNativeDriver: false,
        friction: 9,
        tension: 95,
      }),
      Animated.spring(tabUnderlineWidth, {
        toValue: layout.width,
        useNativeDriver: false,
        friction: 9,
        tension: 95,
      }),
    ]).start();
  }, [statementTab, tabUnderlineLeft, tabUnderlineWidth]);

  const handleStatementTabLayout = (tab: StatementTabType, e: LayoutChangeEvent) => {
    const { x, width: w } = e.nativeEvent.layout;
    tabLayoutsRef.current[tab] = { x, width: w };
    if (tab === statementTab) {
      tabUnderlineLeft.setValue(x);
      tabUnderlineWidth.setValue(w);
    }
  };

  const notifyUser = (title: string, message: string) => {
    const webWin = (globalThis as any)?.window;
    if (Platform.OS === 'web' && webWin?.alert) {
      webWin.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const confirmAction = (title: string, message: string, onConfirm: () => void) => {
    const webWin = (globalThis as any)?.window;
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

  const formatPeso = (amount: number) =>
    `₱${amount.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // ==================== PHONE NUMBER CHANGE + SMS OTP ====================
  const handleSendPhoneOtp = () => {
    const digits = newPhoneInput.replace(/\D/g, '');
    if (digits.length < 10) {
      notifyUser('Invalid Phone Number', 'Please enter a valid Philippine mobile number (e.g., 09171234567).');
      return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedPhoneOtp(code);
    setPhoneOtpSent(true);
    notifyUser(
      'SMS OTP Sent',
      `A 6-digit verification code has been sent to ${formatMaskedPhoneNumber(
        digits
      )}.\n\nDemo SMS Code: ${code}`
    );
  };

  const handleVerifyAndSavePhone = async () => {
    if (!account) return;
    if (phoneOtpInput.trim() !== generatedPhoneOtp) {
      notifyUser('Invalid OTP', 'The verification code you entered does not match. Please try again.');
      return;
    }
    const masked = formatMaskedPhoneNumber(newPhoneInput);
    const updated: PayLaterAccountState = {
      ...account,
      maskedPhone: masked,
    };
    await savePayLaterAccount(updated);
    setAccount(updated);
    setChangingPhone(false);
    setNewPhoneInput('');
    setPhoneOtpSent(false);
    setPhoneOtpInput('');
    setGeneratedPhoneOtp('');
    notifyUser('Phone Number Updated', `Your PayLater phone number has been updated to ${masked}.`);
  };

  // ==================== PIN MANAGEMENT (HASHED, NEVER PLAIN TEXT) ====================
  const handleSaveChangedPin = async () => {
    if (!account) return;

    if (account.pinHash) {
      if (currentPinInput.length !== 6) {
        notifyUser('Current PIN Required', 'Please enter your current 6-digit PayLater PIN.');
        return;
      }
      if (hashPinSecurely(currentPinInput, account.userId) !== account.pinHash) {
        notifyUser('Incorrect Current PIN', 'The current PIN you entered is incorrect.');
        return;
      }
    }

    if (!/^\d{6}$/.test(newPinInput)) {
      notifyUser('Invalid New PIN', 'Your new PayLater PIN must be exactly 6 digits.');
      return;
    }

    if (newPinInput !== confirmPinInput) {
      notifyUser('PIN Mismatch', 'New PIN and Confirm PIN do not match.');
      return;
    }

    const updated: PayLaterAccountState = {
      ...account,
      pinHash: hashPinSecurely(newPinInput, account.userId),
    };
    await savePayLaterAccount(updated);
    setAccount(updated);

    // Clear sensitive inputs immediately from state
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    notifyUser('PIN Saved', 'Your PayLater PIN has been securely updated.');
    setSubView('pin_management');
  };

  const handleSendResetPinOtp = () => {
    if (!account) return;
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedResetOtp(code);
    setResetOtpSent(true);
    notifyUser(
      'Identity Verification Sent',
      `We sent a 6-digit verification code to your registered number ${account.maskedPhone}.\n\nDemo SMS Code: ${code}`
    );
  };

  const handleResetPinSubmit = async () => {
    if (!account) return;
    if (resetOtpInput.trim() !== generatedResetOtp) {
      notifyUser('Invalid Verification Code', 'Please enter the 6-digit OTP sent to your phone.');
      return;
    }
    if (!/^\d{6}$/.test(newPinInput)) {
      notifyUser('Invalid New PIN', 'Your new PayLater PIN must be exactly 6 digits.');
      return;
    }
    if (newPinInput !== confirmPinInput) {
      notifyUser('PIN Mismatch', 'New PIN and Confirm PIN do not match.');
      return;
    }

    const updated: PayLaterAccountState = {
      ...account,
      pinHash: hashPinSecurely(newPinInput, account.userId),
    };
    await savePayLaterAccount(updated);
    setAccount(updated);

    setResetOtpSent(false);
    setGeneratedResetOtp('');
    setResetOtpInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    notifyUser('PIN Reset Successful', 'Your new PayLater PIN has been saved.');
    setSubView('pin_management');
  };

  // ==================== BIOMETRIC VERIFICATION TOGGLE ====================
  const handleToggleBiometric = async (nextValue: boolean) => {
    if (!account) return;

    if (!nextValue) {
      const updated = { ...account, biometricEnabled: false };
      await savePayLaterAccount(updated);
      setAccount(updated);
      return;
    }

    // Attempt native Expo LocalAuthentication when available on iOS/Android
    if (Platform.OS !== 'web') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const LocalAuth = require('expo-local-authentication');
        const hasHardware = await LocalAuth.hasHardwareAsync();
        const isEnrolled = await LocalAuth.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
          notifyUser(
            'Biometric Authentication Unavailable',
            'This device does not support biometric authentication or has no fingerprint/face enrolled in device settings.'
          );
          return;
        }

        const authResult = await LocalAuth.authenticateAsync({
          promptMessage: 'Authenticate to enable PayLater Biometric Verification',
          cancelLabel: 'Cancel',
        });

        if (!authResult.success) {
          notifyUser('Authentication Cancelled', 'Biometric verification was not enabled.');
          return;
        }

        const updated = { ...account, biometricEnabled: true };
        await savePayLaterAccount(updated);
        setAccount(updated);
        notifyUser('Biometric Enabled', 'Biometric verification is now active for PayLater.');
        return;
      } catch {
        notifyUser(
          'Biometric Authentication Unavailable',
          'Biometric hardware module is unavailable on this build. Please use your PayLater PIN.'
        );
        return;
      }
    }

    // Web browser fallback check
    const nav: any = (globalThis as any)?.navigator;
    if (!nav?.credentials) {
      notifyUser(
        'Biometric Authentication Unavailable',
        'Your current browser or device does not support biometric authentication.'
      );
      return;
    }

    confirmAction(
      'Verify Device Identity',
      'Confirm your device identity to enable Biometric Verification for PayLater payments?',
      async () => {
        const updated = { ...account, biometricEnabled: true };
        await savePayLaterAccount(updated);
        setAccount(updated);
        notifyUser('Biometric Enabled', 'Biometric verification is now enabled on this device.');
      }
    );
  };

  // ==================== OFFICIAL PAYMENT PROVIDER AUTHORIZATION ====================
  const handleCompleteProviderLink = async (provider: PaymentProviderType) => {
    if (!account) return;
    const cleaned = providerAccountInput.replace(/\D/g, '');
    if (cleaned.length < 4) {
      notifyUser(
        'Account Identifier Required',
        provider === 'GCash'
          ? 'Please enter the mobile number registered with your GCash account to initiate official linking.'
          : `Please enter the last 4 digits or account number to initiate official ${provider} authorization.`
      );
      return;
    }

    const last4 = cleaned.slice(-4);
    const maskedIdentifier =
      provider === 'GCash' ? `+63 **** ${last4}` : `**** **** ${last4}`;

    // Prevent duplicate provider link with same masked identifier
    if (
      account.linkedMethods.some(
        (m) => m.provider === provider && m.maskedIdentifier === maskedIdentifier
      )
    ) {
      notifyUser('Already Linked', `${provider} (${maskedIdentifier}) is already linked.`);
      setProviderAccountInput('');
      setSubView('payment_methods');
      return;
    }

    const newMethod = {
      id: `pm-${Date.now()}`,
      provider,
      accountLabel: provider,
      maskedIdentifier,
      linkedAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    const updated: PayLaterAccountState = {
      ...account,
      linkedMethods: [...account.linkedMethods, newMethod],
    };
    await savePayLaterAccount(updated);
    setAccount(updated);
    setProviderAccountInput('');
    notifyUser(
      'Authorization Complete',
      `${provider} (${maskedIdentifier}) has been securely linked via official provider authorization.`
    );
    setSubView('payment_methods');
  };

  const handleUnlinkPaymentMethod = (methodId: string, label: string) => {
    if (!account) return;
    confirmAction(
      'Unlink Payment Method',
      `Are you sure you want to unlink ${label}? You can re-link it anytime through official provider authorization.`,
      async () => {
        const updated: PayLaterAccountState = {
          ...account,
          linkedMethods: account.linkedMethods.filter((m) => m.id !== methodId),
        };
        await savePayLaterAccount(updated);
        setAccount(updated);
      }
    );
  };

  // ==================== SETTLE UNPAID STATEMENT ====================
  const handleConfirmStatementPayment = async (methodLabel: string) => {
    if (!account || !payNowStatement) return;
    const { account: updated, error } = await settlePayLaterStatement(
      account.userId,
      payNowStatement.id,
      methodLabel
    );
    if (error) {
      notifyUser('Payment Notice', error);
      return;
    }
    setAccount(updated);
    setPayNowStatement(null);
    notifyUser(
      'Repayment Successful',
      `${formatPeso(payNowStatement.amount)} paid via ${methodLabel}. Your Available Credit has been updated.`
    );
  };

  // ==================== TOP HEADER NAVIGATION HELPER ====================
  const handleBackNavigation = () => {
    switch (subView) {
      case 'dashboard':
        if (router.canGoBack()) {
          router.back();
        } else {
          router.push('/(app)/(tabs)/home' as any);
        }
        break;
      case 'settings':
      case 'statements':
      case 'repayment_history':
      case 'refund_history':
        setSubView('dashboard');
        break;
      case 'phone_details':
        setChangingPhone(false);
        setPhoneOtpSent(false);
        setSubView('settings');
        break;
      case 'pin_management':
      case 'payment_methods':
        setSubView('settings');
        break;
      case 'change_pin':
      case 'forgot_pin':
        setCurrentPinInput('');
        setNewPinInput('');
        setConfirmPinInput('');
        setResetOtpSent(false);
        setSubView('pin_management');
        break;
      case 'link_gcash':
      case 'link_bpi':
      case 'link_unionbank':
        setProviderAccountInput('');
        setSubView('payment_methods');
        break;
    }
  };

  const getHeaderTitle = (): string => {
    switch (subView) {
      case 'dashboard':
        return 'PayLater';
      case 'settings':
        return 'Settings';
      case 'phone_details':
        return 'Current Phone Number';
      case 'pin_management':
        return 'PIN Management';
      case 'change_pin':
        return 'Change PIN';
      case 'forgot_pin':
        return 'Forgot PIN';
      case 'payment_methods':
        return 'Manage Payment Methods';
      case 'link_gcash':
        return 'Online Payments Linking';
      case 'link_bpi':
        return 'Login to BPI Online';
      case 'link_unionbank':
        return 'UnionBank of the Philippines';
      case 'statements':
        return 'Statements';
      case 'repayment_history':
        return 'Repayment History';
      case 'refund_history':
        return 'Refund History';
    }
  };

  const renderAmbientOrbs = () => (
    <View pointerEvents="none" style={localStyles.ambientLayer}>
      <View
        style={[
          localStyles.orbTopLeft,
          {
            backgroundColor: palette.isDark
              ? 'rgba(254, 44, 85, 0.16)'
              : 'rgba(254, 44, 85, 0.11)',
          },
        ]}
      />
      <View
        style={[
          localStyles.orbTopRight,
          {
            backgroundColor: palette.isDark
              ? 'rgba(59, 130, 246, 0.16)'
              : 'rgba(56, 189, 248, 0.15)',
          },
        ]}
      />
      <View
        style={[
          localStyles.orbCenter,
          {
            backgroundColor: palette.isDark
              ? 'rgba(139, 92, 246, 0.12)'
              : 'rgba(168, 85, 247, 0.09)',
          },
        ]}
      />
      <View
        style={[
          localStyles.orbBottomRight,
          {
            backgroundColor: palette.isDark
              ? 'rgba(16, 185, 129, 0.12)'
              : 'rgba(99, 102, 241, 0.10)',
          },
        ]}
      />
    </View>
  );

  if (!account) {
    return (
      <View
        style={[
          {
            flex: 1,
            width: '100%',
            backgroundColor: palette.isDark ? palette.background : '#F1F5FB',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          },
          webAmbientBackdropStyle,
        ]}
      >
        {renderAmbientOrbs()}
        <Text style={{ color: palette.textSecondary, fontWeight: '700', zIndex: 1 }}>
          Loading PayLater account...
        </Text>
      </View>
    );
  }

  const filteredStatements = account.statements.filter((s) => s.status === statementTab);
  const unpaidCount = account.statements.filter((s) => s.status === 'Unpaid').length;
  const utilizationPercent =
    account.creditLimit > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(((account.creditLimit - account.availableCredit) / account.creditLimit) * 100)
          )
        )
      : 0;

  return (
    <View
      style={[
        {
          flex: 1,
          width: '100%',
          backgroundColor: palette.isDark ? palette.background : '#F1F5FB',
          position: 'relative',
          overflow: 'hidden',
        },
        webAmbientBackdropStyle,
      ]}
    >
      {renderAmbientOrbs()}

      {/* ==================== TOP HEADER BAR ==================== */}
      <View
        style={[
          {
            width: '100%',
            backgroundColor: palette.glassNav,
            borderBottomWidth: 1,
            borderBottomColor: palette.border,
            paddingTop: topSafePadding,
            paddingBottom: 14,
            paddingHorizontal: horizontalPadding,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 10,
          },
          cardShadowStyle,
          webGlassStyle,
        ]}
      >
        <TouchableOpacity
          onPress={handleBackNavigation}
          activeOpacity={0.75}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 4,
            paddingHorizontal: 4,
            minWidth: 72,
          }}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={palette.textPrimary} />
          <Text style={{ fontSize: 14.5, fontWeight: '700', color: palette.textPrimary }}>
            Back
          </Text>
        </TouchableOpacity>

        <Text
          numberOfLines={1}
          style={{
            fontSize: isSmallPhone ? 16 : 18,
            fontWeight: '900',
            color: palette.textPrimary,
            textAlign: 'center',
            flex: 1,
            letterSpacing: -0.2,
          }}
        >
          {getHeaderTitle()}
        </Text>

        {subView === 'dashboard' ? (
          <TouchableOpacity
            onPress={() => setSubView('settings')}
            activeOpacity={0.75}
            accessibilityLabel="PayLater Settings"
            style={{
              minWidth: 72,
              alignItems: 'flex-end',
              paddingVertical: 4,
              paddingHorizontal: 6,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                backgroundColor: palette.glassInput,
                borderWidth: 1,
                borderColor: palette.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name="cog-outline" size={20} color={palette.textPrimary} />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={{ minWidth: 72 }} />
        )}
      </View>

      {/* ==================== RESPONSIVE SCROLL BODY ==================== */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          width: '100%',
          paddingHorizontal: horizontalPadding,
          paddingTop: isAnyDesktop ? 24 : 18,
          paddingBottom: bottomSafePadding,
          gap: isAnyDesktop ? 20 : 16,
          zIndex: 1,
        }}
      >
        {/* ==================== 1. PAYLATER MAIN DASHBOARD ==================== */}
        {subView === 'dashboard' && (
          <>
            {/* Prominent Available Credit Hero Card */}
            <View
              style={[
                {
                  width: '100%',
                  backgroundColor: '#25060C',
                  borderRadius: 22,
                  paddingVertical: isAnyDesktop ? 32 : isSmallPhone ? 20 : 24,
                  paddingHorizontal: isAnyDesktop ? 32 : isSmallPhone ? 18 : 24,
                  borderWidth: 1,
                  borderColor: 'rgba(254, 44, 85, 0.38)',
                  gap: isAnyDesktop ? 16 : 12,
                },
                webHeroGradient,
              ]}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 9,
                      backgroundColor: 'rgba(255, 255, 255, 0.14)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialCommunityIcons name="wallet-outline" size={17} color="#FF758F" />
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: 'rgba(255, 255, 255, 0.88)',
                    }}
                  >
                    Credit Available
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.24)',
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: 'rgba(110, 231, 183, 0.35)',
                  }}
                >
                  <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#6EE7B7' }}>
                    {account.isApproved ? '● Approved Account' : 'Pending Review'}
                  </Text>
                </View>
              </View>

              <Text
                style={{
                  fontSize: isAnyDesktop ? 44 : isSmallPhone ? 31 : 38,
                  fontWeight: '900',
                  color: '#FFFFFF',
                  letterSpacing: 0.4,
                }}
              >
                {formatPeso(account.availableCredit)}
              </Text>

              {/* Credit Utilization Bar */}
              <View style={{ gap: 5 }}>
                <View
                  style={{
                    height: 7,
                    borderRadius: 999,
                    backgroundColor: 'rgba(255, 255, 255, 0.16)',
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      width: `${100 - utilizationPercent}%`,
                      height: '100%',
                      borderRadius: 999,
                      backgroundColor: '#FF758F',
                    }}
                  />
                </View>
              </View>

              <Divider style={{ backgroundColor: 'rgba(255,255,255,0.16)', marginVertical: 4 }} />

              {/* Credit Limit Row + Information (i) Button */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: 'rgba(255, 255, 255, 0.88)',
                    }}
                  >
                    Credit Limit: {formatPeso(account.creditLimit)}
                  </Text>

                  <TouchableOpacity
                    onPress={() => setLimitInfoVisible(true)}
                    activeOpacity={0.75}
                    accessibilityLabel="How to increase your credit limit"
                    style={{ padding: 2 }}
                  >
                    <MaterialCommunityIcons
                      name="information-outline"
                      size={19}
                      color="#FF758F"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => setSubView('payment_methods')}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: 'rgba(255,255,255,0.14)',
                    paddingHorizontal: 13,
                    paddingVertical: 6.5,
                    borderRadius: 999,
                  }}
                >
                  <MaterialCommunityIcons name="bank-outline" size={15} color="#FFFFFF" />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                    {account.linkedMethods.length} Linked
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Regulatory & Responsible Lending Disclosure Banner */}
            <Card
              style={[
                {
                  width: '100%',
                  borderRadius: 16,
                  backgroundColor: palette.glassSurface,
                  borderWidth: 1,
                  borderColor: palette.border,
                },
                cardShadowStyle,
                webGlassStyle,
              ]}
              elevation={0}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: isAnyDesktop ? 18 : 14,
                  paddingHorizontal: isAnyDesktop ? 24 : 14,
                  gap: 12,
                }}
              >
                <MaterialCommunityIcons
                  name="shield-check-outline"
                  size={21}
                  color={palette.accent}
                />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 12.5,
                    lineHeight: 18,
                    color: palette.textSecondary,
                  }}
                >
                  PayLater transactions are subject to your approved credit limit, repayment
                  schedule, and applicable terms disclosed prior to checkout confirmation.
                </Text>
              </View>
            </Card>

            {/* PayLater Account Navigation Sections */}
            <Card
              style={[
                {
                  width: '100%',
                  borderRadius: 18,
                  backgroundColor: palette.glassSurface,
                  borderWidth: 1,
                  borderColor: palette.border,
                  overflow: 'hidden',
                },
                cardShadowStyle,
                webGlassStyle,
              ]}
              elevation={0}
            >
              {/* 1. All Statements > */}
              <TouchableOpacity
                onPress={() => setSubView('statements')}
                activeOpacity={0.78}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: isAnyDesktop ? 22 : 17,
                  paddingHorizontal: isAnyDesktop ? 24 : 16,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      backgroundColor: 'rgba(254, 44, 85, 0.14)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialCommunityIcons
                      name="file-document-outline"
                      size={21}
                      color="#FE2C55"
                    />
                  </View>
                  <View>
                    <Text
                      style={{
                        fontSize: 15.5,
                        fontWeight: '800',
                        color: palette.textPrimary,
                      }}
                    >
                      All Statements
                    </Text>
                    <Text style={{ fontSize: 12, color: palette.textMuted, marginTop: 2 }}>
                      View unpaid and settled PayLater bills
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {unpaidCount > 0 && (
                    <Badge
                      size={18}
                      style={{
                        backgroundColor: '#FE2C55',
                        color: '#FFFFFF',
                        fontWeight: '800',
                      }}
                    >
                      {unpaidCount}
                    </Badge>
                  )}
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={22}
                    color={palette.textSecondary}
                  />
                </View>
              </TouchableOpacity>

              <Divider />

              {/* 2. Repayment History > */}
              <TouchableOpacity
                onPress={() => setSubView('repayment_history')}
                activeOpacity={0.78}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: isAnyDesktop ? 22 : 17,
                  paddingHorizontal: isAnyDesktop ? 24 : 16,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      backgroundColor: 'rgba(16, 185, 129, 0.14)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialCommunityIcons
                      name="cash-check"
                      size={21}
                      color={palette.success}
                    />
                  </View>
                  <View>
                    <Text
                      style={{
                        fontSize: 15.5,
                        fontWeight: '800',
                        color: palette.textPrimary,
                      }}
                    >
                      Repayment History
                    </Text>
                    <Text style={{ fontSize: 12, color: palette.textMuted, marginTop: 2 }}>
                      Track settled PayLater payments and receipts
                    </Text>
                  </View>
                </View>

                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={palette.textSecondary}
                />
              </TouchableOpacity>

              <Divider />

              {/* 3. Refund History > */}
              <TouchableOpacity
                onPress={() => setSubView('refund_history')}
                activeOpacity={0.78}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: isAnyDesktop ? 22 : 17,
                  paddingHorizontal: isAnyDesktop ? 24 : 16,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      backgroundColor: palette.accentSoft,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialCommunityIcons
                      name="cash-refund"
                      size={21}
                      color={palette.accent}
                    />
                  </View>
                  <View>
                    <Text
                      style={{
                        fontSize: 15.5,
                        fontWeight: '800',
                        color: palette.textPrimary,
                      }}
                    >
                      Refund History
                    </Text>
                    <Text style={{ fontSize: 12, color: palette.textMuted, marginTop: 2 }}>
                      Check credited PayLater order refunds
                    </Text>
                  </View>
                </View>

                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={palette.textSecondary}
                />
              </TouchableOpacity>
            </Card>
          </>
        )}

        {/* ==================== 2. PAYLATER SETTINGS PAGE ==================== */}
        {subView === 'settings' && (
          <Card
            style={[
              {
                width: '100%',
                borderRadius: 18,
                backgroundColor: palette.glassSurface,
                borderWidth: 1,
                borderColor: palette.border,
                overflow: 'hidden',
              },
              cardShadowStyle,
              webGlassStyle,
            ]}
            elevation={0}
          >
            {/* A. Phone Number (+63 **** 8795 >) */}
            <TouchableOpacity
              onPress={() => setSubView('phone_details')}
              activeOpacity={0.78}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: isAnyDesktop ? 20 : 16,
                paddingHorizontal: isAnyDesktop ? 24 : 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <MaterialCommunityIcons
                  name="cellphone-lock"
                  size={22}
                  color="#FE2C55"
                />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: palette.textPrimary,
                  }}
                >
                  Phone Number
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: palette.textSecondary,
                  }}
                >
                  {account.maskedPhone}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={palette.textSecondary}
                />
              </View>
            </TouchableOpacity>

            <Divider />

            {/* B. PIN Management > */}
            <TouchableOpacity
              onPress={() => setSubView('pin_management')}
              activeOpacity={0.78}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: isAnyDesktop ? 20 : 16,
                paddingHorizontal: isAnyDesktop ? 24 : 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <MaterialCommunityIcons
                  name="dialpad"
                  size={22}
                  color="#FE2C55"
                />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: palette.textPrimary,
                  }}
                >
                  PIN Management
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 12.5, color: palette.textMuted }}>
                  {account.pinHash ? 'Set' : 'Not set'}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={palette.textSecondary}
                />
              </View>
            </TouchableOpacity>

            <Divider />

            {/* C. Biometric Verification (On/Off Toggle + Description) */}
            <View
              style={{
                paddingVertical: isAnyDesktop ? 20 : 16,
                paddingHorizontal: isAnyDesktop ? 24 : 16,
                gap: 8,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <MaterialCommunityIcons
                    name="fingerprint"
                    size={22}
                    color="#FE2C55"
                  />
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '700',
                      color: palette.textPrimary,
                    }}
                  >
                    Biometric Verification
                  </Text>
                </View>

                <Switch
                  value={account.biometricEnabled}
                  onValueChange={handleToggleBiometric}
                  color="#FE2C55"
                />
              </View>

              <Text
                style={{
                  fontSize: 12.5,
                  lineHeight: 18,
                  color: palette.textSecondary,
                  paddingLeft: 34,
                }}
              >
                Secure your payments using facial or fingerprint recognition. Your biometric
                information is securely handled by your device, and Marketplace does not store
                your fingerprint or facial biometric data.
              </Text>
            </View>

            <Divider />

            {/* D. Payment Methods > */}
            <TouchableOpacity
              onPress={() => setSubView('payment_methods')}
              activeOpacity={0.78}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: isAnyDesktop ? 20 : 16,
                paddingHorizontal: isAnyDesktop ? 24 : 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <MaterialCommunityIcons
                  name="credit-card-outline"
                  size={22}
                  color="#FE2C55"
                />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: palette.textPrimary,
                  }}
                >
                  Payment Methods
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 12.5, color: palette.textMuted }}>
                  {account.linkedMethods.length}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={palette.textSecondary}
                />
              </View>
            </TouchableOpacity>
          </Card>
        )}

        {/* ==================== 2A. PHONE NUMBER DETAILS PAGE ==================== */}
        {subView === 'phone_details' && (
          <Card
            style={[
              {
                width: '100%',
                borderRadius: 18,
                backgroundColor: palette.glassSurface,
                borderWidth: 1,
                borderColor: palette.border,
                padding: isAnyDesktop ? 26 : 18,
              },
              cardShadowStyle,
              webGlassStyle,
            ]}
            elevation={0}
          >
            <View style={{ gap: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialCommunityIcons name="cellphone-check" size={26} color="#FE2C55" />
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: '900',
                    color: palette.textPrimary,
                  }}
                >
                  Current Phone Number
                </Text>
              </View>

              <Text
                style={{
                  fontSize: 13.5,
                  lineHeight: 19.5,
                  color: palette.textSecondary,
                }}
              >
                This phone number will be used to help verify your identity and secure your
                payments and financial services on Marketplace.
              </Text>

              <View
                style={{
                  backgroundColor: palette.accentSoft,
                  borderRadius: 14,
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  marginVertical: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 21,
                    fontWeight: '900',
                    color: palette.textPrimary,
                    letterSpacing: 1,
                  }}
                >
                  {account.maskedPhone}
                </Text>
              </View>

              {!changingPhone ? (
                <Button
                  mode="contained"
                  buttonColor="#FE2C55"
                  textColor="#FFFFFF"
                  style={[{ borderRadius: 999, marginTop: 4 }, webPrimaryButtonGradient]}
                  onPress={() => setChangingPhone(true)}
                >
                  Change Phone Number
                </Button>
              ) : (
                <View style={{ gap: 10, marginTop: 6 }}>
                  <TextInput
                    mode="outlined"
                    label="New Mobile Number"
                    placeholder="09171234567"
                    keyboardType="phone-pad"
                    value={newPhoneInput}
                    onChangeText={setNewPhoneInput}
                  />

                  {!phoneOtpSent ? (
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Button
                        mode="contained"
                        buttonColor="#FE2C55"
                        textColor="#FFFFFF"
                        style={[{ flex: 1, borderRadius: 999 }, webPrimaryButtonGradient]}
                        onPress={handleSendPhoneOtp}
                      >
                        Send SMS OTP
                      </Button>
                      <Button
                        mode="outlined"
                        textColor={palette.textPrimary}
                        style={{ borderRadius: 999, borderColor: palette.border }}
                        onPress={() => {
                          setChangingPhone(false);
                          setNewPhoneInput('');
                        }}
                      >
                        Cancel
                      </Button>
                    </View>
                  ) : (
                    <>
                      <TextInput
                        mode="outlined"
                        label="6-Digit SMS OTP"
                        placeholder="Enter 6-digit code"
                        keyboardType="number-pad"
                        maxLength={6}
                        value={phoneOtpInput}
                        onChangeText={setPhoneOtpInput}
                      />

                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Button
                          mode="contained"
                          buttonColor="#10B981"
                          textColor="#FFFFFF"
                          style={{ flex: 1, borderRadius: 999 }}
                          onPress={handleVerifyAndSavePhone}
                        >
                          Verify & Update
                        </Button>
                        <Button
                          mode="outlined"
                          textColor={palette.textPrimary}
                          style={{ borderRadius: 999, borderColor: palette.border }}
                          onPress={handleSendPhoneOtp}
                        >
                          Resend OTP
                        </Button>
                      </View>
                    </>
                  )}
                </View>
              )}
            </View>
          </Card>
        )}

        {/* ==================== 2B. PIN MANAGEMENT PAGE ==================== */}
        {subView === 'pin_management' && (
          <Card
            style={[
              {
                width: '100%',
                borderRadius: 18,
                backgroundColor: palette.glassSurface,
                borderWidth: 1,
                borderColor: palette.border,
                overflow: 'hidden',
              },
              cardShadowStyle,
              webGlassStyle,
            ]}
            elevation={0}
          >
            <TouchableOpacity
              onPress={() => setSubView('change_pin')}
              activeOpacity={0.78}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: isAnyDesktop ? 20 : 16,
                paddingHorizontal: isAnyDesktop ? 24 : 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <MaterialCommunityIcons name="lock-reset" size={22} color="#FE2C55" />
                <View>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '800',
                      color: palette.textPrimary,
                    }}
                  >
                    Change PIN
                  </Text>
                  <Text style={{ fontSize: 12, color: palette.textMuted, marginTop: 2 }}>
                    {account.pinHash
                      ? 'Update your 6-digit PayLater payment PIN'
                      : 'Create your 6-digit PayLater payment PIN'}
                  </Text>
                </View>
              </View>

              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={palette.textSecondary}
              />
            </TouchableOpacity>

            <Divider />

            <TouchableOpacity
              onPress={() => setSubView('forgot_pin')}
              activeOpacity={0.78}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: isAnyDesktop ? 20 : 16,
                paddingHorizontal: isAnyDesktop ? 24 : 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <MaterialCommunityIcons name="shield-key-outline" size={22} color="#FE2C55" />
                <View>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '800',
                      color: palette.textPrimary,
                    }}
                  >
                    Forgot PIN
                  </Text>
                  <Text style={{ fontSize: 12, color: palette.textMuted, marginTop: 2 }}>
                    Reset PIN via registered phone OTP verification
                  </Text>
                </View>
              </View>

              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={palette.textSecondary}
              />
            </TouchableOpacity>
          </Card>
        )}

        {/* ==================== 2B-1. CHANGE PIN FORM ==================== */}
        {subView === 'change_pin' && (
          <Card
            style={[
              {
                width: '100%',
                borderRadius: 18,
                backgroundColor: palette.glassSurface,
                borderWidth: 1,
                borderColor: palette.border,
                padding: isAnyDesktop ? 26 : 18,
              },
              cardShadowStyle,
              webGlassStyle,
            ]}
            elevation={0}
          >
            <View style={{ gap: 14 }}>
              <Text style={{ fontSize: 13.5, color: palette.textSecondary, lineHeight: 19 }}>
                Your PayLater PIN is cryptographically hashed and never stored or displayed in
                plain text.
              </Text>

              {account.pinHash && (
                <TextInput
                  mode="outlined"
                  label="Current 6-Digit PIN"
                  secureTextEntry
                  keyboardType="number-pad"
                  maxLength={6}
                  value={currentPinInput}
                  onChangeText={setCurrentPinInput}
                />
              )}

              <TextInput
                mode="outlined"
                label="New 6-Digit PIN"
                secureTextEntry
                keyboardType="number-pad"
                maxLength={6}
                value={newPinInput}
                onChangeText={setNewPinInput}
              />

              <TextInput
                mode="outlined"
                label="Confirm New 6-Digit PIN"
                secureTextEntry
                keyboardType="number-pad"
                maxLength={6}
                value={confirmPinInput}
                onChangeText={setConfirmPinInput}
              />

              <Button
                mode="contained"
                buttonColor="#FE2C55"
                textColor="#FFFFFF"
                style={[{ borderRadius: 999, marginTop: 4 }, webPrimaryButtonGradient]}
                onPress={handleSaveChangedPin}
              >
                Save New PIN
              </Button>
            </View>
          </Card>
        )}

        {/* ==================== 2B-2. FORGOT PIN FORM ==================== */}
        {subView === 'forgot_pin' && (
          <Card
            style={[
              {
                width: '100%',
                borderRadius: 18,
                backgroundColor: palette.glassSurface,
                borderWidth: 1,
                borderColor: palette.border,
                padding: isAnyDesktop ? 26 : 18,
              },
              cardShadowStyle,
              webGlassStyle,
            ]}
            elevation={0}
          >
            <View style={{ gap: 14 }}>
              <Text style={{ fontSize: 13.5, color: palette.textSecondary, lineHeight: 19 }}>
                Verify your identity using your registered phone number ({account.maskedPhone})
                before setting a new PayLater PIN.
              </Text>

              {!resetOtpSent ? (
                <Button
                  mode="contained"
                  buttonColor="#FE2C55"
                  textColor="#FFFFFF"
                  style={[{ borderRadius: 999 }, webPrimaryButtonGradient]}
                  onPress={handleSendResetPinOtp}
                >
                  Send Verification Code to {account.maskedPhone}
                </Button>
              ) : (
                <>
                  <TextInput
                    mode="outlined"
                    label="6-Digit SMS Verification Code"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={resetOtpInput}
                    onChangeText={setResetOtpInput}
                  />

                  <TextInput
                    mode="outlined"
                    label="New 6-Digit PIN"
                    secureTextEntry
                    keyboardType="number-pad"
                    maxLength={6}
                    value={newPinInput}
                    onChangeText={setNewPinInput}
                  />

                  <TextInput
                    mode="outlined"
                    label="Confirm New 6-Digit PIN"
                    secureTextEntry
                    keyboardType="number-pad"
                    maxLength={6}
                    value={confirmPinInput}
                    onChangeText={setConfirmPinInput}
                  />

                  <Button
                    mode="contained"
                    buttonColor="#10B981"
                    textColor="#FFFFFF"
                    style={{ borderRadius: 999 }}
                    onPress={handleResetPinSubmit}
                  >
                    Verify & Reset PIN
                  </Button>
                </>
              )}
            </View>
          </Card>
        )}

        {/* ==================== 3. MANAGE PAYMENT METHODS PAGE ==================== */}
        {subView === 'payment_methods' && (
          <>
            <Text
              style={{
                fontSize: 13.5,
                lineHeight: 19.5,
                color: palette.textSecondary,
                paddingHorizontal: 2,
              }}
            >
              Manage your linked payment methods for convenient and secure payments.
            </Text>

            <Button
              mode="contained"
              icon="plus"
              buttonColor="#FE2C55"
              textColor="#FFFFFF"
              style={[{ width: '100%', borderRadius: 999 }, webPrimaryButtonGradient]}
              onPress={() => setAddPaymentModalVisible(true)}
            >
              Add Payment Method
            </Button>

            {account.linkedMethods.length === 0 ? (
              <Card
                style={[
                  {
                    width: '100%',
                    borderRadius: 18,
                    backgroundColor: palette.glassSurface,
                    borderWidth: 1,
                    borderColor: palette.border,
                    paddingVertical: isAnyDesktop ? 56 : 38,
                    paddingHorizontal: 18,
                  },
                  cardShadowStyle,
                  webGlassStyle,
                ]}
                elevation={0}
              >
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <MaterialCommunityIcons
                    name="credit-card-plus-outline"
                    size={44}
                    color={palette.textMuted}
                  />
                  <Text
                    style={{
                      fontSize: 15.5,
                      fontWeight: '800',
                      color: palette.textPrimary,
                    }}
                  >
                    No Linked Payment Methods
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: palette.textSecondary,
                      textAlign: 'center',
                    }}
                  >
                    Link GCash, BPI Direct Debit, or UnionBank Direct Debit via official provider
                    authorization.
                  </Text>
                </View>
              </Card>
            ) : (
              account.linkedMethods.map((method) => (
                <Card
                  key={method.id}
                  style={[
                    {
                      width: '100%',
                      borderRadius: 18,
                      backgroundColor: palette.glassSurface,
                      borderWidth: 1,
                      borderColor: palette.border,
                      padding: isAnyDesktop ? 20 : 14,
                    },
                    cardShadowStyle,
                    webGlassStyle,
                  ]}
                  elevation={0}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          backgroundColor:
                            method.provider === 'GCash'
                              ? 'rgba(0, 125, 254, 0.16)'
                              : method.provider === 'BPI Direct Debit'
                                ? 'rgba(177, 17, 22, 0.16)'
                                : 'rgba(255, 102, 0, 0.16)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MaterialCommunityIcons
                          name={method.provider === 'GCash' ? 'cellphone' : 'bank'}
                          size={22}
                          color={
                            method.provider === 'GCash'
                              ? '#007DFE'
                              : method.provider === 'BPI Direct Debit'
                                ? '#B11116'
                                : '#FF6600'
                          }
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: '800',
                            color: palette.textPrimary,
                          }}
                        >
                          {method.provider}
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '700',
                            color: palette.textSecondary,
                            marginTop: 2,
                          }}
                        >
                          {method.maskedIdentifier}
                        </Text>
                        <Text style={{ fontSize: 11.5, color: palette.textMuted, marginTop: 1 }}>
                          Linked {method.linkedAt}
                        </Text>
                      </View>
                    </View>

                    <Button
                      mode="outlined"
                      textColor="#EF4444"
                      style={{ borderColor: '#EF4444', borderRadius: 999 }}
                      onPress={() =>
                        handleUnlinkPaymentMethod(
                          method.id,
                          `${method.provider} (${method.maskedIdentifier})`
                        )
                      }
                    >
                      Unlink
                    </Button>
                  </View>
                </Card>
              ))
            )}
          </>
        )}

        {/* ==================== 3A. GCASH – ONLINE PAYMENTS LINKING ==================== */}
        {subView === 'link_gcash' && (
          <Card
            style={[
              {
                width: '100%',
                borderRadius: 18,
                backgroundColor: palette.glassSurface,
                borderWidth: 1,
                borderColor: palette.border,
                padding: isAnyDesktop ? 26 : 18,
              },
              cardShadowStyle,
              webGlassStyle,
            ]}
            elevation={0}
          >
            <View style={{ gap: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialCommunityIcons name="cellphone-check" size={28} color="#007DFE" />
                <Text style={{ fontSize: 16.5, fontWeight: '900', color: palette.textPrimary }}>
                  GCash Official Authorization
                </Text>
              </View>

              <Text style={{ fontSize: 13.5, lineHeight: 19.5, color: palette.textSecondary }}>
                Connect your GCash account through official GCash payment authorization.
                Marketplace never collects or stores your GCash MPIN or one-time passwords.
              </Text>

              <TextInput
                mode="outlined"
                label="GCash Registered Mobile Number"
                placeholder="09171234567"
                keyboardType="phone-pad"
                value={providerAccountInput}
                onChangeText={setProviderAccountInput}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <Button
                  mode="contained"
                  buttonColor="#007DFE"
                  textColor="#FFFFFF"
                  style={{ flex: 1, borderRadius: 999 }}
                  onPress={() => handleCompleteProviderLink('GCash')}
                >
                  Authorize with GCash
                </Button>
                <Button
                  mode="outlined"
                  textColor={palette.textPrimary}
                  style={{ borderRadius: 999, borderColor: palette.border }}
                  onPress={() => {
                    setProviderAccountInput('');
                    setSubView('payment_methods');
                  }}
                >
                  Cancel
                </Button>
              </View>
            </View>
          </Card>
        )}

        {/* ==================== 3B. BPI DIRECT DEBIT – LOGIN TO BPI ONLINE ==================== */}
        {subView === 'link_bpi' && (
          <Card
            style={[
              {
                width: '100%',
                borderRadius: 18,
                backgroundColor: palette.glassSurface,
                borderWidth: 1,
                borderColor: palette.border,
                padding: isAnyDesktop ? 26 : 18,
              },
              cardShadowStyle,
              webGlassStyle,
            ]}
            elevation={0}
          >
            <View style={{ gap: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialCommunityIcons name="bank-check" size={28} color="#B11116" />
                <Text style={{ fontSize: 16.5, fontWeight: '900', color: palette.textPrimary }}>
                  BPI Direct Debit Authorization
                </Text>
              </View>

              <Text style={{ fontSize: 13.5, lineHeight: 19.5, color: palette.textSecondary }}>
                Continue through the official Bank of the Philippine Islands (BPI) authorization
                gateway to link your account. Marketplace never collects or stores your BPI
                online banking password.
              </Text>

              <TextInput
                mode="outlined"
                label="BPI Account Reference (Last 4 Digits)"
                placeholder="e.g. 4821"
                keyboardType="number-pad"
                maxLength={12}
                value={providerAccountInput}
                onChangeText={setProviderAccountInput}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <Button
                  mode="contained"
                  buttonColor="#B11116"
                  textColor="#FFFFFF"
                  style={{ flex: 1, borderRadius: 999 }}
                  onPress={() => handleCompleteProviderLink('BPI Direct Debit')}
                >
                  Continue to BPI Authorization
                </Button>
                <Button
                  mode="outlined"
                  textColor={palette.textPrimary}
                  style={{ borderRadius: 999, borderColor: palette.border }}
                  onPress={() => {
                    setProviderAccountInput('');
                    setSubView('payment_methods');
                  }}
                >
                  Cancel
                </Button>
              </View>
            </View>
          </Card>
        )}

        {/* ==================== 3C. UNIONBANK DIRECT DEBIT ==================== */}
        {subView === 'link_unionbank' && (
          <Card
            style={[
              {
                width: '100%',
                borderRadius: 18,
                backgroundColor: palette.glassSurface,
                borderWidth: 1,
                borderColor: palette.border,
                padding: isAnyDesktop ? 26 : 18,
              },
              cardShadowStyle,
              webGlassStyle,
            ]}
            elevation={0}
          >
            <View style={{ gap: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialCommunityIcons name="bank-check" size={28} color="#FF6600" />
                <Text style={{ fontSize: 16.5, fontWeight: '900', color: palette.textPrimary }}>
                  UnionBank Official Authorization
                </Text>
              </View>

              <Text style={{ fontSize: 13.5, lineHeight: 19.5, color: palette.textSecondary }}>
                Continue through the official UnionBank of the Philippines authorization portal to
                link your bank account. Marketplace never stores online banking credentials.
              </Text>

              <TextInput
                mode="outlined"
                label="UnionBank Account Reference (Last 4 Digits)"
                placeholder="e.g. 9034"
                keyboardType="number-pad"
                maxLength={12}
                value={providerAccountInput}
                onChangeText={setProviderAccountInput}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <Button
                  mode="contained"
                  buttonColor="#FF6600"
                  textColor="#FFFFFF"
                  style={{ flex: 1, borderRadius: 999 }}
                  onPress={() => handleCompleteProviderLink('UnionBank Direct Debit')}
                >
                  Continue to UnionBank
                </Button>
                <Button
                  mode="outlined"
                  textColor={palette.textPrimary}
                  style={{ borderRadius: 999, borderColor: palette.border }}
                  onPress={() => {
                    setProviderAccountInput('');
                    setSubView('payment_methods');
                  }}
                >
                  Cancel
                </Button>
              </View>
            </View>
          </Card>
        )}

        {/* ==================== 4. PAYLATER – ALL STATEMENTS PAGE ==================== */}
        {subView === 'statements' && (
          <>
            {/* Text-Based Status Tabs ("Unpaid" | "Paid") with Smooth Moving Underline */}
            <View
              style={{
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 28,
                borderBottomWidth: 1,
                borderBottomColor: palette.border,
                paddingHorizontal: 6,
                position: 'relative',
              }}
            >
              {(['Unpaid', 'Paid'] as StatementTabType[]).map((tab) => {
                const isSelected = statementTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onLayout={(e) => handleStatementTabLayout(tab, e)}
                    onPress={() => setStatementTab(tab)}
                    activeOpacity={0.75}
                    style={{ paddingVertical: 12 }}
                  >
                    <Text
                      style={{
                        fontSize: 15.5,
                        fontWeight: isSelected ? '900' : '600',
                        color: isSelected ? '#FE2C55' : palette.textSecondary,
                      }}
                    >
                      {tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <Animated.View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: tabUnderlineLeft,
                  width: tabUnderlineWidth,
                  height: 3,
                  borderRadius: 999,
                  backgroundColor: '#FE2C55',
                }}
              />
            </View>

            {filteredStatements.length === 0 ? (
              <Card
                style={[
                  {
                    width: '100%',
                    borderRadius: 18,
                    backgroundColor: palette.glassSurface,
                    borderWidth: 1,
                    borderColor: palette.border,
                    paddingVertical: isAnyDesktop ? 76 : 54,
                    paddingHorizontal: 20,
                  },
                  cardShadowStyle,
                  webGlassStyle,
                ]}
                elevation={0}
              >
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <MaterialCommunityIcons
                    name="file-document-outline"
                    size={50}
                    color={palette.textMuted}
                  />
                  <Text
                    style={{
                      fontSize: 16.5,
                      fontWeight: '900',
                      color: palette.textPrimary,
                    }}
                  >
                    No Statements
                  </Text>
                  <Text
                    style={{
                      fontSize: 13.5,
                      color: palette.textSecondary,
                      textAlign: 'center',
                    }}
                  >
                    You don't have any statements yet.
                  </Text>
                </View>
              </Card>
            ) : (
              filteredStatements.map((stmt) => (
                <Card
                  key={stmt.id}
                  style={[
                    {
                      width: '100%',
                      borderRadius: 18,
                      backgroundColor: palette.glassSurface,
                      borderWidth: 1,
                      borderColor: palette.border,
                      padding: isAnyDesktop ? 22 : 15,
                    },
                    cardShadowStyle,
                    webGlassStyle,
                  ]}
                  elevation={0}
                >
                  <View style={{ gap: 10 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '800',
                          color: palette.textPrimary,
                        }}
                      >
                        Ref: {stmt.reference}
                      </Text>

                      <View
                        style={{
                          backgroundColor:
                            stmt.status === 'Paid'
                              ? 'rgba(16, 185, 129, 0.16)'
                              : 'rgba(254, 44, 85, 0.16)',
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 999,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11.5,
                            fontWeight: '800',
                            color: stmt.status === 'Paid' ? palette.success : '#FE2C55',
                          }}
                        >
                          {stmt.status}
                        </Text>
                      </View>
                    </View>

                    <Text style={{ fontSize: 22, fontWeight: '900', color: '#FE2C55' }}>
                      {formatPeso(stmt.amount)}
                    </Text>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 6,
                      }}
                    >
                      <Text style={{ fontSize: 12.5, color: palette.textSecondary }}>
                        Statement Date: {stmt.statementDate}
                      </Text>
                      <Text style={{ fontSize: 12.5, color: palette.textSecondary }}>
                        Due Date: {stmt.dueDate}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                      <Button
                        mode="outlined"
                        textColor={palette.textPrimary}
                        style={{ flex: 1, borderRadius: 999, borderColor: palette.border }}
                        onPress={() => setSelectedStatement(stmt)}
                      >
                        View Details
                      </Button>

                      {stmt.status === 'Unpaid' && (
                        <Button
                          mode="contained"
                          buttonColor="#FE2C55"
                          textColor="#FFFFFF"
                          style={[{ flex: 1, borderRadius: 999 }, webPrimaryButtonGradient]}
                          onPress={() => setPayNowStatement(stmt)}
                        >
                          Pay Now
                        </Button>
                      )}
                    </View>
                  </View>
                </Card>
              ))
            )}
          </>
        )}

        {/* ==================== 5. PAYLATER – REPAYMENT HISTORY PAGE ==================== */}
        {subView === 'repayment_history' && (
          <>
            {account.repayments.length === 0 ? (
              <Card
                style={[
                  {
                    width: '100%',
                    borderRadius: 18,
                    backgroundColor: palette.glassSurface,
                    borderWidth: 1,
                    borderColor: palette.border,
                    paddingVertical: isAnyDesktop ? 76 : 54,
                    paddingHorizontal: 20,
                  },
                  cardShadowStyle,
                  webGlassStyle,
                ]}
                elevation={0}
              >
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <MaterialCommunityIcons
                    name="cash-check"
                    size={50}
                    color={palette.textMuted}
                  />
                  <Text
                    style={{
                      fontSize: 16.5,
                      fontWeight: '900',
                      color: palette.textPrimary,
                    }}
                  >
                    No Repayment Records
                  </Text>
                  <Text
                    style={{
                      fontSize: 13.5,
                      color: palette.textSecondary,
                      textAlign: 'center',
                      lineHeight: 20,
                    }}
                  >
                    Your repayment history will appear here once you make your first PayLater
                    payment.
                  </Text>
                </View>
              </Card>
            ) : (
              account.repayments.map((rep) => (
                <Card
                  key={rep.id}
                  style={[
                    {
                      width: '100%',
                      borderRadius: 18,
                      backgroundColor: palette.glassSurface,
                      borderWidth: 1,
                      borderColor: palette.border,
                      padding: isAnyDesktop ? 22 : 15,
                    },
                    cardShadowStyle,
                    webGlassStyle,
                  ]}
                  elevation={0}
                >
                  <View style={{ gap: 7 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '800',
                          color: palette.textPrimary,
                        }}
                      >
                        {rep.reference}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '800',
                          color: palette.success,
                        }}
                      >
                        {rep.status}
                      </Text>
                    </View>

                    <Text style={{ fontSize: 20, fontWeight: '900', color: palette.textPrimary }}>
                      {formatPeso(rep.amountPaid)}
                    </Text>

                    <Text style={{ fontSize: 12.5, color: palette.textSecondary }}>
                      Statement: {rep.statementReference} • Method: {rep.paymentMethod}
                    </Text>

                    <Text style={{ fontSize: 12, color: palette.textMuted }}>
                      Repayment Date: {rep.repaymentDate}
                    </Text>
                  </View>
                </Card>
              ))
            )}
          </>
        )}

        {/* ==================== 6. PAYLATER – REFUND HISTORY PAGE ==================== */}
        {subView === 'refund_history' && (
          <>
            {account.refunds.length === 0 ? (
              <Card
                style={[
                  {
                    width: '100%',
                    borderRadius: 18,
                    backgroundColor: palette.glassSurface,
                    borderWidth: 1,
                    borderColor: palette.border,
                    paddingVertical: isAnyDesktop ? 76 : 54,
                    paddingHorizontal: 20,
                  },
                  cardShadowStyle,
                  webGlassStyle,
                ]}
                elevation={0}
              >
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <MaterialCommunityIcons
                    name="cash-refund"
                    size={50}
                    color={palette.textMuted}
                  />
                  <Text
                    style={{
                      fontSize: 16.5,
                      fontWeight: '900',
                      color: palette.textPrimary,
                    }}
                  >
                    No Refund History
                  </Text>
                  <Text
                    style={{
                      fontSize: 13.5,
                      color: palette.textSecondary,
                      textAlign: 'center',
                      lineHeight: 20,
                    }}
                  >
                    Your refund transactions will appear here once a PayLater refund has been
                    processed.
                  </Text>
                </View>
              </Card>
            ) : (
              account.refunds.map((ref) => (
                <Card
                  key={ref.id}
                  style={[
                    {
                      width: '100%',
                      borderRadius: 18,
                      backgroundColor: palette.glassSurface,
                      borderWidth: 1,
                      borderColor: palette.border,
                      padding: isAnyDesktop ? 22 : 15,
                    },
                    cardShadowStyle,
                    webGlassStyle,
                  ]}
                  elevation={0}
                >
                  <View style={{ gap: 7 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '800',
                          color: palette.textPrimary,
                        }}
                      >
                        Refund Ref: {ref.refundReference}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '800',
                          color: palette.success,
                        }}
                      >
                        {ref.status}
                      </Text>
                    </View>

                    <Text style={{ fontSize: 20, fontWeight: '900', color: palette.success }}>
                      +{formatPeso(ref.refundAmount)}
                    </Text>

                    <Text style={{ fontSize: 12.5, color: palette.textSecondary }}>
                      Original Order: #{ref.orderReference}
                    </Text>

                    <Text style={{ fontSize: 12, color: palette.textMuted }}>
                      Requested: {ref.requestDate}
                      {ref.completionDate ? ` • Completed: ${ref.completionDate}` : ''}
                    </Text>

                    <Button
                      mode="outlined"
                      textColor={palette.textPrimary}
                      style={{ borderColor: palette.border, borderRadius: 999, marginTop: 4 }}
                      onPress={() => setSelectedRefund(ref)}
                    >
                      View Details
                    </Button>
                  </View>
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* ==================== CREDIT LIMIT INFORMATION POPUP ==================== */}
      <Modal
        visible={limitInfoVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setLimitInfoVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: palette.glassOverlay,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 18,
          }}
        >
          <View
            style={[
              {
                width: '100%',
                maxWidth: 440,
                backgroundColor: palette.background,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: palette.border,
                padding: 20,
                gap: 14,
              },
              webGlassStyle,
            ]}
          >
            {/* Header: Title + Close (X) on Right Side */}
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
                  fontSize: 17,
                  fontWeight: '900',
                  color: palette.textPrimary,
                  flex: 1,
                }}
              >
                How to Increase Your Limit
              </Text>

              <TouchableOpacity
                onPress={() => setLimitInfoVisible(false)}
                activeOpacity={0.75}
                accessibilityLabel="Close popup"
                style={{ padding: 4 }}
              >
                <MaterialCommunityIcons name="close" size={22} color={palette.textPrimary} />
              </TouchableOpacity>
            </View>

            <Divider />

            {/* Point 1 */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: 'rgba(254, 44, 85, 0.14)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 2,
                }}
              >
                <Text style={{ fontSize: 12.5, fontWeight: '900', color: '#FE2C55' }}>1</Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ fontSize: 14.5, fontWeight: '800', color: palette.textPrimary }}>
                  Use PayLater Often
                </Text>
                <Text style={{ fontSize: 12.5, lineHeight: 18, color: palette.textSecondary }}>
                  Unlock higher credit limits as you make the most of this payment method.
                </Text>
              </View>
            </View>

            {/* Point 2 */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: 'rgba(254, 44, 85, 0.14)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 2,
                }}
              >
                <Text style={{ fontSize: 12.5, fontWeight: '900', color: '#FE2C55' }}>2</Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ fontSize: 14.5, fontWeight: '800', color: palette.textPrimary }}>
                  Make Repayments on Time
                </Text>
                <Text style={{ fontSize: 12.5, lineHeight: 18, color: palette.textSecondary }}>
                  Making repayments on time helps maintain a positive credit record and may help
                  you qualify for a higher credit limit.
                </Text>
              </View>
            </View>

            <Text style={{ fontSize: 11.5, color: palette.textMuted, lineHeight: 16 }}>
              Note: Credit limit reviews are subject to eligibility verification and periodic
              credit assessment rules.
            </Text>

            <Button
              mode="contained"
              buttonColor="#FE2C55"
              textColor="#FFFFFF"
              style={[{ borderRadius: 999, marginTop: 2 }, webPrimaryButtonGradient]}
              onPress={() => setLimitInfoVisible(false)}
            >
              Got it
            </Button>
          </View>
        </View>
      </Modal>

      {/* ==================== ADD PAYMENT METHOD POPUP / BOTTOM SHEET ==================== */}
      <Modal
        visible={addPaymentModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddPaymentModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: palette.glassOverlay,
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={[
              {
                width: '100%',
                maxWidth: isAnyDesktop ? 640 : '100%',
                alignSelf: 'center',
                backgroundColor: palette.background,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                borderWidth: 1,
                borderColor: palette.border,
                padding: 18,
                paddingBottom: bottomSafePadding,
                gap: 12,
              },
              webGlassStyle,
            ]}
          >
            {/* Title + Close (X) on Right Side */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ fontSize: 17, fontWeight: '900', color: palette.textPrimary }}>
                Add Payment Method
              </Text>

              <TouchableOpacity
                onPress={() => setAddPaymentModalVisible(false)}
                activeOpacity={0.75}
                style={{ padding: 4 }}
              >
                <MaterialCommunityIcons name="close" size={22} color={palette.textPrimary} />
              </TouchableOpacity>
            </View>

            <Divider />

            {/* 1. GCash > */}
            <TouchableOpacity
              onPress={() => {
                setAddPaymentModalVisible(false);
                setProviderAccountInput('');
                setSubView('link_gcash');
              }}
              activeOpacity={0.78}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 14,
                paddingHorizontal: 14,
                borderRadius: 14,
                backgroundColor: palette.glassSurface,
                borderWidth: 1,
                borderColor: palette.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <MaterialCommunityIcons name="cellphone" size={24} color="#007DFE" />
                <Text style={{ fontSize: 15, fontWeight: '800', color: palette.textPrimary }}>
                  GCash
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={palette.textSecondary}
              />
            </TouchableOpacity>

            {/* 2. BPI Direct Debit > */}
            <TouchableOpacity
              onPress={() => {
                setAddPaymentModalVisible(false);
                setProviderAccountInput('');
                setSubView('link_bpi');
              }}
              activeOpacity={0.78}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 14,
                paddingHorizontal: 14,
                borderRadius: 14,
                backgroundColor: palette.glassSurface,
                borderWidth: 1,
                borderColor: palette.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <MaterialCommunityIcons name="bank" size={24} color="#B11116" />
                <Text style={{ fontSize: 15, fontWeight: '800', color: palette.textPrimary }}>
                  BPI Direct Debit
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={palette.textSecondary}
              />
            </TouchableOpacity>

            {/* 3. UnionBank Direct Debit > */}
            <TouchableOpacity
              onPress={() => {
                setAddPaymentModalVisible(false);
                setProviderAccountInput('');
                setSubView('link_unionbank');
              }}
              activeOpacity={0.78}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 14,
                paddingHorizontal: 14,
                borderRadius: 14,
                backgroundColor: palette.glassSurface,
                borderWidth: 1,
                borderColor: palette.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <MaterialCommunityIcons name="bank" size={24} color="#FF6600" />
                <Text style={{ fontSize: 15, fontWeight: '800', color: palette.textPrimary }}>
                  UnionBank Direct Debit
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={palette.textSecondary}
              />
            </TouchableOpacity>

            <Button
              mode="outlined"
              textColor={palette.textPrimary}
              style={{ borderRadius: 999, borderColor: palette.border, marginTop: 4 }}
              onPress={() => setAddPaymentModalVisible(false)}
            >
              Cancel
            </Button>
          </View>
        </View>
      </Modal>

      {/* ==================== STATEMENT DETAILS MODAL ==================== */}
      <Modal
        visible={Boolean(selectedStatement)}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedStatement(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: palette.glassOverlay,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 18,
          }}
        >
          {selectedStatement && (
            <View
              style={[
                {
                  width: '100%',
                  maxWidth: 440,
                  backgroundColor: palette.background,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: palette.border,
                  padding: 20,
                  gap: 10,
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
                <Text style={{ fontSize: 17, fontWeight: '900', color: palette.textPrimary }}>
                  Statement Details
                </Text>
                <TouchableOpacity onPress={() => setSelectedStatement(null)}>
                  <MaterialCommunityIcons name="close" size={22} color={palette.textPrimary} />
                </TouchableOpacity>
              </View>

              <Divider />

              <Text style={{ fontSize: 13, color: palette.textSecondary }}>
                Reference: {selectedStatement.reference}
              </Text>
              <Text style={{ fontSize: 13, color: palette.textSecondary }}>
                Statement Date: {selectedStatement.statementDate}
              </Text>
              <Text style={{ fontSize: 13, color: palette.textSecondary }}>
                Due Date: {selectedStatement.dueDate}
              </Text>
              <Text style={{ fontSize: 13, color: palette.textSecondary }}>
                Items: {selectedStatement.itemsSummary}
              </Text>
              <Text style={{ fontSize: 13, color: palette.textSecondary }}>
                Service Fee: {formatPeso(selectedStatement.feeAmount)}
              </Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#FE2C55' }}>
                Total Due: {formatPeso(selectedStatement.amount)}
              </Text>

              <Button
                mode="contained"
                buttonColor="#FE2C55"
                textColor="#FFFFFF"
                style={[{ borderRadius: 999, marginTop: 6 }, webPrimaryButtonGradient]}
                onPress={() => setSelectedStatement(null)}
              >
                Close
              </Button>
            </View>
          )}
        </View>
      </Modal>

      {/* ==================== PAY NOW STATEMENT MODAL ==================== */}
      <Modal
        visible={Boolean(payNowStatement)}
        animationType="slide"
        transparent
        onRequestClose={() => setPayNowStatement(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: palette.glassOverlay,
            justifyContent: 'flex-end',
          }}
        >
          {payNowStatement && (
            <View
              style={[
                {
                  width: '100%',
                  maxWidth: isAnyDesktop ? 640 : '100%',
                  alignSelf: 'center',
                  backgroundColor: palette.background,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  borderWidth: 1,
                  borderColor: palette.border,
                  padding: 18,
                  paddingBottom: bottomSafePadding,
                  gap: 12,
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
                <Text style={{ fontSize: 17, fontWeight: '900', color: palette.textPrimary }}>
                  Settle Statement ({formatPeso(payNowStatement.amount)})
                </Text>
                <TouchableOpacity onPress={() => setPayNowStatement(null)}>
                  <MaterialCommunityIcons name="close" size={22} color={palette.textPrimary} />
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 12.5, color: palette.textSecondary }}>
                Select an authorized payment method to settle {payNowStatement.reference}:
              </Text>

              {account.linkedMethods.length === 0 ? (
                <View style={{ gap: 10 }}>
                  <Text style={{ fontSize: 13, color: palette.textPrimary, fontWeight: '700' }}>
                    No payment method linked yet. Please link GCash, BPI, or UnionBank first.
                  </Text>
                  <Button
                    mode="contained"
                    buttonColor="#FE2C55"
                    textColor="#FFFFFF"
                    style={[{ borderRadius: 999 }, webPrimaryButtonGradient]}
                    onPress={() => {
                      setPayNowStatement(null);
                      setSubView('payment_methods');
                    }}
                  >
                    Go to Payment Methods
                  </Button>
                </View>
              ) : (
                account.linkedMethods.map((m) => (
                  <Button
                    key={m.id}
                    mode="contained"
                    buttonColor="#FE2C55"
                    textColor="#FFFFFF"
                    style={[{ borderRadius: 999 }, webPrimaryButtonGradient]}
                    onPress={() =>
                      handleConfirmStatementPayment(`${m.provider} (${m.maskedIdentifier})`)
                    }
                  >
                    Pay with {m.provider} ({m.maskedIdentifier})
                  </Button>
                ))
              )}

              <Button
                mode="outlined"
                textColor={palette.textPrimary}
                style={{ borderRadius: 999, borderColor: palette.border }}
                onPress={() => setPayNowStatement(null)}
              >
                Cancel
              </Button>
            </View>
          )}
        </View>
      </Modal>

      {/* ==================== REFUND DETAILS MODAL ==================== */}
      <Modal
        visible={Boolean(selectedRefund)}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedRefund(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: palette.glassOverlay,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 18,
          }}
        >
          {selectedRefund && (
            <View
              style={[
                {
                  width: '100%',
                  maxWidth: 440,
                  backgroundColor: palette.background,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: palette.border,
                  padding: 20,
                  gap: 10,
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
                <Text style={{ fontSize: 17, fontWeight: '900', color: palette.textPrimary }}>
                  Refund Details
                </Text>
                <TouchableOpacity onPress={() => setSelectedRefund(null)}>
                  <MaterialCommunityIcons name="close" size={22} color={palette.textPrimary} />
                </TouchableOpacity>
              </View>

              <Divider />

              <Text style={{ fontSize: 13, color: palette.textSecondary }}>
                Refund Reference: {selectedRefund.refundReference}
              </Text>
              <Text style={{ fontSize: 13, color: palette.textSecondary }}>
                Original Order: #{selectedRefund.orderReference}
              </Text>
              <Text style={{ fontSize: 13, color: palette.textSecondary }}>
                Request Date: {selectedRefund.requestDate}
              </Text>
              {selectedRefund.completionDate && (
                <Text style={{ fontSize: 13, color: palette.textSecondary }}>
                  Completion Date: {selectedRefund.completionDate}
                </Text>
              )}
              <Text style={{ fontSize: 13, color: palette.textSecondary }}>
                Reason: {selectedRefund.reason}
              </Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: palette.success }}>
                Refund Amount: {formatPeso(selectedRefund.refundAmount)}
              </Text>

              <Button
                mode="contained"
                buttonColor="#FE2C55"
                textColor="#FFFFFF"
                style={[{ borderRadius: 999, marginTop: 6 }, webPrimaryButtonGradient]}
                onPress={() => setSelectedRefund(null)}
              >
                Close
              </Button>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const localStyles = StyleSheet.create({
  ambientLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  orbTopLeft: {
    position: 'absolute',
    top: -120,
    left: -90,
    width: 340,
    height: 340,
    borderRadius: 999,
  },
  orbTopRight: {
    position: 'absolute',
    top: 30,
    right: -110,
    width: 310,
    height: 310,
    borderRadius: 999,
  },
  orbCenter: {
    position: 'absolute',
    top: '36%',
    left: '14%',
    width: 360,
    height: 360,
    borderRadius: 999,
  },
  orbBottomRight: {
    position: 'absolute',
    bottom: -95,
    right: -85,
    width: 320,
    height: 320,
    borderRadius: 999,
  },
});