import { db, mockDb, isMockDb } from './index';
import { products, profiles, type NewProduct, type NewProfile } from './schema';
import { MOCK_PRODUCTS as SEED_PRODUCTS, MOCK_PROFILES as SEED_PROFILES } from './mock-data';


export async function seedDatabase() {
  console.log('[Seed] Starting ProteinShop Database Seeding...');

  if (isMockDb || !db) {
    console.log('[Seed] Operating in Mock Database Store mode.');
    mockDb.seedDefaults();
    console.log(`[Seed] Successfully seeded ${SEED_PRODUCTS.length} products to Mock Store.`);
    console.log(`[Seed] Successfully seeded ${SEED_PROFILES.length} profiles to Mock Store.`);
    return { success: true, count: SEED_PRODUCTS.length, mode: 'mock' };
  }

  try {
    // Insert Profiles
    for (const profile of SEED_PROFILES) {
      await db.insert(profiles).values(profile).onConflictDoNothing();
    }
    console.log(`[Seed] Profiles seeded to Postgres DB.`);

    // Insert Products
    for (const product of SEED_PRODUCTS) {
      await db.insert(products).values(product).onConflictDoUpdate({
        target: products.id,
        set: product,
      });
    }
    console.log(`[Seed] ${SEED_PRODUCTS.length} Flagship products seeded to Postgres DB.`);

    return { success: true, count: SEED_PRODUCTS.length, mode: 'postgres' };
  } catch (error) {
    console.error('[Seed] Database seeding failed:', error);
    throw error;
  }
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
