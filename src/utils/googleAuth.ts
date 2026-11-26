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
import { UserProfile } from '../types/marketplace';
import { api, setAuthToken } from './api';
import { mapGoogleAuthError } from './marketplaceLogic';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

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

export interface GoogleSignInResult {
  user: UserProfile;
  isNewUser: boolean;
}

export async function signInWithGoogleFirebase(): Promise<GoogleSignInResult> {
  const auth = getFirebaseAuthInstance();
  if (!auth) {
    throw new Error(
      'Firebase Google Sign-In is not configured yet. Add VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID.'
    );
  }

  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });

    const credential = await signInWithPopup(auth, provider);
    const idToken = await credential.user.getIdToken();
    const res = await api.googleFirebaseAuth(idToken);
    setAuthToken(res.token);
    return {
      user: res.user,
      isNewUser: res.isNewUser,
    };
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
