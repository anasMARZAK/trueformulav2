import { pgTable, text, timestamp, numeric, integer, json, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['customer', 'admin']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'completed', 'failed', 'refunded']);
export const purchaseTypeEnum = pgEnum('purchase_type', ['one_time', 'subscription']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'paused', 'cancelled']);

// Profiles Table
export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(), // Matches auth.users.id
  email: text('email').notNull(),
  fullName: text('full_name'),
  role: userRoleEnum('role').default('customer').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Products Table
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  nameEn: text('name_en').notNull(),
  nameFr: text('name_fr').notNull(),
  descriptionEn: text('description_en').notNull(),
  descriptionFr: text('description_fr').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url').notNull(),
  category: text('category').notNull(), // 'whey' | 'creatine' | 'wellness' | 'snacks' | 'plant' | 'preworkout' | 'accessories'
  flavors: json('flavors').$type<string[]>().default([]).notNull(),
  sizes: json('sizes').$type<string[]>().default([]).notNull(),
  stock: integer('stock').default(100).notNull(),
  popularityScore: integer('popularity_score').default(0).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Orders Table
export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => profiles.id).notNull(),
  customerEmail: text('customer_email'),
  customerName: text('customer_name'),
  status: orderStatusEnum('status').default('completed').notNull(),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('USD').notNull(),
  shippingAddress: json('shipping_address').notNull(),
  paymentMethod: text('payment_method').default('mock_card').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Order Items Table
export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productId: text('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  purchaseType: purchaseTypeEnum('purchase_type').notNull(),
  selectedFlavor: text('selected_flavor'),
  selectedSize: text('selected_size'),
});

// Subscriptions Table
export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => profiles.id).notNull(),
  productId: text('product_id').references(() => products.id).notNull(),
  status: subscriptionStatusEnum('status').default('active').notNull(),
  discountPercent: integer('discount_percent').default(20).notNull(),
  pricePerBilling: numeric('price_per_billing', { precision: 10, scale: 2 }).notNull(),
  intervalDays: integer('interval_days').default(30).notNull(),
  interval: text('interval').default('monthly').notNull(),
  nextBillingDate: timestamp('next_billing_date').notNull(),
  shippingAddress: json('shipping_address').notNull(),
  selectedFlavor: text('selected_flavor'),
  selectedSize: text('selected_size'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type Definitions
export type Profile = InferSelectModel<typeof profiles>;
export type NewProfile = InferInsertModel<typeof profiles>;

export type Product = InferSelectModel<typeof products>;
export type NewProduct = InferInsertModel<typeof products>;

export type Order = InferSelectModel<typeof orders>;
export type NewOrder = InferInsertModel<typeof orders>;

export type OrderItem = InferSelectModel<typeof orderItems>;
export type NewOrderItem = InferInsertModel<typeof orderItems>;

export type Subscription = InferSelectModel<typeof subscriptions>;
export type NewSubscription = InferInsertModel<typeof subscriptions>;

