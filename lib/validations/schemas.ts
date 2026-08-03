import { z } from 'zod';

export const authLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const authRegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
});

export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const shippingAddressSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  address: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  postalCode: z.string().min(3, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
});

export const checkoutItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  nameEn: z.string().optional(),
  nameFr: z.string().optional(),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
  unitPrice: z.number().nonnegative().optional(),
  purchaseType: z.enum(['one_time', 'subscription']),
  selectedFlavor: z.string().optional(),
  selectedSize: z.string().optional(),
});

export const checkoutPayloadSchema = z.object({
  userId: z.string().optional(),
  userEmail: z.string().email().optional(),
  email: z.string().email().optional(),
  shippingAddress: shippingAddressSchema,
  items: z.array(checkoutItemSchema).min(1, 'Cart cannot be empty'),
  paymentMethod: z.string().optional(),
  language: z.enum(['en', 'fr']).optional(),
  idempotencyKey: z.string().optional(),
});

export const productCrudSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
  nameEn: z.string().min(2, 'English name required'),
  nameFr: z.string().min(2, 'French name required'),
  descriptionEn: z.string().min(5, 'English description required'),
  descriptionFr: z.string().min(5, 'French description required'),
  price: z.number().positive('Price must be greater than zero'),
  imageUrl: z.string().url('Invalid image URL'),
  category: z.string().min(1, 'Category is required'),
  flavors: z.array(z.string()).default([]),
  sizes: z.array(z.string()).default([]),
  stock: z.number().int().nonnegative().default(100),
  popularityScore: z.number().int().default(50),
  isFeatured: z.boolean().default(false),
});
