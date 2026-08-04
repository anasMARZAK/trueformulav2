import { db, mockDb, isMockDb } from './index';
import { products, profiles } from './schema';
import { MOCK_PRODUCTS as SEED_PRODUCTS, MOCK_PROFILES as SEED_PROFILES } from './mock-data';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ahgzohemtjzawrdkuprf.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoZ3pvaGVtdGp6YXdyZGt1cHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMDUzMzcsImV4cCI6MjEwMDU4MTMzN30.dpZnKnDOA_lKpqLeTTfi-AsUVkeT4AXRXVZwyWBD2bo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function seedDatabase() {
  console.log('[Seed] Starting True Formula Database Seeding...');

  // Always seed memory mockDb
  mockDb.seedDefaults();

  // Seed Supabase REST API directly
  try {
    console.log('[Seed] Seeding Supabase database tables via REST API...');
    const sbProducts = SEED_PRODUCTS.map((p) => ({
      id: p.id,
      name_en: p.nameEn,
      name_fr: p.nameFr,
      description_en: p.descriptionEn,
      description_fr: p.descriptionFr,
      price: parseFloat(p.price),
      image_url: p.imageUrl,
      category: p.category,
      flavors: p.flavors,
      sizes: p.sizes,
      stock: p.stock ?? 100,
      popularity_score: (p as any).popularityScore ?? 50,
      is_featured: p.isFeatured,
    }));

    const { error: prodErr } = await supabase.from('products').upsert(sbProducts, { onConflict: 'id' });
    if (prodErr) {
      console.warn('[Seed] Supabase products upsert notice:', prodErr.message);
    } else {
      console.log(`[Seed] ${sbProducts.length} Products successfully upserted to Supabase!`);
    }

    const sbProfiles = SEED_PROFILES.map((prof) => ({
      id: prof.id,
      email: prof.email,
      full_name: prof.fullName,
      role: prof.role,
    }));

    const { error: profErr } = await supabase.from('profiles').upsert(sbProfiles, { onConflict: 'id' });
    if (profErr) {
      console.warn('[Seed] Supabase profiles upsert notice:', profErr.message);
    } else {
      console.log(`[Seed] ${sbProfiles.length} Profiles successfully upserted to Supabase!`);
    }
  } catch (err) {
    console.warn('[Seed] Supabase REST seeding warning:', err);
  }

  if (!isMockDb && db) {
    try {
      // Insert Profiles via Drizzle
      for (const profile of SEED_PROFILES) {
        await db.insert(profiles).values(profile as any).onConflictDoNothing();
      }
      // Insert Products via Drizzle
      for (const product of SEED_PRODUCTS) {
        await db.insert(products).values(product as any).onConflictDoUpdate({
          target: products.id,
          set: product as any,
        });
      }
      console.log(`[Seed] Drizzle Postgres seeding complete.`);
    } catch (error) {
      console.warn('[Seed] Drizzle seeding warning:', error);
    }
  }

  return { success: true, count: SEED_PRODUCTS.length };
}

// Allow direct execution via CLI
if (require.main === module) {
  seedDatabase()
    .then((res) => {
      console.log('[Seed] Seeding completed successfully:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed] Seeding failed with error:', err);
      process.exit(1);
    });
}

