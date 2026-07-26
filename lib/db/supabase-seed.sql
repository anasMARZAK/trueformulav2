-- =================================================================
-- TRUE FORMULA — SUPABASE DATABASE SEED DATA
-- Execute this SQL after running supabase-schema.sql to populate your
-- database with all 7 luxury TRUE FORMULA products.
-- =================================================================

INSERT INTO public.products (id, name_en, name_fr, description_en, description_fr, price, image_url, category, flavors, sizes, stock, is_featured)
VALUES
  (
    'whey-isolate',
    'Pure Native Whey Isolate (1kg)',
    'Protéine de Lactosérum Isolat Pure (1kg)',
    'Cold-filtered native whey isolate delivering 26g of pure protein per serving with 0g sugar and zero artificial fillers.',
    'Isolat de lactosérum natif filtré à froid apportant 26g de protéines pures par portion avec 0g de sucre et zéro additif synthétique.',
    49.99,
    '/images/true-formula-whey.jpg',
    'whey',
    '["Vanilla Bean", "Dark Chocolate", "Strawberry Cream", "Unflavored"]'::jsonb,
    '["1kg", "2.5kg"]'::jsonb,
    150,
    true
  ),
  (
    'creatine-monohydrate',
    'Micronized Creatine Monohydrate (500g)',
    'Créatine Monohydrate Micronisée (500g)',
    'Pharmaceutical-grade 200 mesh micronized creatine for rapid ATP regeneration, maximum power output, and cognitive enhancement.',
    'Créatine micronisée 200 mesh de qualité pharmaceutique pour une régénération ATP rapide, puissance maximale et soutien cognitif.',
    29.99,
    '/images/true-formula-creatine.jpg',
    'creatine',
    '["Unflavored", "Blue Raspberry", "Lemon Lime"]'::jsonb,
    '["300g", "500g"]'::jsonb,
    200,
    true
  ),
  (
    'marine-collagen',
    'Bio-Active Marine Collagen (300g)',
    'Collagène Marin Bio-Actif (300g)',
    'Hydrolyzed wild-caught marine collagen peptides enriched with hyaluronic acid and Vitamin C for dermal elasticity and joint integrity.',
    'Peptides de collagène marin sauvage hydrolysé enrichis en acide hyaluronique et vitamine C pour l''élasticité cutanée et la santé articulaire.',
    39.99,
    '/images/true-formula-collagen.jpg',
    'wellness',
    '["Unflavored", "Salted Caramel", "Peach Iced Tea"]'::jsonb,
    '["400g"]'::jsonb,
    120,
    true
  ),
  (
    'protein-bar-box',
    'Artisanal Protein Crunch Bar (Box of 12)',
    'Barre Protéinée Crunch Artisanale (Boîte de 12)',
    'Gourmet triple-layered protein bar containing 20g protein and less than 2g sugar per bar. Crisp texture with natural cacao.',
    'Barre protéinée gourmande triple couche contenant 20g de protéines et moins de 2g de sucre par barre. Texture croustillante au cacao naturel.',
    34.99,
    '/images/true-formula-bar.jpg',
    'snacks',
    '["Triple Chocolate", "Salted Peanut Butter", "Berry Crunch"]'::jsonb,
    '["12 Bars"]'::jsonb,
    80,
    true
  ),
  (
    'plant-protein',
    'Organic Plant Protein Blend (900g)',
    'Mélange de Protéines Végétales Bio (900g)',
    'Tri-source organic plant protein (fermented pea, pumpkin seed, sacha inchi) providing a complete amino acid profile.',
    'Protéine végétale tri-source bio (pois fermenté, graine de courge, sacha inchi) offrant un profil d''acides aminés complet.',
    44.99,
    '/images/true-formula-plant.jpg',
    'plant',
    '["Vanilla Matcha", "Chocolate Hazelnut"]'::jsonb,
    '["900g"]'::jsonb,
    90,
    true
  ),
  (
    'pre-workout',
    'Pre-Workout Bio-Energy Elixir (400g)',
    'Élixir Pré-Workout Bio-Énergie (400g)',
    'Clean nitric oxide & Focus formulation with L-Citrulline, Beta-Alanine, and Natural Green Tea Caffeine. Zero jitter crash.',
    'Formulation propre oxyde nitrique et concentration avec L-Citrulline, Bêta-Alanine et caféine de thé vert naturel.',
    38.99,
    '/images/true-formula-preworkout.jpg',
    'preworkout',
    '["Yuzu Citrus", "Electric Watermelon"]'::jsonb,
    '["400g"]'::jsonb,
    110,
    false
  ),
  (
    'steel-shaker',
    'Apothecary Matte Steel Shaker (750ml)',
    'Shaker Inox Mat Apothicaire (750ml)',
    'Double-wall insulated stainless steel shaker bottle keeping liquids ice-cold for 24 hours. Odor-resistant with leak-proof lid.',
    'Shaker isotherme en acier inoxydable double paroi gardant les liquides glacés pendant 24h. Résistant aux odeurs et étanche.',
    24.99,
    '/images/true-formula-shaker.jpg',
    'accessories',
    '["Matte Obsidian", "Sage Green", "Porcelain White"]'::jsonb,
    '["750ml"]'::jsonb,
    300,
    false
  )
ON CONFLICT (id) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_fr = EXCLUDED.name_fr,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category,
  stock = EXCLUDED.stock,
  is_featured = EXCLUDED.is_featured;

-- =================================================================
-- REVIEWS SEED DATA
-- =================================================================

INSERT INTO public.reviews (id, name_en, name_fr, role_en, role_fr, rating, text_en, text_fr, product_bought_en, product_bought_fr, avatar_initials, accent_color, is_verified_buyer)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Alex M.',
    'Alex M.',
    'Competitive CrossFit Athlete',
    'Athlète CrossFit Compétitif',
    5,
    'I''ve tried dozens of whey isolates over the years. TRUE FORMULA''s Native Isolate is on a completely different level — clean taste, zero bloating, and my recovery has never been faster. The 20% subscription discount makes it a no-brainer.',
    'J''ai essayé des dizaines d''isolats de whey au fil des années. L''Isolat Natif de TRUE FORMULA est d''un tout autre niveau — goût pur, zéro ballonnements, et ma récupération n''a jamais été aussi rapide.',
    'Pure Native Whey Isolate (1kg)',
    'Protéine de Lactosérum Isolat Pure (1kg)',
    'AM',
    '#2E5A44',
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Sophie L.',
    'Sophie L.',
    'Yoga Instructor & Wellness Coach',
    'Instructrice de Yoga & Coach Bien-être',
    5,
    'The Marine Collagen with hyaluronic acid has transformed my skin and joint health. I notice a visible difference in elasticity after just 3 weeks. Finally a brand that delivers what it promises without unnecessary additives.',
    'Le Collagène Marin avec acide hyaluronique a transformé ma peau et mes articulations. J''ai remarqué une différence visible en élasticité après seulement 3 semaines.',
    'Bio-Active Marine Collagen (300g)',
    'Collagène Marin Bio-Actif (300g)',
    'SL',
    '#1E3A5F',
    true
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'David K.',
    'David K.',
    'Powerlifting Coach',
    'Entraîneur de Force',
    5,
    'Micronized 200 mesh creatine mixes completely clear into water with zero gritty texture. Explosive power gains within 10 days of loading. Outstanding pharmaceutical-grade purity.',
    'La créatine micronisée 200 mesh se mélange de manière complètement transparente dans l''eau sans texture grumeleuse. Gains de puissance explosifs.',
    'Micronized Creatine Monohydrate (500g)',
    'Créatine Monohydrate Micronisée (500g)',
    'DK',
    '#5C6B2F',
    true
  )
ON CONFLICT (id) DO NOTHING;

