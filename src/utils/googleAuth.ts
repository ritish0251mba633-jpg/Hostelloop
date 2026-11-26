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
  mapGoogleAuthError,
} from './marketplaceLogic';

const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || '').trim(),
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim(),
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim(),
  appId: (import.meta.env.VITE_FIREBASE_APP_ID || '').trim(),
  ...(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
    ? { storageBucket: String(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET).trim() }
    : {}),
  ...(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
    ? { messagingSenderId: String(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID).trim() }
    : {}),
};

const FIREBASE_PROFILE_PREFIX = 'hostelloop_fb_profile_';

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;

function getFirebaseAuthInstance(): Auth | null {
  if (!isFirebaseConfigured()) {
    return null;
  }
  if (!cachedApp) {
    cachedApp = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  }
  if (!cachedAuth) {
    cachedAuth = getAuth(cachedApp);
    setPersistence(cachedAuth, browserLocalPersistence).catch(() => {
      // Ignore persistence fallback issues in restricted browsers
    });
  }
  return cachedAuth;
}

export async function awaitFirebaseAuthReady(): Promise<FirebaseUser | null> {
  const auth = getFirebaseAuthInstance();
  if (!auth) return null;
  if (typeof auth.authStateReady === 'function') {
    await auth.authStateReady();
  }
  return auth.currentUser;
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
    setAuthToken(res.token);
    saveStoredFirebaseProfile(res.user);
    return {
      user: res.user,
      isNewUser: res.isNewUser,
    };
  } catch (err: unknown) {
    const apiErr = err as { status?: number };
    // Static SPA deployments (e.g., Vercel without Express server.ts) return 404 on /api/*
    if (apiErr?.status === 404) {
      return buildUserProfileFromFirebaseUser(fbUser);
    }
    throw err;
  }
}

export async function signInWithGoogleFirebase(): Promise<GoogleSignInResult> {
  const auth = getFirebaseAuthInstance();
  if (!auth) {
    throw new Error(
      'Firebase Google Sign-In is not configured yet. Add VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID.'
    );
  }

  try {
    await setPersistence(auth, browserLocalPersistence).catch(() => {
      // Continue with default persistence if restricted
    });

    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });

    const credential = await signInWithPopup(auth, provider);
    return await syncFirebaseUserSession(credential.user);
  } catch (err: unknown) {
    const fbErr = err as { code?: string; message?: string };
    const message = mapGoogleAuthError(fbErr?.code || fbErr?.message || '');
    throw new Error(message);
  }
}

export async function signInWithGoogleOAuthPopup(): Promise<GoogleSignInResult> {
  const { url } = await api.getGoogleOAuthUrl();

  return new Promise<GoogleSignInResult>((resolve, reject) => {
    const width = 520;
    const height = 640;
    const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
    const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));

    const popup = window.open(
      url,
      'hostelloop_google_oauth',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,status=no`
    );

    if (!popup) {
      reject(
        new Error(
          'Your browser blocked the Google sign-in popup. Please allow popups for this site and try again.'
        )
      );
      return;
    }

    let settled = false;

    const cleanup = () => {
      window.removeEventListener('message', onMessage);
      window.clearInterval(closedCheckTimer);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const payload = event.data as
        | {
            type?: string;
            token?: string;
            user?: UserProfile;
            isNewUser?: boolean;
            error?: string;
          }
        | undefined;
      if (!payload || !payload.type) return;

      if (payload.type === 'GOOGLE_OAUTH_SUCCESS' && payload.token && payload.user) {
        settled = true;
        cleanup();
        setAuthToken(payload.token);
        resolve({
          user: payload.user,
          isNewUser: Boolean(payload.isNewUser),
        });
      } else if (payload.type === 'GOOGLE_OAUTH_ERROR') {
        settled = true;
        cleanup();
        reject(new Error(payload.error || 'Google authentication failed.'));
      }
    };

    window.addEventListener('message', onMessage);

    const closedCheckTimer = window.setInterval(() => {
      if (popup.closed && !settled) {
        settled = true;
        cleanup();
        reject(
          new Error(
            'Google sign-in popup was closed before completing sign-in. Click "Continue with Google" to try again.'
          )
        );
      }
    }, 400);
  });
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
