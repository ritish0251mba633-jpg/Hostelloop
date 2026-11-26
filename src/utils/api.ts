import {
  AvailabilityStatus,
  InquiryRecord,
  ModerationStatus,
  ProductListing,
  ReportRecord,
  TransactionFeedback,
  UserProfile,
} from '../types/marketplace';

const TOKEN_STORAGE_KEY = 'hostelloop_auth_token';
const GUEST_ID_KEY = 'hostelloop_guest_id';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function getGuestId(): string {
  try {
    let id = localStorage.getItem(GUEST_ID_KEY);
    if (!id) {
      id = `guest-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(GUEST_ID_KEY, id);
    }
    return id;
  } catch {
    return 'guest-default';
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Guest-Id': getGuestId(),
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`) as Error & {
      fieldErrors?: Record<string, string>;
    };
    err.fieldErrors = data.errors;
    throw err;
  }
  return data as T;
}

export const api = {
  getConfig: () =>
    apiFetch<{
      allowedDomains: string[];
      firebaseConfigured: boolean;
      firebaseProjectIdSet: boolean;
      googleOAuthConfigured: boolean;
      emailDeliveryConfigured: boolean;
      demoModeAvailable: boolean;
    }>('/api/config'),

  getMe: () => apiFetch<{ user: UserProfile | null }>('/api/auth/me'),

  googleFirebaseAuth: (idToken: string) =>
    apiFetch<{ token: string; user: UserProfile; isNewUser: boolean }>(
      '/api/auth/google-firebase',
      {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      }
    ),

  getGoogleOAuthUrl: () => apiFetch<{ url: string }>('/api/auth/google/url'),

  completeProfile: (payload: {
    name: string;
    campusAffiliation: string;
    hostelBlock: string;
    roomNumber?: string;
    programAndYear: string;
    bio?: string;
  }) =>
    apiFetch<{ user: UserProfile }>('/api/auth/complete-profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  signup: (payload: {
    name: string;
    email: string;
    password: string;
    campusAffiliation?: string;
    hostelBlock: string;
    roomNumber?: string;
    programAndYear?: string;
  }) =>
    apiFetch<{
      token: string;
      user: UserProfile;
      verificationPending: boolean;
      simulatedCampusEmailNotice: string;
      demoVerificationCode: string;
    }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    apiFetch<{ token: string; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: payload.email, password: payload.password }),
    }),

  enterDemoSession: (accountType: 'student' | 'admin') =>
    apiFetch<{ token: string; user: UserProfile }>('/api/auth/demo-session', {
      method: 'POST',
      body: JSON.stringify({ accountType }),
    }),

  sendCampusVerificationCode: (campusEmail: string) =>
    apiFetch<{ campusEmail: string; demoVerificationCode: string; message: string }>(
      '/api/auth/send-campus-code',
      {
        method: 'POST',
        body: JSON.stringify({ campusEmail }),
      }
    ),

  verifyCampusEmail: (code: string) =>
    apiFetch<{ user: UserProfile }>('/api/auth/verify-campus-email', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  verifyEmail: (code: string) =>
    apiFetch<{ user: UserProfile }>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  resendVerificationCode: () =>
    apiFetch<{ demoVerificationCode: string; message: string }>('/api/auth/resend-code', {
      method: 'POST',
    }),

  forgotPassword: (email: string) =>
    apiFetch<{ message: string; demoResetCode: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (payload: { email: string; code: string; newPassword: string }) =>
    apiFetch<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () => apiFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  updateProfile: (payload: Partial<UserProfile>) =>
    apiFetch<{ user: UserProfile }>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  getListings: () => apiFetch<{ listings: ProductListing[] }>('/api/listings'),

  createListing: (payload: Record<string, unknown>) =>
    apiFetch<{ listing: ProductListing }>('/api/listings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateListing: (
    id: string,
    payload: { availability?: AvailabilityStatus; moderationStatus?: ModerationStatus }
  ) =>
    apiFetch<{ listing: ProductListing }>(`/api/listings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteListing: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/listings/${id}`, {
      method: 'DELETE',
    }),

  getWishlist: () => apiFetch<{ wishlistIds: string[] }>('/api/wishlist'),

  toggleWishlist: (listingId: string) =>
    apiFetch<{ wishlistIds: string[] }>('/api/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ listingId }),
    }),

  getInquiries: () => apiFetch<{ inquiries: InquiryRecord[] }>('/api/inquiries'),

  createInquiry: (payload: {
    listingId: string;
    message: string;
    preferredMeetupSpot: string;
    proposedTime: string;
  }) =>
    apiFetch<{ inquiry: InquiryRecord }>('/api/inquiries', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateInquiry: (id: string, payload: { status?: string; sellerReply?: string }) =>
    apiFetch<{ inquiry: InquiryRecord }>(`/api/inquiries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  submitFeedback: (payload: {
    inquiryId: string;
    listingId: string;
    listingTitle: string;
    rating: number;
    wouldUseAgain: boolean;
    alternativeWouldHaveUsed: string;
    notes: string;
  }) =>
    apiFetch<{ entry: TransactionFeedback }>('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  submitReport: (payload: {
    targetType: 'listing' | 'user';
    targetId: string;
    targetName: string;
    reason: string;
    details: string;
  }) =>
    apiFetch<{ report: ReportRecord }>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getAdminOverview: () =>
    apiFetch<{
      stats: {
        totalUsers: number;
        verifiedUsers: number;
        totalListings: number;
        demoListingsCount: number;
        liveUserListingsCount: number;
        activeListings: number;
        pendingListings: number;
        completedTransactions: number;
        reportedListings: number;
      };
      users: UserProfile[];
      listings: ProductListing[];
      reports: ReportRecord[];
      feedback: TransactionFeedback[];
    }>('/api/admin/overview'),

  updateUserStatus: (userId: string, accountStatus: 'active' | 'suspended') =>
    apiFetch<{ user: UserProfile }>(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ accountStatus }),
    }),

  updateReportStatus: (reportId: string, status: 'open' | 'resolved' | 'dismissed') =>
    apiFetch<{ report: ReportRecord }>(`/api/admin/reports/${reportId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
