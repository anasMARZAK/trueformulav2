import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

let dbUrl = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.replace('DATABASE_URL=', '').trim();
    break;
  }
}

async function run() {
  console.log('Connecting to PostgreSQL database to seed standard products...');
  const sql = postgres(dbUrl, { ssl: { rejectUnauthorized: false } });

  try {
    // Insert short IDs from supabase-seed.sql
    await sql`
      INSERT INTO public.products (id, name_en, name_fr, description_en, description_fr, price, image_url, category, flavors, sizes, stock, is_featured)
      VALUES
        ('whey-isolate', 'Pure Native Whey Isolate (1kg)', 'Protéine de Lactosérum Isolat Pure (1kg)', 'Cold-filtered native whey isolate delivering 26g of pure protein per serving with 0g sugar and zero artificial fillers.', 'Isolat de lactosérum natif filtré à froid apportant 26g de protéines pures par portion avec 0g de sucre et zéro additif synthétique.', 49.99, '/images/true-formula-whey.jpg', 'whey', '["Vanilla Bean", "Dark Chocolate", "Strawberry Cream", "Unflavored"]'::jsonb, '["1kg", "2.5kg"]'::jsonb, 150, true),
        ('creatine-monohydrate', 'Micronized Creatine Monohydrate (500g)', 'Créatine Monohydrate Micronisée (500g)', 'Pharmaceutical-grade 200 mesh micronized creatine for rapid ATP regeneration, maximum power output, and cognitive enhancement.', 'Créatine micronisée 200 mesh de qualité pharmaceutique pour une régénération ATP rapide, puissance maximale et soutien cognitif.', 29.99, '/images/true-formula-creatine.jpg', 'creatine', '["Unflavored", "Blue Raspberry", "Lemon Lime"]'::jsonb, '["300g", "500g"]'::jsonb, 200, true),
        ('marine-collagen', 'Bio-Active Marine Collagen (300g)', 'Collagène Marin Bio-Actif (300g)', 'Hydrolyzed wild-caught marine collagen peptides enriched with hyaluronic acid and Vitamin C for dermal elasticity and joint integrity.', 'Peptides de collagène marin sauvage hydrolysé enrichis en acide hyaluronique et vitamine C pour l''élasticité cutanée et la santé articulaire.', 39.99, '/images/true-formula-collagen.jpg', 'wellness', '["Unflavored", "Salted Caramel", "Peach Iced Tea"]'::jsonb, '["400g"]'::jsonb, 120, true),
        ('plant-protein', 'Organic Plant Protein Blend (900g)', 'Mélange de Protéines Végétales Bio (900g)', 'Tri-source organic plant protein (fermented pea, pumpkin seed, sacha inchi) providing a complete amino acid profile.', 'Protéine végétale tri-source bio (pois fermenté, graine de courge, sacha inchi) offrant un profil d''acides aminés complet.', 44.99, '/images/true-formula-plant.jpg', 'plant', '["Vanilla Matcha", "Chocolate Hazelnut"]'::jsonb, '["900g"]'::jsonb, 90, true),
        ('pre-workout', 'Pre-Workout Bio-Energy Elixir (400g)', 'Élixir Pré-Workout Bio-Énergie (400g)', 'Clean nitric oxide & Focus formulation with L-Citrulline, Beta-Alanine, and Natural Green Tea Caffeine. Zero jitter crash.', 'Formulation propre oxyde nitrique et concentration avec L-Citrulline, Bêta-Alanine et caféine de thé vert naturel.', 38.99, '/images/true-formula-preworkout.jpg', 'preworkout', '["Yuzu Citrus", "Electric Watermelon"]'::jsonb, '["400g"]'::jsonb, 110, false),
        ('steel-shaker', 'Apothecary Matte Steel Shaker (750ml)', 'Shaker Inox Mat Apothicaire (750ml)', 'Double-wall insulated stainless steel shaker bottle keeping liquids ice-cold for 24 hours. Odor-resistant with leak-proof lid.', 'Shaker isotherme en acier inoxydable double paroi gardant les liquides glacés pendant 24h. Résistant aux odeurs et étanche.', 24.99, '/images/true-formula-shaker.jpg', 'accessories', '["Matte Obsidian", "Sage Green", "Porcelain White"]'::jsonb, '["750ml"]'::jsonb, 300, false)
      ON CONFLICT (id) DO NOTHING;
    `;
    console.log('SUCCESS: Seeded standard product IDs into public.products table!');
  } catch (err: any) {
    console.error('Error seeding products:', err.message);
  } finally {
    await sql.end();
  }
}

run();
