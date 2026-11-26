import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
  Auth,
  User as FirebaseUser,
} from 'firebase/auth';
import { UserProfile, VerificationStatus } from '../types/marketplace';
import { api, setAuthToken } from './api';
import {
  CAMPUS_AFFILIATION_OPTIONS,
  FirebaseEnvStatus,
  inspectFirebaseEnv,
  mapGoogleAuthError,
  normalizeFirebaseEnvValues,
} from './marketplaceLogic';

const firebaseEnvValues = normalizeFirebaseEnvValues({
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
});

const firebaseConfig = {
  apiKey: firebaseEnvValues.VITE_FIREBASE_API_KEY,
  authDomain: firebaseEnvValues.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseEnvValues.VITE_FIREBASE_PROJECT_ID,
  appId: firebaseEnvValues.VITE_FIREBASE_APP_ID,
  ...(firebaseEnvValues.VITE_FIREBASE_STORAGE_BUCKET
    ? { storageBucket: firebaseEnvValues.VITE_FIREBASE_STORAGE_BUCKET }
    : {}),
  ...(firebaseEnvValues.VITE_FIREBASE_MESSAGING_SENDER_ID
    ? { messagingSenderId: firebaseEnvValues.VITE_FIREBASE_MESSAGING_SENDER_ID }
    : {}),
};

const FIREBASE_PROFILE_PREFIX = 'hostelloop_fb_profile_';

export function getFirebaseEnvStatus(): FirebaseEnvStatus {
  return inspectFirebaseEnv(firebaseEnvValues);
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseEnvStatus().configured;
}

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let lastFirebaseInitError: string | null = null;

function getFirebaseAuthInstance(): Auth | null {
  if (!isFirebaseConfigured()) {
    return null;
  }
  try {
    if (!cachedApp) {
      cachedApp = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    }
    if (!cachedAuth) {
      cachedAuth = getAuth(cachedApp);
      setPersistence(cachedAuth, browserLocalPersistence).catch(() => {
        // Ignore persistence fallback issues in restricted browsers
      });
    }
    lastFirebaseInitError = null;
    return cachedAuth;
  } catch (err: unknown) {
    const fbErr = err as { code?: string; message?: string };
    lastFirebaseInitError = mapGoogleAuthError(fbErr?.code || fbErr?.message || '');
    return null;
  }
}

export function getFirebaseInitError(): string | null {
  return lastFirebaseInitError;
}

export async function awaitFirebaseAuthReady(): Promise<FirebaseUser | null> {
  const auth = getFirebaseAuthInstance();
  if (!auth) return null;
  try {
    if (typeof auth.authStateReady === 'function') {
      await auth.authStateReady();
    }
    return auth.currentUser;
  } catch {
    return null;
  }
}

export function getCurrentFirebaseUser(): FirebaseUser | null {
  const auth = getFirebaseAuthInstance();
  return auth ? auth.currentUser : null;
}

export function getStoredFirebaseProfile(uid: string): Partial<UserProfile> | null {
  try {
    const raw = localStorage.getItem(`${FIREBASE_PROFILE_PREFIX}${uid}`);
    return raw ? (JSON.parse(raw) as Partial<UserProfile>) : null;
  } catch {
    return null;
  }
}

export function saveStoredFirebaseProfile(profile: UserProfile): void {
  if (!profile.googleUid) return;
  try {
    localStorage.setItem(
      `${FIREBASE_PROFILE_PREFIX}${profile.googleUid}`,
      JSON.stringify(profile)
    );
  } catch {
    // ignore storage quota errors
  }
}

export function buildUserProfileFromFirebaseUser(
  fbUser: Pick<FirebaseUser, 'uid' | 'email' | 'displayName' | 'photoURL' | 'metadata'>
): { user: UserProfile; isNewUser: boolean } {
  const stored = getStoredFirebaseProfile(fbUser.uid);
  const email = (fbUser.email || stored?.email || '').trim().toLowerCase();
  const displayName = (
    stored?.name ||
    fbUser.displayName ||
    email.split('@')[0] ||
    'Student'
  ).trim();
  const joinedAt =
    stored?.joinedAt ||
    (fbUser.metadata?.creationTime
      ? new Date(fbUser.metadata.creationTime).toISOString()
      : new Date().toISOString());

  const user: UserProfile = {
    id: stored?.id || `fb-${fbUser.uid.slice(0, 12)}`,
    googleUid: fbUser.uid,
    authProvider: 'google_firebase',
    name: displayName,
    email,
    campusEmail: stored?.campusEmail,
    campusAffiliation: stored?.campusAffiliation || CAMPUS_AFFILIATION_OPTIONS[0],
    role: 'student',
    verificationStatus: stored?.verificationStatus || VerificationStatus.Pending,
    isDemoAccount: false,
    profileCompleted: Boolean(stored?.profileCompleted),
    hostelBlock: stored?.hostelBlock || 'Boys Hostel Block A',
    roomNumber: stored?.roomNumber || '',
    programAndYear: stored?.programAndYear || '',
    phone: stored?.phone || '',
    whatsappOptIn: Boolean(stored?.whatsappOptIn),
    avatarUrl: fbUser.photoURL || stored?.avatarUrl,
    bio: stored?.bio || 'HostelLoop student member.',
    joinedAt,
    accountStatus: 'active',
    verifiedAt: stored?.verifiedAt,
  };

  saveStoredFirebaseProfile(user);
  return {
    user,
    isNewUser: !user.profileCompleted,
  };
}

export interface GoogleSignInResult {
  user: UserProfile;
  isNewUser: boolean;
}

export async function syncFirebaseUserSession(
  fbUser: FirebaseUser
): Promise<GoogleSignInResult> {
  const idToken = await fbUser.getIdToken();
  try {
    const res = await api.googleFirebaseAuth(idToken);
    if (!res?.user || !res?.token) {
      // Static SPA rewrite fallback (e.g., 200 HTML returned for /api/*)
      return buildUserProfileFromFirebaseUser(fbUser);
    }
    setAuthToken(res.token);
    saveStoredFirebaseProfile(res.user);
    return {
      user: res.user,
      isNewUser: res.isNewUser,
    };
  } catch (err: unknown) {
    const apiErr = err as { status?: number };
    // Static SPA deployments (e.g., Vercel without Express server.ts) or missing server-side env
    if (apiErr?.status === 404 || apiErr?.status === 405 || apiErr?.status === 503) {
      return buildUserProfileFromFirebaseUser(fbUser);
    }
    throw err;
  }
}

export async function signInWithGoogleFirebase(): Promise<GoogleSignInResult> {
  try {
    const auth = getFirebaseAuthInstance();
    if (!auth) {
      if (lastFirebaseInitError) {
        throw new Error(lastFirebaseInitError);
      }
      const envStatus = getFirebaseEnvStatus();
      throw new Error(
        `Firebase Google Sign-In is not configured yet. Missing: ${envStatus.missingRequired.join(', ')}.`
      );
    }

    await setPersistence(auth, browserLocalPersistence).catch(() => {
      // Continue with default persistence if restricted
    });

    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });

    const credential = await signInWithPopup(auth, provider);
    if (!credential.user?.email) {
      throw new Error('Google account did not return an email address.');
    }
    return await syncFirebaseUserSession(credential.user);
  } catch (err: unknown) {
    const fbErr = err as { code?: string; message?: string };
    const message = mapGoogleAuthError(fbErr?.code || fbErr?.message || '');
    throw new Error(message);
  }
}

export function subscribeFirebaseAuth(
  onUser: (user: FirebaseUser | null) => void
): () => void {
  const auth = getFirebaseAuthInstance();
  if (!auth) {
    return () => {};
  }
  return onAuthStateChanged(auth, onUser);
}

export async function signOutFirebaseIfActive(): Promise<void> {
  const auth = getFirebaseAuthInstance();
  if (auth && auth.currentUser) {
    try {
      await signOut(auth);
    } catch {
      // Ignore signOut errors on cleanup
    }
  }
}
