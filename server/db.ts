import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Address, NotificationItem, Order, Product, ProductReview, User } from '../src/types';
import { INITIAL_PRODUCTS, INITIAL_REVIEWS } from './seedData';

export interface UserRecord extends User {
  passwordHash: string;
  passwordSalt: string;
  isAdmin?: boolean;
}

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface PasswordResetRecord {
  email: string;
  code: string;
  expiresAt: string;
}

export interface SupportMessageRecord {
  id: string;
  ticketNumber: string;
  userId?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  country?: string | null;
  subject: string;
  category?: string | null;
  message: string;
  screenshotUrl?: string | null;
  orderId?: string | null;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseSchema {
  users: UserRecord[];
  sessions: SessionRecord[];
  resetCodes: PasswordResetRecord[];
  products: Product[];
  reviews: ProductReview[];
  addresses: Address[];
  wishlists: Record<string, string[]>; // userId -> productIds
  orders: Order[];
  notifications: NotificationItem[];
  supportMessages: SupportMessageRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'store.json');

let db: DatabaseSchema = {
  users: [],
  sessions: [],
  resetCodes: [],
  products: [],
  reviews: [],
  addresses: [],
  wishlists: {},
  orders: [],
  notifications: [],
  supportMessages: [],
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadDatabase(): void {
  try {
    ensureDataDir();
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);

      // Filter out any demo / placeholder products
      const isDemoProductId = (id: string, name?: string) =>
        /^prod-0(0[1-9]|1[0-5])$/.test(id) ||
        id === 'prod-1789722236197-mwo2' ||
        (Boolean(name) && String(name).toLowerCase().includes('sony wh-1000xm6'));
      const cleanProducts = (parsed.products || []).filter((p: any) => !isDemoProductId(p.id, p.name));
      const cleanReviews = (parsed.reviews || []).filter((r: any) => !isDemoProductId(r.productId));

      // Also clean up any demo product IDs in wishlists
      const cleanWishlists: Record<string, string[]> = {};
      if (parsed.wishlists) {
        for (const [userId, productIds] of Object.entries(parsed.wishlists as Record<string, string[]>)) {
          cleanWishlists[userId] = productIds.filter((id) => !isDemoProductId(id));
        }
      }

      db = {
        users: parsed.users || [],
        sessions: parsed.sessions || [],
        resetCodes: parsed.resetCodes || [],
        products: cleanProducts,
        reviews: cleanReviews,
        addresses: parsed.addresses || [],
        wishlists: cleanWishlists,
        orders: parsed.orders || [],
        notifications: parsed.notifications || [],
        supportMessages: parsed.supportMessages || [],
      };
      saveDatabase();
      console.log(`[Database] Loaded successfully from ${DB_FILE}. Real Products count: ${db.products.length}, Users: ${db.users.length}`);
    } else {
      saveDatabase();
      console.log(`[Database] Initialized new persistent store at ${DB_FILE}`);
    }

    // Seed default demo users for Bangladesh, India, and Pakistan if not already present
    if (!db.users.some((u) => u.email === 'bd.demo@example.com')) {
      const demoAccounts = [
        {
          id: 'user-bd-demo',
          fullName: 'Tanvir Hasan',
          username: 'tanvir_bd',
          email: 'bd.demo@example.com',
          mobile: '+8801712345678',
          country: 'Bangladesh' as const,
          dob: '1995-06-15',
          gender: 'Male' as const,
          password: 'Password123!',
          defaultAddress: {
            id: 'addr-bd-1',
            userId: 'user-bd-demo',
            country: 'Bangladesh' as const,
            fullName: 'Tanvir Hasan',
            phone: '+8801712345678',
            mobileNumber: '+8801712345678',
            division: 'Dhaka',
            district: 'Dhaka',
            upazila: 'Dhanmondi',
            area: 'Road 8/A, House 24',
            postalCode: '1209',
            streetAddress: 'House 24, Road 8/A, Dhanmondi R/A',
            fullAddress: 'House 24, Road 8/A, Dhanmondi R/A, Dhaka 1209',
            isDefault: true,
          },
        },
        {
          id: 'user-in-demo',
          fullName: 'Priya Sharma',
          username: 'priya_in',
          email: 'in.demo@example.com',
          mobile: '+919876543210',
          country: 'India' as const,
          dob: '1998-04-20',
          gender: 'Female' as const,
          password: 'Password123!',
          defaultAddress: {
            id: 'addr-in-1',
            userId: 'user-in-demo',
            country: 'India' as const,
            fullName: 'Priya Sharma',
            phone: '+919876543210',
            mobileNumber: '+919876543210',
            state: 'Maharashtra',
            city: 'Mumbai',
            district: 'Mumbai Suburban',
            area: 'Bandra West, Hill Road',
            pinCode: '400050',
            streetAddress: 'Flat 402, Sea Pearl Apt, Hill Road',
            fullAddress: 'Flat 402, Sea Pearl Apt, Hill Road, Bandra West, Mumbai 400050',
            isDefault: true,
          },
        },
        {
          id: 'user-pk-demo',
          fullName: 'Bilal Khan',
          username: 'bilal_pk',
          email: 'pk.demo@example.com',
          mobile: '+923001234567',
          country: 'Pakistan' as const,
          dob: '1996-11-12',
          gender: 'Male' as const,
          password: 'Password123!',
          defaultAddress: {
            id: 'addr-pk-1',
            userId: 'user-pk-demo',
            country: 'Pakistan' as const,
            fullName: 'Bilal Khan',
            phone: '+923001234567',
            mobileNumber: '+923001234567',
            province: 'Punjab',
            city: 'Lahore',
            district: 'Lahore',
            area: 'Gulberg III, Block B',
            postalCode: '54000',
            streetAddress: 'House 18, Block B-1, Gulberg III',
            fullAddress: 'House 18, Block B-1, Gulberg III, Lahore 54000',
            isDefault: true,
          },
        },
      ];

      for (const acc of demoAccounts) {
        const { salt, hash } = hashPassword(acc.password);
        db.users.push({
          id: acc.id,
          fullName: acc.fullName,
          username: acc.username,
          email: acc.email,
          mobile: acc.mobile,
          country: acc.country,
          dob: acc.dob,
          gender: acc.gender,
          passwordHash: hash,
          passwordSalt: salt,
          createdAt: new Date().toISOString(),
        });
        db.addresses.push(acc.defaultAddress);
      }
      saveDatabase();
      console.log('[Database] Seeded demo users for Bangladesh, India, and Pakistan.');
    }

    // Ensure default admin user exists with admin permissions
    const adminUser = db.users.find((u) => u.email.toLowerCase() === 'admin@shop.com');
    if (!adminUser) {
      const { salt, hash } = hashPassword('admin123');
      db.users.push({
        id: 'usr-admin-default',
        fullName: 'Shop Administrator',
        username: 'admin',
        email: 'admin@shop.com',
        mobile: '+8801711000000',
        country: 'Bangladesh',
        dob: '1990-01-01',
        gender: 'Male',
        passwordHash: hash,
        passwordSalt: salt,
        createdAt: new Date().toISOString(),
        isAdmin: true,
      });
      saveDatabase();
      console.log('[Database] Seeded admin@shop.com default admin account');
    } else {
      adminUser.isAdmin = true;
    }
  } catch (err) {
    console.error('[Database] Failed to load data file, using defaults:', err);
    saveDatabase();
  }
}

export function saveDatabase(): void {
  try {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Database] Error persisting database to disk:', err);
  }
}

// Password utilities using Node's crypto
export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
}

// DB accessors
export const getDb = (): DatabaseSchema => db;

// User helpers
export function findUserByIdentifier(identifier: string): UserRecord | undefined {
  const clean = identifier.trim().toLowerCase();
  return db.users.find(
    (u) =>
      u.email.toLowerCase() === clean ||
      u.mobile.replace(/\D/g, '') === clean.replace(/\D/g, '') ||
      u.username.toLowerCase() === clean
  );
}

export function findUserById(id: string): UserRecord | undefined {
  return db.users.find((u) => u.id === id);
}

export function createSession(userId: string): string {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  db.sessions.push({
    token,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt,
  });
  saveDatabase();
  return token;
}

export function validateSession(token: string): UserRecord | null {
  if (!token) return null;
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    // expired
    db.sessions = db.sessions.filter((s) => s.token !== token);
    saveDatabase();
    return null;
  }
  const user = findUserById(session.userId);
  return user || null;
}

export function deleteSession(token: string): void {
  db.sessions = db.sessions.filter((s) => s.token !== token);
  saveDatabase();
}

// Strip sensitive fields from User object
export function sanitizeUser(user: UserRecord): User {
  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    mobile: user.mobile,
    country: user.country,
    dob: user.dob,
    gender: user.gender,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

export function getSupportMessages(): SupportMessageRecord[] {
  return db.supportMessages || [];
}

export function addSupportMessage(msg: SupportMessageRecord): SupportMessageRecord {
  if (!db.supportMessages) db.supportMessages = [];
  db.supportMessages.unshift(msg);
  saveDatabase();
  return msg;
}

export function updateSupportMessageStatus(id: string, status: 'open' | 'in_progress' | 'resolved'): boolean {
  if (!db.supportMessages) return false;
  const target = db.supportMessages.find((m) => m.id === id);
  if (target) {
    target.status = status;
    target.updatedAt = new Date().toISOString();
    saveDatabase();
    return true;
  }
  return false;
}

