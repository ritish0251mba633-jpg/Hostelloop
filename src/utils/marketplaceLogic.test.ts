import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDiscountPercent,
  calculateUnitEconomics,
  filterAndSortListings,
  formatINR,
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

test('validateDguEmail enforces configurable DGU student domain', () => {
  const valid = validateDguEmail('ritish.0251mba633@dgu.ac.in');
  assert.equal(valid.valid, true);
  assert.equal(valid.isAllowedCampusDomain, true);

  const nonDgu = validateDguEmail('student@gmail.com');
  assert.equal(nonDgu.valid, false);
  assert.equal(nonDgu.isAllowedCampusDomain, false);

  const malformed = validateDguEmail('not-an-email');
  assert.equal(malformed.valid, false);
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
