import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import {
  SEED_INQUIRIES,
  SEED_LISTINGS,
  SEED_REPORTS,
  SEED_USERS,
} from './src/data/seedData.ts';
import {
  AvailabilityStatus,
  InquiryRecord,
  ModerationStatus,
  ProductListing,
  ReportRecord,
  TransactionFeedback,
  TransactionType,
  UserProfile,
  VerificationStatus,
} from './src/types/marketplace.ts';
import {
  DEFAULT_ALLOWED_DGU_DOMAINS,
  validateDguEmail,
  validateListingInput,
} from './src/utils/marketplaceLogic.ts';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'hostelloop-db.json');

const ALLOWED_DGU_DOMAINS = (
  process.env.HOSTELLOOP_ALLOWED_DOMAINS || DEFAULT_ALLOWED_DGU_DOMAINS.join(',')
)
  .split(',')
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

interface StoredUser extends UserProfile {
  passwordHash?: string;
  verificationCode?: string;
  resetCode?: string;
}

interface DatabaseSchema {
  users: StoredUser[];
  listings: ProductListing[];
  inquiries: InquiryRecord[];
  reports: ReportRecord[];
  feedback: TransactionFeedback[];
  wishlists: Record<string, string[]>;
  sessions: Record<string, string>;
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash?: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, keyHex] = storedHash.split(':');
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

function generateSixDigitCode(): string {
  return String(crypto.randomInt(100000, 999999));
}

function sanitizeUser(user: StoredUser): UserProfile {
  const { passwordHash: _p, verificationCode: _v, resetCode: _r, ...safe } = user;
  return safe;
}

function createInitialDb(): DatabaseSchema {
  return {
    users: SEED_USERS.map((u) => ({ ...u })),
    listings: SEED_LISTINGS.map((l) => ({ ...l })),
    inquiries: SEED_INQUIRIES.map((i) => ({ ...i })),
    reports: SEED_REPORTS.map((r) => ({ ...r })),
    feedback: [],
    wishlists: {
      'demo-student-1': ['demo-lamp-1', 'demo-table-4'],
      guest: [],
    },
    sessions: {},
  };
}

function loadDb(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial = createInitialDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
    return {
      users: parsed.users && parsed.users.length > 0 ? parsed.users : SEED_USERS.map((u) => ({ ...u })),
      listings: parsed.listings && parsed.listings.length > 0 ? parsed.listings : SEED_LISTINGS.map((l) => ({ ...l })),
      inquiries: parsed.inquiries || SEED_INQUIRIES.map((i) => ({ ...i })),
      reports: parsed.reports || SEED_REPORTS.map((r) => ({ ...r })),
      feedback: parsed.feedback || [],
      wishlists: parsed.wishlists || { 'demo-student-1': ['demo-lamp-1'], guest: [] },
      sessions: parsed.sessions || {},
    };
  } catch {
    const fallback = createInitialDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
}

function saveDb(db: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

let db = loadDb();

interface AuthedRequest extends Request {
  currentUser?: StoredUser;
  authToken?: string;
}

function attachUser(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (token && db.sessions[token]) {
    const userId = db.sessions[token];
    const found = db.users.find((u) => u.id === userId);
    if (found && found.accountStatus === 'active') {
      req.currentUser = found;
      req.authToken = token;
    }
  }
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use(attachUser);

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'HostelLoop API', mode: 'local-persistent-store' });
  });

  app.get('/api/config', (_req, res) => {
    res.json({
      allowedDomains: ALLOWED_DGU_DOMAINS,
      emailDeliveryConfigured: Boolean(process.env.SMTP_HOST),
      demoModeAvailable: true,
    });
  });

  // Auth: Current session
  app.get('/api/auth/me', (req: AuthedRequest, res) => {
    if (!req.currentUser) {
      return res.json({ user: null });
    }
    return res.json({ user: sanitizeUser(req.currentUser) });
  });

  // Auth: Sign Up with DGU domain validation and real pending verification code
  app.post('/api/auth/signup', (req, res) => {
    const {
      name,
      email,
      password,
      hostelBlock = 'Boys Hostel Block A',
      roomNumber = '',
      programAndYear = 'Student',
    } = req.body || {};

    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ error: 'Please enter your full name.' });
    }
    const emailCheck = validateDguEmail(String(email || ''), ALLOWED_DGU_DOMAINS);
    if (!emailCheck.valid) {
      return res.status(400).json({ error: emailCheck.error });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return res.status(409).json({ error: 'An account with this DGU email already exists. Please sign in.' });
    }

    const code = generateSixDigitCode();
    const newUser: StoredUser = {
      id: `user-${crypto.randomUUID().slice(0, 8)}`,
      name: String(name).trim(),
      email: normalizedEmail,
      role: 'student',
      verificationStatus: VerificationStatus.Pending,
      isDemoAccount: false,
      hostelBlock: String(hostelBlock).trim(),
      roomNumber: String(roomNumber).trim(),
      programAndYear: String(programAndYear).trim(),
      phone: '',
      whatsappOptIn: false,
      bio: 'DGU campus member on HostelLoop.',
      joinedAt: new Date().toISOString(),
      accountStatus: 'active',
      passwordHash: hashPassword(String(password)),
      verificationCode: code,
    };

    const token = crypto.randomBytes(24).toString('hex');
    db.users.push(newUser);
    db.sessions[token] = newUser.id;
    db.wishlists[newUser.id] = [];
    saveDb(db);

    return res.status(201).json({
      token,
      user: sanitizeUser(newUser),
      verificationPending: true,
      simulatedCampusEmailNotice:
        'SMTP email delivery is not configured in this local environment. Use the simulated campus inbox verification code below to complete DGU email verification.',
      demoVerificationCode: code,
    });
  });

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user || user.isDemoAccount) {
      return res.status(401).json({
        error: 'Invalid email or password. Use the Demo Mode switcher for pre-seeded demo accounts.',
      });
    }
    if (user.accountStatus === 'suspended') {
      return res.status(403).json({ error: 'This account has been suspended by campus moderation.' });
    }
    if (!verifyPassword(String(password || ''), user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = crypto.randomBytes(24).toString('hex');
    db.sessions[token] = user.id;
    saveDb(db);

    return res.json({
      token,
      user: sanitizeUser(user),
    });
  });

  // Auth: Enter clearly-labelled Demo Mode
  app.post('/api/auth/demo-session', (req, res) => {
    const { accountType = 'student' } = req.body || {};
    const targetId = accountType === 'admin' ? 'demo-admin-1' : 'demo-student-1';
    const demoUser = db.users.find((u) => u.id === targetId);
    if (!demoUser) {
      return res.status(404).json({ error: 'Demo profile unavailable.' });
    }
    const token = crypto.randomBytes(24).toString('hex');
    db.sessions[token] = demoUser.id;
    saveDb(db);
    return res.json({
      token,
      user: sanitizeUser(demoUser),
    });
  });

  // Auth: Verify DGU email with 6-digit code
  app.post('/api/auth/verify-email', (req: AuthedRequest, res) => {
    if (!req.currentUser) {
      return res.status(401).json({ error: 'Sign in required.' });
    }
    if (req.currentUser.isDemoAccount) {
      return res.status(400).json({
        error: 'Demo accounts cannot be marked as verified DGU students. Sign up with a @dgu.ac.in email.',
      });
    }
    const { code } = req.body || {};
    if (!code || String(code).trim() !== req.currentUser.verificationCode) {
      return res.status(400).json({ error: 'Verification code does not match. Please check and try again.' });
    }
    req.currentUser.verificationStatus = VerificationStatus.Verified;
    req.currentUser.verifiedAt = new Date().toISOString();
    req.currentUser.verificationCode = undefined;

    // Update seller verification status on existing listings created by this user
    db.listings = db.listings.map((item) =>
      item.sellerId === req.currentUser!.id
        ? { ...item, sellerVerificationStatus: VerificationStatus.Verified }
        : item
    );
    saveDb(db);

    return res.json({ user: sanitizeUser(req.currentUser) });
  });

  // Auth: Resend DGU verification code
  app.post('/api/auth/resend-code', (req: AuthedRequest, res) => {
    if (!req.currentUser || req.currentUser.isDemoAccount) {
      return res.status(400).json({ error: 'Verification codes only apply to registered @dgu.ac.in accounts.' });
    }
    const code = generateSixDigitCode();
    req.currentUser.verificationCode = code;
    saveDb(db);
    return res.json({
      demoVerificationCode: code,
      message: 'A new 6-digit verification code has been generated in the simulated campus inbox.',
    });
  });

  // Auth: Forgot password & reset
  app.post('/api/auth/forgot-password', (req, res) => {
    const normalizedEmail = String(req.body?.email || '').trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail && !u.isDemoAccount);
    if (!user) {
      return res.status(404).json({ error: 'No registered DGU account found with that email.' });
    }
    const resetCode = generateSixDigitCode();
    user.resetCode = resetCode;
    saveDb(db);
    return res.json({
      message: 'Password reset code generated (simulated campus inbox delivery).',
      demoResetCode: resetCode,
    });
  });

  app.post('/api/auth/reset-password', (req, res) => {
    const { email, code, newPassword } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail && !u.isDemoAccount);
    if (!user || !user.resetCode || String(code).trim() !== user.resetCode) {
      return res.status(400).json({ error: 'Invalid reset code or email.' });
    }
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }
    user.passwordHash = hashPassword(String(newPassword));
    user.resetCode = undefined;
    saveDb(db);
    return res.json({ message: 'Password updated successfully. You can now sign in.' });
  });

  app.post('/api/auth/logout', (req: AuthedRequest, res) => {
    if (req.authToken) {
      delete db.sessions[req.authToken];
      saveDb(db);
    }
    return res.json({ ok: true });
  });

  // Profile update
  app.patch('/api/auth/profile', (req: AuthedRequest, res) => {
    if (!req.currentUser) {
      return res.status(401).json({ error: 'Sign in required to update your profile.' });
    }
    const { name, hostelBlock, roomNumber, programAndYear, phone, whatsappOptIn, bio, avatarUrl } =
      req.body || {};

    if (name && String(name).trim().length >= 2) {
      req.currentUser.name = String(name).trim();
    }
    if (hostelBlock !== undefined) req.currentUser.hostelBlock = String(hostelBlock).trim();
    if (roomNumber !== undefined) req.currentUser.roomNumber = String(roomNumber).trim();
    if (programAndYear !== undefined) req.currentUser.programAndYear = String(programAndYear).trim();
    if (phone !== undefined) req.currentUser.phone = String(phone).trim();
    if (whatsappOptIn !== undefined) req.currentUser.whatsappOptIn = Boolean(whatsappOptIn);
    if (bio !== undefined) req.currentUser.bio = String(bio).trim();
    if (avatarUrl !== undefined) req.currentUser.avatarUrl = String(avatarUrl);

    // Sync seller info onto user's listings
    db.listings = db.listings.map((item) =>
      item.sellerId === req.currentUser!.id
        ? {
            ...item,
            sellerName: req.currentUser!.name,
            sellerHostelBlock: req.currentUser!.hostelBlock,
            sellerPhone: req.currentUser!.whatsappOptIn ? req.currentUser!.phone : undefined,
          }
        : item
    );

    saveDb(db);
    return res.json({ user: sanitizeUser(req.currentUser) });
  });

  // Listings: GET all visible + user's own
  app.get('/api/listings', (req: AuthedRequest, res) => {
    const userId = req.currentUser?.id;
    const isAdmin = req.currentUser?.role === 'admin';
    const listings = db.listings.filter(
      (l) =>
        l.moderationStatus === ModerationStatus.Approved ||
        isAdmin ||
        (userId && l.sellerId === userId)
    );
    return res.json({ listings });
  });

  // Listings: POST create new listing
  app.post('/api/listings', (req: AuthedRequest, res) => {
    if (!req.currentUser) {
      return res.status(401).json({ error: 'Please sign in or enter Demo Mode before listing an item.' });
    }
    const payload = req.body || {};
    const validation = validateListingInput({
      title: payload.title,
      category: payload.category,
      description: payload.description,
      price: payload.price,
      originalPrice: payload.originalPrice,
      condition: payload.condition,
      transactionType: payload.transactionType,
      pickupLocation: payload.pickupLocation,
      images: payload.images,
      contactPreference: payload.contactPreference,
      sellerPhone: payload.sellerPhone,
    });

    if (!validation.valid) {
      return res.status(400).json({ error: 'Please fix the highlighted form fields.', errors: validation.errors });
    }

    const numericPrice =
      payload.transactionType === TransactionType.Donate ? 0 : Math.round(Number(payload.price));
    const numericOriginal =
      payload.originalPrice !== undefined && payload.originalPrice !== ''
        ? Math.round(Number(payload.originalPrice))
        : undefined;

    const newListing: ProductListing = {
      id: `item-${crypto.randomUUID().slice(0, 8)}`,
      title: String(payload.title).trim(),
      category: payload.category,
      description: String(payload.description).trim(),
      price: numericPrice,
      originalPrice: numericOriginal,
      condition: payload.condition,
      images: payload.images,
      transactionType: payload.transactionType,
      availability: AvailabilityStatus.Available,
      // New listings go live immediately for campus MVP testing while remaining reviewable in Admin queue
      moderationStatus: ModerationStatus.Approved,
      sellerId: req.currentUser.id,
      sellerName: req.currentUser.name,
      sellerHostelBlock: req.currentUser.hostelBlock,
      sellerVerificationStatus: req.currentUser.verificationStatus,
      sellerContactPreference: payload.contactPreference,
      sellerPhone:
        payload.contactPreference === 'Campus Inquiry + WhatsApp'
          ? String(payload.sellerPhone || req.currentUser.phone || '').trim()
          : undefined,
      pickupLocation: String(payload.pickupLocation).trim(),
      createdAt: new Date().toISOString(),
      isDemo: req.currentUser.isDemoAccount,
      featuredExperimentOptIn: Boolean(payload.featuredExperimentOptIn),
      exchangePreference: payload.exchangePreference ? String(payload.exchangePreference).trim() : undefined,
      rentPeriod: payload.rentPeriod ? String(payload.rentPeriod).trim() : undefined,
      viewCount: 1,
    };

    db.listings.unshift(newListing);
    saveDb(db);
    return res.status(201).json({ listing: newListing });
  });

  // Listings: PATCH availability / moderation
  app.patch('/api/listings/:id', (req: AuthedRequest, res) => {
    if (!req.currentUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const listing = db.listings.find((l) => l.id === req.params.id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }
    const isOwner = listing.sellerId === req.currentUser.id;
    const isAdmin = req.currentUser.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to edit this listing.' });
    }

    const { availability, moderationStatus } = req.body || {};
    if (availability && Object.values(AvailabilityStatus).includes(availability)) {
      listing.availability = availability;
    }
    if (moderationStatus && isAdmin && Object.values(ModerationStatus).includes(moderationStatus)) {
      listing.moderationStatus = moderationStatus;
    }
    saveDb(db);
    return res.json({ listing });
  });

  app.delete('/api/listings/:id', (req: AuthedRequest, res) => {
    if (!req.currentUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const listing = db.listings.find((l) => l.id === req.params.id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }
    if (listing.sellerId !== req.currentUser.id && req.currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied.' });
    }
    db.listings = db.listings.filter((l) => l.id !== req.params.id);
    saveDb(db);
    return res.json({ ok: true });
  });

  // Wishlist
  app.get('/api/wishlist', (req: AuthedRequest, res) => {
    const key = req.currentUser?.id || (req.headers['x-guest-id'] as string) || 'guest';
    return res.json({ wishlistIds: db.wishlists[key] || [] });
  });

  app.post('/api/wishlist/toggle', (req: AuthedRequest, res) => {
    const key = req.currentUser?.id || (req.headers['x-guest-id'] as string) || 'guest';
    const listingId = String(req.body?.listingId || '');
    if (!listingId) {
      return res.status(400).json({ error: 'listingId is required.' });
    }
    const current = new Set(db.wishlists[key] || []);
    if (current.has(listingId)) {
      current.delete(listingId);
    } else {
      current.add(listingId);
    }
    db.wishlists[key] = Array.from(current);
    saveDb(db);
    return res.json({ wishlistIds: db.wishlists[key] });
  });

  // Inquiries (Buyer-Seller Connection)
  app.get('/api/inquiries', (req: AuthedRequest, res) => {
    if (!req.currentUser) {
      return res.json({ inquiries: [] });
    }
    const uid = req.currentUser.id;
    const relevant =
      req.currentUser.role === 'admin'
        ? db.inquiries
        : db.inquiries.filter((inq) => inq.buyerId === uid || inq.sellerId === uid);
    return res.json({ inquiries: relevant });
  });

  app.post('/api/inquiries', (req: AuthedRequest, res) => {
    if (!req.currentUser) {
      return res.status(401).json({ error: 'Please sign in or enter Demo Mode to contact a seller.' });
    }
    const { listingId, message, preferredMeetupSpot, proposedTime } = req.body || {};
    const listing = db.listings.find((l) => l.id === listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }
    if (!message || String(message).trim().length < 5) {
      return res.status(400).json({ error: 'Please write a brief message for the seller (at least 5 characters).' });
    }
    const inquiry: InquiryRecord = {
      id: `inq-${crypto.randomUUID().slice(0, 8)}`,
      listingId: listing.id,
      listingTitle: listing.title,
      listingPrice: listing.price,
      listingImage: listing.images[0] || '',
      buyerId: req.currentUser.id,
      buyerName: req.currentUser.name,
      buyerEmail: req.currentUser.email,
      buyerVerificationStatus: req.currentUser.verificationStatus,
      sellerId: listing.sellerId,
      sellerName: listing.sellerName,
      message: String(message).trim(),
      preferredMeetupSpot: String(preferredMeetupSpot || listing.pickupLocation).trim(),
      proposedTime: String(proposedTime || 'Flexible after classes').trim(),
      status: 'Pending Seller Response',
      isDemo: req.currentUser.isDemoAccount || listing.isDemo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.inquiries.unshift(inquiry);
    saveDb(db);
    return res.status(201).json({ inquiry });
  });

  app.patch('/api/inquiries/:id', (req: AuthedRequest, res) => {
    if (!req.currentUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const inquiry = db.inquiries.find((i) => i.id === req.params.id);
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found.' });
    }
    const isParticipant =
      inquiry.buyerId === req.currentUser.id ||
      inquiry.sellerId === req.currentUser.id ||
      req.currentUser.role === 'admin';
    if (!isParticipant) {
      return res.status(403).json({ error: 'Permission denied.' });
    }
    const { status, sellerReply } = req.body || {};
    if (sellerReply !== undefined) {
      inquiry.sellerReply = String(sellerReply).trim();
    }
    if (status) {
      inquiry.status = status;
    }
    inquiry.updatedAt = new Date().toISOString();

    if (status === 'Completed') {
      const listing = db.listings.find((l) => l.id === inquiry.listingId);
      if (listing && listing.availability !== AvailabilityStatus.Sold) {
        listing.availability = AvailabilityStatus.Sold;
      }
    }
    saveDb(db);
    return res.json({ inquiry });
  });

  // Post-Transaction Feedback (Mission 10 Item 5)
  app.get('/api/feedback', (_req, res) => {
    return res.json({ feedback: db.feedback });
  });

  app.post('/api/feedback', (req: AuthedRequest, res) => {
    if (!req.currentUser) {
      return res.status(401).json({ error: 'Sign in required.' });
    }
    const { inquiryId, listingId, listingTitle, rating, wouldUseAgain, alternativeWouldHaveUsed, notes } =
      req.body || {};
    const entry: TransactionFeedback = {
      id: `fb-${crypto.randomUUID().slice(0, 8)}`,
      inquiryId: String(inquiryId || ''),
      listingId: String(listingId || ''),
      listingTitle: String(listingTitle || 'Campus Item'),
      rating: Math.min(5, Math.max(1, Number(rating || 5))),
      wouldUseAgain: Boolean(wouldUseAgain),
      alternativeWouldHaveUsed: String(alternativeWouldHaveUsed || 'WhatsApp student groups'),
      notes: String(notes || '').trim(),
      createdAt: new Date().toISOString(),
    };
    db.feedback.unshift(entry);
    saveDb(db);
    return res.status(201).json({ entry });
  });

  // Safety Reports
  app.post('/api/reports', (req: AuthedRequest, res) => {
    const { targetType, targetId, targetName, reason, details } = req.body || {};
    if (!targetId || !reason) {
      return res.status(400).json({ error: 'Target and reason are required to submit a report.' });
    }
    const report: ReportRecord = {
      id: `rep-${crypto.randomUUID().slice(0, 8)}`,
      targetType: targetType === 'user' ? 'user' : 'listing',
      targetId: String(targetId),
      targetName: String(targetName || targetId),
      reporterId: req.currentUser?.id || 'anonymous-guest',
      reporterName: req.currentUser?.name || 'Campus Visitor',
      reason: String(reason).trim(),
      details: String(details || '').trim(),
      status: 'open',
      isDemo: Boolean(req.currentUser?.isDemoAccount),
      createdAt: new Date().toISOString(),
    };
    db.reports.unshift(report);
    saveDb(db);
    return res.status(201).json({ report });
  });

  // Admin Console Data & Moderation
  app.get('/api/admin/overview', (_req, res) => {
    const users = db.users.map(sanitizeUser);
    const listings = db.listings;
    const reports = db.reports;
    const inquiries = db.inquiries;

    const liveListings = listings.filter((l) => !l.isDemo);
    const demoListings = listings.filter((l) => l.isDemo);
    const completedTxns = inquiries.filter((i) => i.status === 'Completed').length;

    return res.json({
      stats: {
        totalUsers: users.length,
        verifiedUsers: users.filter((u) => u.verificationStatus === VerificationStatus.Verified).length,
        totalListings: listings.length,
        demoListingsCount: demoListings.length,
        liveUserListingsCount: liveListings.length,
        activeListings: listings.filter(
          (l) => l.moderationStatus === ModerationStatus.Approved && l.availability === AvailabilityStatus.Available
        ).length,
        pendingListings: listings.filter((l) => l.moderationStatus === ModerationStatus.Pending).length,
        completedTransactions: completedTxns,
        reportedListings: reports.filter((r) => r.status === 'open').length,
      },
      users,
      listings,
      reports,
      feedback: db.feedback,
    });
  });

  app.patch('/api/admin/users/:id', (req: AuthedRequest, res) => {
    if (!req.currentUser || req.currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    const target = db.users.find((u) => u.id === req.params.id);
    if (!target) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const { accountStatus } = req.body || {};
    if (accountStatus === 'active' || accountStatus === 'suspended') {
      target.accountStatus = accountStatus;
    }
    saveDb(db);
    return res.json({ user: sanitizeUser(target) });
  });

  app.patch('/api/admin/reports/:id', (req: AuthedRequest, res) => {
    if (!req.currentUser || req.currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    const report = db.reports.find((r) => r.id === req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }
    const { status } = req.body || {};
    if (status === 'open' || status === 'resolved' || status === 'dismissed') {
      report.status = status;
    }
    saveDb(db);
    return res.json({ report });
  });

  // Vite dev middleware or static dist serving
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HostelLoop server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start HostelLoop server:', err);
  process.exit(1);
});
