import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { type Product, type Profile, type Order, type OrderItem, type Subscription } from './schema';

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DATABASE_URL;

import { MOCK_PRODUCTS as INITIAL_PRODUCTS, MOCK_PROFILES as INITIAL_PROFILES } from './mock-data';

// In-Memory Fallback Storage
class MockDatabaseStore {
  private profilesMap: Map<string, Profile> = new Map();
  private productsMap: Map<string, Product> = new Map();
  private ordersMap: Map<string, Order> = new Map();
  private orderItemsMap: Map<string, OrderItem[]> = new Map(); // orderId -> OrderItem[]
  private subscriptionsMap: Map<string, Subscription> = new Map();

  constructor() {
    this.seedDefaults();
  }

  public seedDefaults() {
    INITIAL_PRODUCTS.forEach((prod) => this.productsMap.set(prod.id, prod));
    INITIAL_PROFILES.forEach((prof) => this.profilesMap.set(prof.id, prof));

    // Seed default active subscription for testing fast-forward / renewal cron
    const sampleSub: Subscription = {
      id: 'sub_demo_01',
      userId: 'user_customer_01',
      productId: 'whey-isolate',
      status: 'active',
      discountPercent: 20,
      pricePerBilling: '39.99',
      intervalDays: 30,
      interval: 'monthly',
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      shippingAddress: {
        fullName: 'Alex Vance',
        email: 'alex.vance@bioluxe.io',
        address: '450 Sherbrooke St W',
        city: 'Montreal',
        postalCode: 'H3A 1B9',
        country: 'Canada',
      },
      selectedFlavor: 'Vanilla Bean',
      selectedSize: '1kg',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    };
    this.subscriptionsMap.set(sampleSub.id, sampleSub);
  }

  // --- Profiles ---
  async getProfiles(): Promise<Profile[]> {
    return Array.from(this.profilesMap.values());
  }

  async getProfileById(id: string): Promise<Profile | null> {
    return this.profilesMap.get(id) || null;
  }

  async upsertProfile(profile: Profile): Promise<Profile> {
    this.profilesMap.set(profile.id, profile);
    return profile;
  }

  // --- Products ---
  async getProducts(): Promise<Product[]> {
    return Array.from(this.productsMap.values());
  }

  async getProductById(id: string): Promise<Product | null> {
    return this.productsMap.get(id) || null;
  }

  async createProduct(product: Product): Promise<Product> {
    this.productsMap.set(product.id, product);
    return product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const existing = this.productsMap.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.productsMap.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.productsMap.delete(id);
  }

  // --- Orders ---
  async getOrders(): Promise<Order[]> {
    return Array.from(this.ordersMap.values());
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    return Array.from(this.ordersMap.values()).filter((o) => o.userId === userId);
  }

  async getOrderById(id: string): Promise<Order | null> {
    return this.ordersMap.get(id) || null;
  }

  async createOrder(order: Order, items: OrderItem[]): Promise<Order> {
    this.ordersMap.set(order.id, order);
    this.orderItemsMap.set(order.id, items);
    return order;
  }

  async updateOrderStatus(id: string, status: 'pending' | 'completed' | 'failed' | 'refunded'): Promise<Order | null> {
    const order = this.ordersMap.get(id);
    if (!order) return null;
    const updated = { ...order, status };
    this.ordersMap.set(id, updated);
    return updated;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return this.orderItemsMap.get(orderId) || [];
  }

  // --- Subscriptions ---
  async getSubscriptions(): Promise<Subscription[]> {
    return Array.from(this.subscriptionsMap.values());
  }

  async getSubscriptionsByUserId(userId: string): Promise<Subscription[]> {
    return Array.from(this.subscriptionsMap.values()).filter((s) => s.userId === userId);
  }

  async getSubscriptionById(id: string): Promise<Subscription | null> {
    return this.subscriptionsMap.get(id) || null;
  }

  async createSubscription(subscription: Subscription): Promise<Subscription> {
    this.subscriptionsMap.set(subscription.id, subscription);
    return subscription;
  }

  async updateSubscriptionStatus(id: string, status: 'active' | 'paused' | 'cancelled'): Promise<Subscription | null> {
    const sub = this.subscriptionsMap.get(id);
    if (!sub) return null;
    const updated = { ...sub, status, updatedAt: new Date() };
    this.subscriptionsMap.set(id, updated);
    return updated;
  }

  async getDueSubscriptions(): Promise<Subscription[]> {
    const now = new Date();
    return Array.from(this.subscriptionsMap.values()).filter(
      (s) => s.status === 'active' && new Date(s.nextBillingDate) <= now
    );
  }

  async updateNextBillingDate(id: string, nextDate: Date): Promise<Subscription | null> {
    const sub = this.subscriptionsMap.get(id);
    if (!sub) return null;
    const updated = { ...sub, nextBillingDate: nextDate, updatedAt: new Date() };
    this.subscriptionsMap.set(id, updated);
    return updated;
  }

  async updateSubscriptionInterval(id: string, intervalDays: number): Promise<Subscription | null> {
    const sub = this.subscriptionsMap.get(id);
    if (!sub) return null;
    const updated = { ...sub, interval: `${intervalDays} days`, updatedAt: new Date() };
    this.subscriptionsMap.set(id, updated);
    return updated;
  }

  async fastForwardSubscriptions(): Promise<number> {
    let count = 0;
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
    for (const [id, sub] of this.subscriptionsMap.entries()) {
      if (sub.status === 'active') {
        this.subscriptionsMap.set(id, { ...sub, nextBillingDate: pastDate, updatedAt: new Date() });
        count++;
      }
    }
    return count;
  }

  async decrementStock(productId: string, qty: number): Promise<void> {
    const prod = this.productsMap.get(productId);
    if (prod) {
      const currentStock = prod.stock ?? 100;
      this.productsMap.set(productId, { ...prod, stock: Math.max(0, currentStock - qty) });
    }
  }
}

// Global Singleton Mock Store instance
export const mockDb = new MockDatabaseStore();

// Setup Drizzle Client if DB connection string exists
let dbClient: ReturnType<typeof drizzle<typeof schema>> | null = null;

if (connectionString) {
  try {
    const client = postgres(connectionString);
    dbClient = drizzle(client, { schema });
  } catch (error) {
    console.warn('[DB] Failed to connect to Postgres. Falling back to Mock Database Store.', error);
  }
}

export const db = dbClient;
export const isMockDb = !dbClient;
