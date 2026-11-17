/**
 * Centralized Authentication & Account Management Context
 * Features: Salted SHA-256 Password Hashing, Duplicate Username & Email Enforcement,
 * Permanent Deleted-Account Blacklist (blocks future login & re-registration),
 * Google & Facebook Social Auth + Account Linking, Persistent Sessions, and Responsive Device Metadata
 * across Website, Tablet, and Phones (Realme, iPhone, Samsung, Xiaomi, OPPO, Vivo).
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { useTheme as usePaperTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AuthProviderType = 'email' | 'google' | 'facebook' | 'dummyjson';
export type DeviceFormFactor = 'phone' | 'tablet' | 'desktop';

export interface MarketplaceUser {
  id: number | string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone?: string;
  image?: string;
  token: string;
  provider: AuthProviderType;
  linkedProviders?: AuthProviderType[];
  createdAt?: string;
}

interface StoredAccountRecord {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone?: string;
  image?: string;
  passwordHash?: string;
  salt?: string;
  provider: AuthProviderType;
  linkedProviders: AuthProviderType[];
  createdAt: string;
}

export interface DeletedAccountTombstone {
  id: string;
  username: string;
  email: string;
  phone: string;
  deletedAt: string;
}

interface RegisterPayload {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone?: string;
  password: string;
}

interface AuthResult {
  success: boolean;
  message: string;
  user?: MarketplaceUser;
}

export interface ResponsiveAuthViewport {
  width: number;
  height: number;
  isPhone: boolean;
  isCompactPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceFormFactor: DeviceFormFactor;
  platformOS: typeof Platform.OS;
}

interface AuthContextType {
  user: MarketplaceUser | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  viewport: ResponsiveAuthViewport;
  paperTheme: ReturnType<typeof usePaperTheme>;
  loginWithEmailOrUsername: (identifier: string, password: string) => Promise<AuthResult>;
  registerAccount: (payload: RegisterPayload) => Promise<AuthResult>;
  authenticateWithSocial: (
    provider: 'google' | 'facebook',
    mode: 'login' | 'register',
    profileDetails: {
      firstName: string;
      lastName: string;
      email: string;
      image?: string;
    }
  ) => Promise<AuthResult>;
  updateUser: (updates: Partial<MarketplaceUser>) => Promise<void>;
  verifyCurrentUserPassword: (password: string) => Promise<boolean>;
  updateCurrentUserPassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
  permanentlyDeleteCurrentUser: (password?: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
  checkEmailAvailable: (email: string) => Promise<boolean>;
  isAccountDeleted: (identifier: {
    id?: string | number;
    username?: string;
    email?: string;
    phone?: string;
  }) => Promise<boolean>;
}

const DB_USERS_KEY = '@marketplace_db_users_v2';
const ACTIVE_SESSION_KEY = '@marketplace_active_session_v2';
const LEGACY_USERS_KEY = '@marketplace_registered_users';
export const DELETED_ACCOUNTS_REGISTRY_KEY = '@marketplace_deleted_accounts_registry';

// ==================== CRYPTOGRAPHIC PASSWORD HASHING (NO PLAIN TEXT) ====================
function sha256Hex(input: string): string {
  const rightRotate = (value: number, amount: number) =>
    (value >>> amount) | (value << (32 - amount));
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';
  const words: number[] = [];
  const asciiBitLength = input.length * 8;
  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, boolean> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  let ascii = input + '\x80';
  while ((ascii.length % 64) - 56) ascii += '\x00';
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];
      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash.unshift((temp1 + temp2) | 0);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }

    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

function hashPasswordWithSalt(password: string, salt: string): string {
  return sha256Hex(`${salt}::marketplace_secure_v2::${password}`);
}

function generateSalt(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

// ==================== PERMANENT DELETED ACCOUNT REGISTRY HELPERS ====================
export async function checkDeletedAccountRegistry(identifier: {
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
      if (normId && entry.id && entry.id.trim().toLowerCase() === normId) return true;
      if (normUser && entry.username && entry.username.trim().toLowerCase() === normUser) return true;
      if (normEmail && entry.email && entry.email.trim().toLowerCase() === normEmail) return true;
      if (
        normPhone &&
        entry.phone &&
        entry.phone.replace(/\s+/g, '').toLowerCase() === normPhone
      ) {
        return true;
      }
      return false;
    });
  } catch {
    return false;
  }
}

async function appendDeletedAccountRegistry(tombstone: DeletedAccountTombstone): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(DELETED_ACCOUNTS_REGISTRY_KEY);
    const list: DeletedAccountTombstone[] = raw ? JSON.parse(raw) : [];
    const safeList = Array.isArray(list) ? list : [];

    const normId = tombstone.id.trim().toLowerCase();
    const normUser = tombstone.username.trim().toLowerCase();
    const normEmail = tombstone.email.trim().toLowerCase();
    const normPhone = tombstone.phone.replace(/\s+/g, '').toLowerCase();

    const exists = safeList.some(
      (item) =>
        (normId && item.id?.toLowerCase() === normId) ||
        (normUser && item.username?.toLowerCase() === normUser) ||
        (normEmail && item.email?.toLowerCase() === normEmail)
    );

    if (!exists) {
      const updated: DeletedAccountTombstone[] = [
        {
          id: normId,
          username: normUser,
          email: normEmail,
          phone: normPhone,
          deletedAt: tombstone.deletedAt || new Date().toISOString(),
        },
        ...safeList,
      ];
      await AsyncStorage.setItem(DELETED_ACCOUNTS_REGISTRY_KEY, JSON.stringify(updated));
    }
  } catch {
    // Ignore storage error
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MarketplaceUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  // Responsive viewport detection across Website, Tablet, and Phones (Realme, iPhone, Samsung, Xiaomi, OPPO, Vivo)
  const { width, height } = useWindowDimensions();
  const paperTheme = usePaperTheme();

  const isDesktop = width >= 1024;
  const isTablet = !isDesktop && width >= 768;
  const isPhone = !isDesktop && !isTablet;
  const isCompactPhone = isPhone && width <= 375;

  const viewport: ResponsiveAuthViewport = {
    width,
    height,
    isPhone,
    isCompactPhone,
    isTablet,
    isDesktop,
    deviceFormFactor: isDesktop ? 'desktop' : isTablet ? 'tablet' : 'phone',
    platformOS: Platform.OS,
  };

  // ==================== SESSION RESTORATION ON REFRESH / APP LAUNCH ====================
  useEffect(() => {
    restoreValidSession();
  }, []);

  const restoreValidSession = async () => {
    setIsLoadingAuth(true);
    try {
      const sessionRaw = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
      if (!sessionRaw) {
        setUser(null);
        return;
      }

      const parsedSession: MarketplaceUser = JSON.parse(sessionRaw);
      if (!parsedSession || !parsedSession.id || !parsedSession.token) {
        await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
        setUser(null);
        return;
      }

      // Immediately reject and purge if this account was permanently deleted
      const isDeleted = await checkDeletedAccountRegistry({
        id: parsedSession.id,
        username: parsedSession.username,
        email: parsedSession.email,
        phone: parsedSession.phone,
      });

      if (isDeleted) {
        await AsyncStorage.multiRemove([
          ACTIVE_SESSION_KEY,
          '@marketplace_auth_user',
          '@marketplace_auth_token',
          '@marketplace_refresh_token',
        ]);
        setUser(null);
        return;
      }

      // Verify account still exists in centralized database
      if (parsedSession.provider !== 'dummyjson') {
        const dbUsers = await getStoredDatabaseUsers();
        const stillExists = dbUsers.find(
          (acc) =>
            String(acc.id) === String(parsedSession.id) ||
            acc.email.toLowerCase() === parsedSession.email.toLowerCase()
        );

        if (!stillExists) {
          await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
          setUser(null);
          return;
        }

        const syncedUser: MarketplaceUser = {
          id: stillExists.id,
          firstName: stillExists.firstName,
          lastName: stillExists.lastName,
          username: stillExists.username,
          email: stillExists.email,
          phone: stillExists.phone,
          image: stillExists.image,
          token: parsedSession.token,
          provider: stillExists.provider,
          linkedProviders: stillExists.linkedProviders,
          createdAt: stillExists.createdAt,
        };
        setUser(syncedUser);
        await AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(syncedUser));
      } else {
        setUser(parsedSession);
      }
    } catch (error) {
      console.error('Session restoration error:', error);
      setUser(null);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // ==================== DATABASE HELPERS ====================
  const getStoredDatabaseUsers = async (): Promise<StoredAccountRecord[]> => {
    try {
      const raw = await AsyncStorage.getItem(DB_USERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  };

  const saveStoredDatabaseUsers = async (records: StoredAccountRecord[]) => {
    await AsyncStorage.setItem(DB_USERS_KEY, JSON.stringify(records));
    const sanitized = records.map(({ passwordHash, salt, ...rest }) => rest);
    await AsyncStorage.setItem(LEGACY_USERS_KEY, JSON.stringify(sanitized));
  };

  const persistActiveSession = async (sessionUser: MarketplaceUser) => {
    setUser(sessionUser);
    await AsyncStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(sessionUser));
    await AsyncStorage.setItem('@marketplace_auth_user', JSON.stringify(sessionUser));
    await AsyncStorage.setItem('@marketplace_auth_token', sessionUser.token);
  };

  // ==================== DUPLICATE & DELETED-ACCOUNT VALIDATION (USERNAME & EMAIL) ====================
  const checkUsernameAvailable = async (rawUsername: string): Promise<boolean> => {
    const clean = rawUsername.trim().toLowerCase();
    if (!clean) return false;

    // Block usernames belonging to permanently deleted accounts
    const wasDeleted = await checkDeletedAccountRegistry({ username: clean });
    if (wasDeleted) return false;

    const dbUsers = await getStoredDatabaseUsers();
    const existsLocally = dbUsers.some((u) => u.username.trim().toLowerCase() === clean);
    if (existsLocally) return false;

    try {
      const res = await fetch(
        `https://dummyjson.com/users/filter?key=username&value=${encodeURIComponent(clean)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (
          Array.isArray(data.users) &&
          data.users.some((u: any) => u.username?.toLowerCase() === clean)
        ) {
          return false;
        }
      }
    } catch {
      // Offline fallback relies on local DB check
    }

    return true;
  };

  const checkEmailAvailable = async (rawEmail: string): Promise<boolean> => {
    const clean = rawEmail.trim().toLowerCase();
    if (!clean) return false;

    // Block emails belonging to permanently deleted accounts
    const wasDeleted = await checkDeletedAccountRegistry({ email: clean });
    if (wasDeleted) return false;

    const dbUsers = await getStoredDatabaseUsers();
    const existsLocally = dbUsers.some((u) => u.email.trim().toLowerCase() === clean);
    if (existsLocally) return false;

    try {
      const res = await fetch(
        `https://dummyjson.com/users/filter?key=email&value=${encodeURIComponent(clean)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (
          Array.isArray(data.users) &&
          data.users.some((u: any) => u.email?.toLowerCase() === clean)
        ) {
          return false;
        }
      }
    } catch {
      // Offline fallback relies on local DB check
    }

    return true;
  };

  // ==================== EMAIL & PASSWORD REGISTRATION ====================
  const registerAccount = async (payload: RegisterPayload): Promise<AuthResult> => {
    const firstName = payload.firstName.trim();
    const lastName = payload.lastName.trim();
    const username = payload.username.trim();
    const email = payload.email.trim().toLowerCase();
    const phone = (payload.phone || '').trim();
    const password = payload.password;

    if (!firstName || !lastName) {
      return { success: false, message: 'First name and last name are required.' };
    }
    if (username.length < 3) {
      return { success: false, message: 'Username must be at least 3 characters long.' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    if (password.length < 6) {
      return { success: false, message: 'Password must contain at least 6 characters.' };
    }

    // Reject re-registration of any permanently deleted account credentials
    const deletedMatch = await checkDeletedAccountRegistry({ username, email, phone });
    if (deletedMatch) {
      return {
        success: false,
        message:
          'This account has been permanently deleted and cannot be re-registered. Please use a different email and username.',
      };
    }

    // Backend & DB duplicate enforcement
    const usernameFree = await checkUsernameAvailable(username);
    if (!usernameFree) {
      return {
        success: false,
        message: 'This username is already taken or unavailable. Please choose another username.',
      };
    }

    const emailFree = await checkEmailAvailable(email);
    if (!emailFree) {
      return {
        success: false,
        message:
          'This email address is already registered or unavailable. Please log in or use another email address.',
      };
    }

    const salt = generateSalt();
    const passwordHash = hashPasswordWithSalt(password, salt);
    const newId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      `${firstName}+${lastName}`
    )}&background=FE2C55&color=fff&size=256`;

    await fetch('https://dummyjson.com/users/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        username,
        email,
        phone: phone || undefined,
        image: defaultAvatar,
      }),
    }).catch(() => null);

    const newRecord: StoredAccountRecord = {
      id: newId,
      firstName,
      lastName,
      username,
      email,
      phone: phone || undefined,
      image: defaultAvatar,
      passwordHash,
      salt,
      provider: 'email',
      linkedProviders: ['email'],
      createdAt: new Date().toISOString(),
    };

    const dbUsers = await getStoredDatabaseUsers();
    await saveStoredDatabaseUsers([newRecord, ...dbUsers]);

    const sessionUser: MarketplaceUser = {
      id: newRecord.id,
      firstName: newRecord.firstName,
      lastName: newRecord.lastName,
      username: newRecord.username,
      email: newRecord.email,
      phone: newRecord.phone,
      image: newRecord.image,
      token: `tok_${sha256Hex(`${newId}_${Date.now()}`)}`,
      provider: 'email',
      linkedProviders: ['email'],
      createdAt: newRecord.createdAt,
    };

    await persistActiveSession(sessionUser);

    return {
      success: true,
      message: 'Registration successful! Welcome to our marketplace.',
      user: sessionUser,
    };
  };

  // ==================== EMAIL / USERNAME LOGIN ====================
  const loginWithEmailOrUsername = async (
    identifier: string,
    password: string
  ): Promise<AuthResult> => {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId || !password) {
      return { success: false, message: 'Please enter your username/email and password.' };
    }

    // 0. Block login attempts for permanently deleted accounts
    const isDeletedAccount = await checkDeletedAccountRegistry({
      username: cleanId,
      email: cleanId,
      phone: cleanId,
    });
    if (isDeletedAccount) {
      return {
        success: false,
        message: 'This account has been permanently deleted and can no longer be accessed.',
      };
    }

    // 1. Check centralized marketplace database first
    const dbUsers = await getStoredDatabaseUsers();
    const matchedLocal = dbUsers.find(
      (u) =>
        u.username.trim().toLowerCase() === cleanId ||
        u.email.trim().toLowerCase() === cleanId ||
        (u.phone && u.phone.replace(/\s+/g, '').toLowerCase() === cleanId.replace(/\s+/g, ''))
    );

    if (matchedLocal) {
      if (!matchedLocal.passwordHash || !matchedLocal.salt) {
        const linked = matchedLocal.linkedProviders.join(' or ');
        return {
          success: false,
          message: `This account was created with ${linked}. Please use Continue with ${linked}.`,
        };
      }

      const computedHash = hashPasswordWithSalt(password, matchedLocal.salt);
      if (computedHash !== matchedLocal.passwordHash) {
        return { success: false, message: 'Invalid password. Please try again.' };
      }

      const sessionUser: MarketplaceUser = {
        id: matchedLocal.id,
        firstName: matchedLocal.firstName,
        lastName: matchedLocal.lastName,
        username: matchedLocal.username,
        email: matchedLocal.email,
        phone: matchedLocal.phone,
        image: matchedLocal.image,
        token: `tok_${sha256Hex(`${matchedLocal.id}_${Date.now()}`)}`,
        provider: matchedLocal.provider,
        linkedProviders: matchedLocal.linkedProviders,
        createdAt: matchedLocal.createdAt,
      };

      await persistActiveSession(sessionUser);
      return {
        success: true,
        message: `Welcome back, ${sessionUser.firstName}!`,
        user: sessionUser,
      };
    }

    // 2. Fallback to DummyJSON demo accounts (e.g., emilys / emilyspass)
    try {
      let usernameForDummy = identifier.trim();
      if (cleanId.includes('@')) {
        const lookupRes = await fetch(
          `https://dummyjson.com/users/filter?key=email&value=${encodeURIComponent(cleanId)}`
        );
        if (lookupRes.ok) {
          const lookupData = await lookupRes.json();
          if (lookupData.users?.[0]?.username) {
            usernameForDummy = lookupData.users[0].username;
          }
        }
      }

      const deletedDummy = await checkDeletedAccountRegistry({
        username: usernameForDummy,
        email: cleanId,
      });
      if (deletedDummy) {
        return {
          success: false,
          message: 'This account has been permanently deleted and can no longer be accessed.',
        };
      }

      const response = await fetch('https://dummyjson.com/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameForDummy,
          password,
          expiresInMins: 60,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Account not found or invalid credentials.',
        };
      }

      const sessionUser: MarketplaceUser = {
        id: data.id,
        firstName: data.firstName || 'Marketplace',
        lastName: data.lastName || 'User',
        username: data.username,
        email: data.email,
        image: data.image,
        token: data.accessToken || data.token || `dummy_tok_${Date.now()}`,
        provider: 'dummyjson',
        linkedProviders: ['dummyjson'],
      };

      await persistActiveSession(sessionUser);
      return {
        success: true,
        message: `Welcome back, ${sessionUser.firstName}!`,
        user: sessionUser,
      };
    } catch {
      return {
        success: false,
        message: 'Unable to sign in. Please check your credentials and network connection.',
      };
    }
  };

  // ==================== GOOGLE & FACEBOOK AUTOMATIC REGISTRATION / LOGIN ====================
  const authenticateWithSocial = async (
    provider: 'google' | 'facebook',
    mode: 'login' | 'register',
    profileDetails: {
      firstName: string;
      lastName: string;
      email: string;
      image?: string;
    }
  ): Promise<AuthResult> => {
    try {
      if (!profileDetails || !profileDetails.email) {
        return {
          success: false,
          message: `Could not retrieve ${provider === 'google' ? 'Google' : 'Facebook'} profile details.`,
        };
      }

      const cleanEmail = profileDetails.email.trim().toLowerCase();

      // Reject social login or re-registration if email belongs to a permanently deleted account
      const isDeletedEmail = await checkDeletedAccountRegistry({ email: cleanEmail });
      if (isDeletedEmail) {
        return {
          success: false,
          message:
            'The account associated with this email was permanently deleted and cannot be accessed or re-registered.',
        };
      }

      const dbUsers = await getStoredDatabaseUsers();
      const existingIndex = dbUsers.findIndex((u) => u.email.trim().toLowerCase() === cleanEmail);

      // CASE A: Existing account found with same email -> Securely link & sign in
      if (existingIndex > -1) {
        const existing = dbUsers[existingIndex];
        const updatedProviders: AuthProviderType[] = existing.linkedProviders.includes(provider)
          ? existing.linkedProviders
          : [...existing.linkedProviders, provider];

        const updatedRecord: StoredAccountRecord = {
          ...existing,
          firstName: existing.firstName || profileDetails.firstName,
          lastName: existing.lastName || profileDetails.lastName,
          image: existing.image || profileDetails.image,
          linkedProviders: updatedProviders,
        };

        const updatedList = [...dbUsers];
        updatedList[existingIndex] = updatedRecord;
        await saveStoredDatabaseUsers(updatedList);

        const sessionUser: MarketplaceUser = {
          id: updatedRecord.id,
          firstName: updatedRecord.firstName,
          lastName: updatedRecord.lastName,
          username: updatedRecord.username,
          email: updatedRecord.email,
          phone: updatedRecord.phone,
          image: updatedRecord.image,
          token: `tok_${sha256Hex(`${updatedRecord.id}_${provider}_${Date.now()}`)}`,
          provider,
          linkedProviders: updatedProviders,
          createdAt: updatedRecord.createdAt,
        };

        await persistActiveSession(sessionUser);
        return {
          success: true,
          message: `${
            provider === 'google' ? 'Google' : 'Facebook'
          } authentication successful. Welcome back, ${sessionUser.firstName}!`,
          user: sessionUser,
        };
      }

      // CASE B: No existing marketplace account
      if (mode === 'login') {
        return {
          success: false,
          message: `No marketplace account is registered with ${cleanEmail}. Please register first.`,
        };
      }

      // Generate unique username from email prefix
      let baseUsername = cleanEmail
        .split('@')[0]
        .replace(/[^a-zA-Z0-9_]/g, '')
        .toLowerCase();
      if (baseUsername.length < 3) baseUsername = `${baseUsername}_user`;

      let candidateUsername = baseUsername;
      let suffix = 1;
      while (!(await checkUsernameAvailable(candidateUsername))) {
        candidateUsername = `${baseUsername}${suffix++}`;
      }

      const newId = `usr_${provider}_${Date.now()}`;
      const avatar =
        profileDetails.image ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          `${profileDetails.firstName}+${profileDetails.lastName}`
        )}&background=${provider === 'google' ? 'EA4335' : '1877F2'}&color=fff&size=256`;

      const newRecord: StoredAccountRecord = {
        id: newId,
        firstName: profileDetails.firstName.trim(),
        lastName: profileDetails.lastName.trim(),
        username: candidateUsername,
        email: cleanEmail,
        image: avatar,
        provider,
        linkedProviders: [provider],
        createdAt: new Date().toISOString(),
      };

      await saveStoredDatabaseUsers([newRecord, ...dbUsers]);

      const sessionUser: MarketplaceUser = {
        id: newRecord.id,
        firstName: newRecord.firstName,
        lastName: newRecord.lastName,
        username: newRecord.username,
        email: newRecord.email,
        image: newRecord.image,
        token: `tok_${sha256Hex(`${newId}_${Date.now()}`)}`,
        provider,
        linkedProviders: [provider],
        createdAt: newRecord.createdAt,
      };

      await persistActiveSession(sessionUser);
      return {
        success: true,
        message: `${
          provider === 'google' ? 'Google' : 'Facebook'
        } authentication successful. Registration successful! Welcome to our marketplace.`,
        user: sessionUser,
      };
    } catch (error) {
      console.error('Social auth error:', error);
      return {
        success: false,
        message: `Unable to complete ${provider === 'google' ? 'Google' : 'Facebook'} authentication.`,
      };
    }
  };

  // ==================== SYNCHRONIZED PROFILE UPDATE ====================
  const updateUser = async (updates: Partial<MarketplaceUser>) => {
    if (!user) return;

    const merged: MarketplaceUser = {
      ...user,
      ...updates,
    };

    const dbUsers = await getStoredDatabaseUsers();
    const updatedDb = dbUsers.map((rec) =>
      String(rec.id) === String(user.id) || rec.email.toLowerCase() === user.email.toLowerCase()
        ? {
            ...rec,
            firstName: merged.firstName,
            lastName: merged.lastName,
            username: merged.username,
            email: merged.email.toLowerCase(),
            phone: merged.phone,
            image: merged.image,
          }
        : rec
    );
    await saveStoredDatabaseUsers(updatedDb);
    await persistActiveSession(merged);
  };

  // ==================== PASSWORD VERIFICATION & CHANGE ====================
  const verifyCurrentUserPassword = async (password: string): Promise<boolean> => {
    if (!user || !password.trim()) return false;

    const dbUsers = await getStoredDatabaseUsers();
    const record = dbUsers.find(
      (u) =>
        String(u.id) === String(user.id) ||
        u.email.toLowerCase() === user.email.toLowerCase() ||
        u.username.toLowerCase() === user.username.toLowerCase()
    );

    if (record) {
      if (!record.passwordHash || !record.salt) {
        return false;
      }
      return hashPasswordWithSalt(password, record.salt) === record.passwordHash;
    }

    if (user.provider === 'dummyjson') {
      try {
        const res = await fetch('https://dummyjson.com/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: user.username,
            password,
            expiresInMins: 1,
          }),
        });
        return res.ok;
      } catch {
        return false;
      }
    }

    return false;
  };

  const updateCurrentUserPassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<AuthResult> => {
    if (!user) return { success: false, message: 'Not authenticated.' };
    if (newPassword.length < 6) {
      return { success: false, message: 'Password must contain at least 6 characters.' };
    }

    const valid = await verifyCurrentUserPassword(currentPassword);
    if (!valid) {
      return { success: false, message: 'Incorrect current password. Please try again.' };
    }

    const dbUsers = await getStoredDatabaseUsers();
    const newSalt = generateSalt();
    const newHash = hashPasswordWithSalt(newPassword, newSalt);

    const updatedDb = dbUsers.map((rec) =>
      String(rec.id) === String(user.id) || rec.email.toLowerCase() === user.email.toLowerCase()
        ? {
            ...rec,
            passwordHash: newHash,
            salt: newSalt,
            linkedProviders: rec.linkedProviders.includes('email')
              ? rec.linkedProviders
              : [...rec.linkedProviders, 'email' as AuthProviderType],
          }
        : rec
    );
    await saveStoredDatabaseUsers(updatedDb);

    return { success: true, message: 'Password updated securely.' };
  };

  // ==================== PERMANENT ACCOUNT DELETION (BLOCKS FUTURE LOGIN & RE-REGISTRATION) ====================
  const permanentlyDeleteCurrentUser = async (password?: string): Promise<AuthResult> => {
    if (!user) {
      return { success: false, message: 'Unauthorized request. Please log in again.' };
    }

    const dbUsers = await getStoredDatabaseUsers();
    const record = dbUsers.find(
      (u) =>
        String(u.id) === String(user.id) ||
        u.email.toLowerCase() === user.email.toLowerCase() ||
        u.username.toLowerCase() === user.username.toLowerCase()
    );

    // Verify password ONLY when explicitly provided (allows direct one-click deletion from AccountSettingsModal)
    if (password && password.trim().length > 0) {
      const isVerified = await verifyCurrentUserPassword(password);
      if (!isVerified) {
        return { success: false, message: 'Incorrect password. Account deletion cancelled.' };
      }
    }

    // 1. Add permanent tombstone so this account can NEVER log in or re-register again
    await appendDeletedAccountRegistry({
      id: String(user.id),
      username: user.username || record?.username || '',
      email: user.email || record?.email || '',
      phone: user.phone || record?.phone || '',
      deletedAt: new Date().toISOString(),
    });

    // 2. Delete via DummyJSON endpoint if applicable
    if (user.provider === 'dummyjson') {
      await fetch(`https://dummyjson.com/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      }).catch(() => null);
    }

    // 3. Permanently remove user authentication & profile record from DB (other users unaffected)
    const remainingDbUsers = dbUsers.filter(
      (u) =>
        String(u.id) !== String(user.id) &&
        u.email.toLowerCase() !== user.email.toLowerCase() &&
        u.username.toLowerCase() !== user.username.toLowerCase()
    );
    await saveStoredDatabaseUsers(remainingDbUsers);

    // 4. Anonymize order/transaction records under legal retention policy
    const userPrefix = `@marketplace_user_${user.id}`;
    const ordersRaw = await AsyncStorage.getItem(`${userPrefix}_orders`);
    if (ordersRaw) {
      await AsyncStorage.setItem(
        `@marketplace_retained_orders_${Date.now()}`,
        JSON.stringify({
          anonymizedUserId: `deleted_${sha256Hex(String(user.id)).slice(0, 12)}`,
          deletedAt: new Date().toISOString(),
          records: JSON.parse(ordersRaw),
        })
      );
    }

    // 5. Remove personal profile storage & invalidate all active session tokens
    await AsyncStorage.multiRemove([
      `${userPrefix}_wishlist`,
      `${userPrefix}_addresses`,
      `${userPrefix}_address`,
      `${userPrefix}_cart`,
      `${userPrefix}_privacy`,
      `${userPrefix}_saved_for_later`,
      `${userPrefix}_orders`,
      `${userPrefix}_saved_cards`,
      `${userPrefix}_linked_cards`,
      `${userPrefix}_linked_banks`,
      `${userPrefix}_last_order_success`,
      `${userPrefix}_profile_extra`,
      `${userPrefix}_security_prefs`,
      `${userPrefix}_activity_log`,
      `${userPrefix}_login_devices`,
      `${userPrefix}_bonus_center`,
      `${userPrefix}_coupons`,
      `${userPrefix}_notifications`,
      `${userPrefix}_paylater`,
      ACTIVE_SESSION_KEY,
      '@marketplace_auth_user',
      '@marketplace_current_user',
      '@marketplace_auth_token',
      '@marketplace_token',
      '@marketplace_session',
      '@marketplace_refresh_token',
      '@marketplace_quick_login_user',
      '@marketplace_wishlist',
      '@marketplace_addresses',
      '@marketplace_active_address',
      '@marketplace_user_profile',
      '@marketplace_cart',
      '@marketplace_saved_for_later',
    ]);

    setUser(null);

    return {
      success: true,
      message: 'Your account has been permanently deleted.',
    };
  };

  // ==================== LOGOUT ====================
  const logout = async () => {
    await AsyncStorage.multiRemove([
      ACTIVE_SESSION_KEY,
      '@marketplace_auth_user',
      '@marketplace_auth_token',
      '@marketplace_refresh_token',
    ]);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoadingAuth,
        viewport,
        paperTheme,
        loginWithEmailOrUsername,
        registerAccount,
        authenticateWithSocial,
        updateUser,
        verifyCurrentUserPassword,
        updateCurrentUserPassword,
        permanentlyDeleteCurrentUser,
        logout,
        checkUsernameAvailable,
        checkEmailAvailable,
        isAccountDeleted: checkDeletedAccountRegistry,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};