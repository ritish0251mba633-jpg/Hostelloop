import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDiscountPercent,
  calculateUnitEconomics,
  filterAndSortListings,
  formatINR,
  getUserIdentityBadge,
  inspectFirebaseEnv,
  mapGoogleAuthError,
  normalizeFirebaseEnvValues,
  validateAnyEmail,
  validateDguEmail,
  validateListingInput,
  buildWhatsAppLink,
} from './marketplaceLogic';
import {
  AvailabilityStatus,
  ItemCondition,
  ModerationStatus,
  ProductCategory,
  ProductListing,
  TransactionType,
  VerificationStatus,
} from '../types/marketplace';

const SAMPLE_LISTINGS: ProductListing[] = [
  {
    id: 'l-1',
    title: 'Study Lamp',
    category: ProductCategory.StudyStationery,
    description: 'Adjustable LED desk lamp for late-night exam prep.',
    price: 250,
    originalPrice: 650,
    condition: ItemCondition.LikeNew,
    images: ['/lamp.jpg'],
    transactionType: TransactionType.Sell,
    availability: AvailabilityStatus.Available,
    moderationStatus: ModerationStatus.Approved,
    sellerId: 'u-1',
    sellerName: 'Aarav',
    sellerHostelBlock: 'Boys Hostel A',
    sellerVerificationStatus: VerificationStatus.Verified,
    sellerContactPreference: 'Campus Inquiry Only',
    pickupLocation: 'Central Library Entrance',
    createdAt: '2026-10-10T10:00:00.000Z',
    isDemo: true,
    viewCount: 10,
  },
  {
    id: 'l-2',
    title: 'Study Table',
    category: ProductCategory.Furniture,
    description: 'Foldable wooden table ideal for hostel rooms.',
    price: 1200,
    originalPrice: 2200,
    condition: ItemCondition.Good,
    images: ['/table.jpg'],
    transactionType: TransactionType.Sell,
    availability: AvailabilityStatus.Available,
    moderationStatus: ModerationStatus.Approved,
    sellerId: 'u-2',
    sellerName: 'Meera',
    sellerHostelBlock: 'Girls Hostel',
    sellerVerificationStatus: VerificationStatus.Verified,
    sellerContactPreference: 'Campus Inquiry Only',
    pickupLocation: 'Girls Hostel Block Reception',
    createdAt: '2026-10-12T10:00:00.000Z',
    isDemo: true,
    viewCount: 14,
  },
  {
    id: 'l-3',
    title: 'Pending Kettle',
    category: ProductCategory.Electronics,
    description: 'Unapproved pending listing that should stay hidden in public browse.',
    price: 400,
    condition: ItemCondition.Good,
    images: ['/kettle.jpg'],
    transactionType: TransactionType.Sell,
    availability: AvailabilityStatus.Available,
    moderationStatus: ModerationStatus.Pending,
    sellerId: 'u-3',
    sellerName: 'Rohan',
    sellerHostelBlock: 'Boys Hostel B',
    sellerVerificationStatus: VerificationStatus.Pending,
    sellerContactPreference: 'Campus Inquiry Only',
    pickupLocation: 'Main Academic Block Courtyard',
    createdAt: '2026-10-15T10:00:00.000Z',
    isDemo: false,
    viewCount: 1,
  },
];

test('validateAnyEmail allows gmail.com and any valid Google email while validateDguEmail strictly checks campus verification domain', () => {
  assert.equal(validateAnyEmail('ritish@gmail.com').valid, true);
  assert.equal(validateAnyEmail('student@gmail.com').valid, true);
  assert.equal(validateAnyEmail('user@gmail.com').valid, true);
  assert.equal(validateAnyEmail('bad-email').valid, false);

  const validDgu = validateDguEmail('ritish.0251mba633@dgu.ac.in');
  assert.equal(validDgu.valid, true);
  assert.equal(validDgu.isAllowedCampusDomain, true);

  const nonDgu = validateDguEmail('ritish@gmail.com');
  assert.equal(nonDgu.valid, false);
  assert.equal(nonDgu.isAllowedCampusDomain, false);
});

test('getUserIdentityBadge clearly distinguishes Google-authenticated users from Verified DGU Students', () => {
  const googleUnverified = getUserIdentityBadge({
    authProvider: 'google_firebase',
    verificationStatus: VerificationStatus.Pending,
    isDemoAccount: false,
  });
  assert.equal(googleUnverified.isVerifiedDguStudent, false);
  assert.equal(googleUnverified.tone, 'google');
  assert.match(googleUnverified.label, /Campus Unverified/i);

  const googleAndDguVerified = getUserIdentityBadge({
    authProvider: 'google_firebase',
    verificationStatus: VerificationStatus.Verified,
    isDemoAccount: false,
  });
  assert.equal(googleAndDguVerified.isVerifiedDguStudent, true);
  assert.equal(googleAndDguVerified.label, 'Verified DGU Student');

  const demo = getUserIdentityBadge({
    authProvider: 'demo',
    verificationStatus: VerificationStatus.DemoUnverified,
    isDemoAccount: true,
  });
  assert.equal(demo.isVerifiedDguStudent, false);
  assert.equal(demo.tone, 'demo');
});

test('mapGoogleAuthError maps Firebase error codes into clear messages', () => {
  assert.match(mapGoogleAuthError('Firebase: Error (auth/popup-closed-by-user).'), /closed/i);
  assert.match(mapGoogleAuthError('Firebase: Error (auth/popup-blocked).'), /blocked/i);
  assert.match(mapGoogleAuthError('Firebase: Error (auth/unauthorized-domain).'), /Authorized domains/i);
  assert.match(mapGoogleAuthError('Firebase: Error (auth/operation-not-allowed).'), /Sign-in method/i);
  assert.match(mapGoogleAuthError('Firebase: Error (auth/user-disabled).'), /disabled/i);
  assert.match(mapGoogleAuthError('Firebase: Error (auth/internal-error).'), /internal error/i);
});

test('inspectFirebaseEnv accurately detects missing and configured VITE_FIREBASE_* variables', () => {
  const empty = inspectFirebaseEnv({});
  assert.equal(empty.configured, false);
  assert.deepEqual(empty.missingRequired, [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_APP_ID',
  ]);

  const partial = inspectFirebaseEnv({
    VITE_FIREBASE_API_KEY: 'AIzaTest',
    VITE_FIREBASE_AUTH_DOMAIN: 'app.firebaseapp.com',
  });
  assert.equal(partial.configured, false);
  assert.deepEqual(partial.missingRequired, [
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_APP_ID',
  ]);

  const ready = inspectFirebaseEnv({
    VITE_FIREBASE_API_KEY: 'AIzaTest',
    VITE_FIREBASE_AUTH_DOMAIN: 'app.firebaseapp.com',
    VITE_FIREBASE_PROJECT_ID: 'my-proj',
    VITE_FIREBASE_APP_ID: '1:123:web:abc',
  });
  assert.equal(ready.configured, true);
  assert.equal(ready.missingRequired.length, 0);
  assert.deepEqual(ready.missingOptional, [
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
  ]);

  const normalized = normalizeFirebaseEnvValues({
    VITE_FIREBASE_API_KEY:
      '// snippet const firebaseConfig = { apiKey: "AIzaSyExampleKey123", authDomain: "proj.firebaseapp.com" };',
    VITE_FIREBASE_AUTH_DOMAIN: 'proj.firebaseapp.com',
    VITE_FIREBASE_PROJECT_ID: 'proj',
    VITE_FIREBASE_APP_ID: '1:123:web:abc',
  });
  assert.equal(normalized.VITE_FIREBASE_API_KEY, 'AIzaSyExampleKey123');
  assert.equal(normalized.VITE_FIREBASE_AUTH_DOMAIN, 'proj.firebaseapp.com');
});

test('filterAndSortListings excludes unapproved listings by default and sorts prices accurately', () => {
  const approvedOnly = filterAndSortListings(SAMPLE_LISTINGS, { sortBy: 'price_desc' });
  assert.equal(approvedOnly.length, 2);
  assert.equal(approvedOnly[0].id, 'l-2');
  assert.equal(approvedOnly[1].id, 'l-1');

  const searchLamp = filterAndSortListings(SAMPLE_LISTINGS, { searchQuery: 'lamp' });
  assert.equal(searchLamp.length, 1);
  assert.equal(searchLamp[0].title, 'Study Lamp');

  const furnitureOnly = filterAndSortListings(SAMPLE_LISTINGS, {
    category: ProductCategory.Furniture,
  });
  assert.equal(furnitureOnly.length, 1);
  assert.equal(furnitureOnly[0].id, 'l-2');
});

test('validateListingInput catches missing required fields and validates Donate ₹0 edge case', () => {
  const invalid = validateListingInput({
    title: 'Hi',
    category: 'Unknown',
    description: 'Too short',
    price: -5,
    condition: 'Broken',
    transactionType: TransactionType.Sell,
    pickupLocation: '',
    images: [],
    contactPreference: 'Campus Inquiry + WhatsApp',
    sellerPhone: '123',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.title);
  assert.ok(invalid.errors.description);
  assert.ok(invalid.errors.price);
  assert.ok(invalid.errors.images);
  assert.ok(invalid.errors.sellerPhone);

  const validDonate = validateListingInput({
    title: 'First Year Engineering Notes',
    category: ProductCategory.StudyStationery,
    description: 'Clean spiral-bound notes for Semester 1 Physics and Maths.',
    price: 0,
    condition: ItemCondition.Good,
    transactionType: TransactionType.Donate,
    pickupLocation: 'Central Library Entrance',
    images: ['/notes.jpg'],
    contactPreference: 'Campus Inquiry Only',
  });
  assert.equal(validDonate.valid, true);
});

test('formatINR, calculateDiscountPercent, buildWhatsAppLink, and unit economics work accurately', () => {
  assert.equal(formatINR(1200), '₹1,200');
  assert.equal(calculateDiscountPercent(250, 500), 50);
  assert.equal(calculateDiscountPercent(500, 400), null);

  const wa = buildWhatsAppLink('9876543210', 'Study Lamp');
  assert.ok(wa?.startsWith('https://wa.me/919876543210?text='));
  assert.equal(buildWhatsAppLink('', 'Study Lamp'), null);

  const base = calculateUnitEconomics({
    name: 'Base',
    customers: 40,
    avgTransactionValue: 500,
    commissionRate: 0.1,
    variableCostPerTxn: 10,
    monthlyFixedCost: 1000,
    purchasesPerCustomer: 1,
  });
  assert.equal(base.indicativePlatformCommissionPerTxn, 50);
  assert.equal(base.monthlyPlatformRevenue, 2000);
  assert.equal(base.totalVariableCosts, 400);
  assert.equal(base.operatingSurplus, 600);
  assert.equal(base.breakEvenTransactions, 25);
});
