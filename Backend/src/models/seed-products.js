require("dotenv").config();
const bcrypt = require("bcryptjs");
const { getSql, end } = require("../config/db");

const CATEGORIES = [
  { name: "Electronics", slug: "electronics", description: "Audio, computing and everyday tech", image_url: "/images/categories/electronics.jpg" },
  { name: "Clothing", slug: "clothing", description: "Everyday apparel and footwear", image_url: "/images/categories/clothing.jpg" },
  { name: "Accessories", slug: "accessories", description: "Bags, eyewear and timepieces", image_url: "/images/categories/accessories.jpg" },
  { name: "Home & Kitchen", slug: "home-kitchen", description: "Considered pieces for the home", image_url: "/images/categories/home-kitchen.jpg" },
  { name: "Sports", slug: "sports", description: "Training gear for every routine", image_url: "/images/categories/sports.jpg" },
  { name: "Books", slug: "books", description: "Design, culture and slow reading", image_url: "/images/categories/books.jpg" },
  { name: "Beauty", slug: "beauty", description: "Skin, scent and daily rituals", image_url: "/images/categories/beauty.jpg" },
];

const PRODUCTS = [
  // Electronics
  {
    category: "electronics",
    name: "Aurora Wireless Headphones",
    slug: "aurora-wireless-headphones",
    price: 199.99,
    discount_price: 149.99,
    stock: 42,
    featured: true,
    short_description: "Over-ear ANC headphones with 40-hour battery life.",
    description:
      "Aurora pairs adaptive noise cancellation with memory-foam earcups and a warm, balanced sound signature. Forty hours of playback, USB-C fast charging and multipoint Bluetooth make it an everyday companion for work, travel and everything between.",
    weight: 0.28,
    dimensions: { width: 18, height: 20, depth: 8 },
  },
  {
    category: "electronics",
    name: "Pulse Studio Headphones",
    slug: "pulse-studio-headphones",
    price: 129.99,
    discount_price: 99.99,
    stock: 28,
    short_description: "Studio-tuned wireless headphones for deep focus.",
    description:
      "Pulse Studio delivers a neutral, detailed mix with plush ear cushions and a foldable frame. Tuned for long listening sessions, with a low-latency mode for video and a built-in mic for calls.",
    weight: 0.25,
    dimensions: { width: 17, height: 19, depth: 7 },
  },
  {
    category: "electronics",
    name: "Vertex Ultrabook 14",
    slug: "vertex-ultrabook-14",
    price: 1099.0,
    discount_price: 999.0,
    stock: 15,
    featured: true,
    short_description: "14-inch aluminium ultrabook with all-day battery.",
    description:
      "A 14-inch display, 16GB of memory and a fanless aluminium chassis that weighs under 1.2kg. Vertex is built for writers, designers and anyone who wants a quiet machine that lasts an entire working day.",
    weight: 1.18,
    dimensions: { width: 31.5, height: 1.5, depth: 22 },
  },
  {
    category: "electronics",
    name: "NovaBook 13 Pro",
    slug: "novabook-13-pro",
    price: 899.0,
    stock: 11,
    short_description: "Compact 13-inch laptop with a bright edge-to-edge display.",
    description:
      "NovaBook 13 Pro packs a high-resolution display, fast storage and a comfortable backlit keyboard into a slim, travel-ready body. Perfect as a second machine or a primary daily driver.",
    weight: 1.05,
    dimensions: { width: 30, height: 1.4, depth: 21 },
  },
  {
    category: "electronics",
    name: "Orbit Smartphone 5G",
    slug: "orbit-smartphone-5g",
    price: 749.0,
    discount_price: 699.0,
    stock: 33,
    featured: true,
    short_description: "6.5-inch OLED phone with a 50MP main camera.",
    description:
      "Orbit pairs a vivid 120Hz OLED panel with a 50MP main sensor, all-day battery and clean software. 5G, wireless charging and IP68 water resistance round out a phone that keeps up without the fuss.",
    weight: 0.19,
    dimensions: { width: 7.4, height: 15.8, depth: 0.8 },
  },
  {
    category: "electronics",
    name: "Lumen Cam X100",
    slug: "lumen-cam-x100",
    price: 649.0,
    discount_price: 549.0,
    stock: 9,
    short_description: "Mirrorless camera with a 24MP sensor and 4K video.",
    description:
      "A compact mirrorless body with a 24MP APS-C sensor, fast autofocus and 4K recording. The X100 is designed for creators who want control without carrying a bag full of gear.",
    weight: 0.56,
    dimensions: { width: 12, height: 8, depth: 7 },
  },
  {
    category: "electronics",
    name: "Tactile Mechanical Keyboard",
    slug: "tactile-mechanical-keyboard",
    price: 129.99,
    discount_price: 99.99,
    stock: 54,
    short_description: "Hot-swappable 75% keyboard with tactile switches.",
    description:
      "A compact 75% layout with hot-swappable tactile switches, PBT keycaps and a solid aluminium top plate. Three-mode connectivity lets you switch between desktop, laptop and tablet in seconds.",
    weight: 0.82,
    dimensions: { width: 32, height: 3.5, depth: 13 },
  },
  {
    category: "electronics",
    name: "Chrono Smartwatch S5",
    slug: "chrono-smartwatch-s5",
    price: 299.99,
    discount_price: 249.99,
    stock: 37,
    featured: true,
    short_description: "Health-focused smartwatch with a 7-day battery.",
    description:
      "Track heart rate, sleep, workouts and recovery on a bright always-on display. Chrono S5 lasts a full week between charges and pairs with both iOS and Android.",
    weight: 0.05,
    dimensions: { width: 4.4, height: 4.4, depth: 1.1 },
  },

  // Clothing
  {
    category: "clothing",
    name: "Everyday Cotton Tee",
    slug: "everyday-cotton-tee",
    price: 29.99,
    stock: 120,
    short_description: "Heavyweight organic cotton tee with a relaxed fit.",
    description:
      "A 240gsm organic cotton tee cut with a relaxed shoulder and a straight body. Pre-shrunk, garment-dyed and built to get softer with every wash.",
    weight: 0.2,
    dimensions: { width: 25, height: 3, depth: 30 },
  },
  {
    category: "clothing",
    name: "Heritage Denim Jacket",
    slug: "heritage-denim-jacket",
    price: 89.99,
    discount_price: 69.99,
    stock: 44,
    featured: true,
    short_description: "Mid-wash denim jacket with a classic trucker cut.",
    description:
      "A timeless trucker silhouette in sturdy 12oz denim. Metal shank buttons, two chest pockets and a slightly boxy fit that layers well over hoodies and tees.",
    weight: 0.85,
    dimensions: { width: 30, height: 5, depth: 40 },
  },
  {
    category: "clothing",
    name: "Studio Crew Sweatshirt",
    slug: "studio-crew-sweatshirt",
    price: 59.99,
    stock: 66,
    short_description: "Brushed cotton crewneck with a clean, minimal finish.",
    description:
      "A midweight brushed-back cotton crewneck with ribbed cuffs and a soft, broken-in hand feel. Cut straight through the body for an easy, everyday fit.",
    weight: 0.48,
    dimensions: { width: 28, height: 4, depth: 36 },
  },
  {
    category: "clothing",
    name: "Runner Knit Sneakers",
    slug: "runner-knit-sneakers",
    price: 129.99,
    discount_price: 99.99,
    stock: 58,
    featured: true,
    short_description: "Breathable knit running shoes with a responsive sole.",
    description:
      "A lightweight knit upper wraps the foot while a responsive foam midsole keeps long runs comfortable. A rubber outsole adds traction on road and light trail.",
    weight: 0.26,
    dimensions: { width: 11, height: 12, depth: 30 },
  },
  {
    category: "clothing",
    name: "Court Classic Sneakers",
    slug: "court-classic-sneakers",
    price: 109.99,
    stock: 49,
    short_description: "Low-top leather sneakers with a vintage court shape.",
    description:
      "Clean leather uppers, a cushioned insole and a gum rubber outsole. Court Classic is the pair that goes with everything and only looks better with wear.",
    weight: 0.34,
    dimensions: { width: 11.5, height: 11, depth: 31 },
  },
  {
    category: "clothing",
    name: "Trail Runner Shoes",
    slug: "trail-runner-shoes",
    price: 119.99,
    discount_price: 89.99,
    stock: 31,
    short_description: "Grippy trail shoes for mixed terrain.",
    description:
      "A protective trail shoe with a rock plate, aggressive lugs and a breathable mesh upper. Built for gravel paths, forest loops and everything in between.",
    weight: 0.3,
    dimensions: { width: 11.5, height: 12.5, depth: 31 },
  },
  {
    category: "clothing",
    name: "Motion Performance Sneakers",
    slug: "motion-performance-sneakers",
    price: 139.99,
    stock: 22,
    short_description: "Cushioned trainers for high-mileage weeks.",
    description:
      "A daily trainer with a wide platform, soft heel landing and a snappy forefoot. Motion is tuned for comfort on recovery days and steady miles alike.",
    weight: 0.27,
    dimensions: { width: 11.5, height: 12.5, depth: 31 },
  },
  {
    category: "clothing",
    name: "Aero Run Shoes",
    slug: "aero-run-shoes",
    price: 124.99,
    discount_price: 94.99,
    stock: 40,
    short_description: "Featherweight race-day shoes with a carbon plate.",
    description:
      "Aero strips weight without sacrificing bounce. A carbon-infused plate and supercritical foam make this the pair you reach for on race day.",
    weight: 0.21,
    dimensions: { width: 11, height: 11.5, depth: 30 },
  },

  // Accessories
  {
    category: "accessories",
    name: "Rayline Polarized Sunglasses",
    slug: "rayline-polarized-sunglasses",
    price: 79.99,
    discount_price: 59.99,
    stock: 64,
    featured: true,
    short_description: "Lightweight polarized sunglasses with UV400 lenses.",
    description:
      "A classic shape in a lightweight acetate frame. Polarized, UV400 lenses cut glare on water and road while staying comfortable for all-day wear.",
    weight: 0.03,
    dimensions: { width: 14.5, height: 4.5, depth: 4 },
  },
  {
    category: "accessories",
    name: "Vista Aviator Sunglasses",
    slug: "vista-aviator-sunglasses",
    price: 89.99,
    stock: 38,
    short_description: "Metal-frame aviators with a gradient lens.",
    description:
      "Slim metal temples, adjustable nose pads and a warm gradient lens. Vista is the easy finishing touch for sunny days.",
    weight: 0.03,
    dimensions: { width: 14, height: 5, depth: 4 },
  },
  {
    category: "accessories",
    name: "Nomad Leather Backpack",
    slug: "nomad-leather-backpack",
    price: 129.99,
    discount_price: 99.99,
    stock: 27,
    featured: true,
    short_description: "Full-grain leather backpack with a padded laptop sleeve.",
    description:
      "A minimal everyday backpack in full-grain leather with a padded 15-inch laptop sleeve, internal organiser and a quick-access front pocket. Ages beautifully with use.",
    weight: 1.1,
    dimensions: { width: 30, height: 42, depth: 13 },
  },
  {
    category: "accessories",
    name: "Metro Crossbody Bag",
    slug: "metro-crossbody-bag",
    price: 89.99,
    stock: 51,
    short_description: "Compact crossbody bag with an adjustable strap.",
    description:
      "Just enough room for a phone, wallet, keys and a small notebook. A water-resistant shell and adjustable webbing strap make Metro an easy daily carry.",
    weight: 0.42,
    dimensions: { width: 22, height: 16, depth: 7 },
  },
  {
    category: "accessories",
    name: "Summit Travel Backpack",
    slug: "summit-travel-backpack",
    price: 139.99,
    stock: 19,
    short_description: "Carry-on travel pack with clamshell opening.",
    description:
      "A 30-litre travel backpack with a clamshell opening, compression straps and a dedicated laptop compartment. Sized to fit most cabin allowances.",
    weight: 1.3,
    dimensions: { width: 34, height: 50, depth: 20 },
  },
  {
    category: "accessories",
    name: "Heritage Chrono Watch",
    slug: "heritage-chrono-watch",
    price: 199.99,
    discount_price: 159.99,
    stock: 23,
    short_description: "Sapphire-crystal chronograph on a leather strap.",
    description:
      "A 40mm chronograph with a sapphire crystal, brushed steel case and Italian leather strap. Quietly classic, with 50m water resistance for daily wear.",
    weight: 0.08,
    dimensions: { width: 4, height: 4, depth: 1.2 },
  },

  // Home & Kitchen
  {
    category: "home-kitchen",
    name: "Linen Accent Chair",
    slug: "linen-accent-chair",
    price: 249.0,
    discount_price: 199.0,
    stock: 12,
    featured: true,
    short_description: "Upholstered accent chair with solid oak legs.",
    description:
      "A softly curved accent chair upholstered in a durable linen blend, with solid oak legs and a generously padded seat. Small enough for a reading corner, comfortable enough to stay all evening.",
    weight: 9.5,
    dimensions: { width: 70, height: 78, depth: 72 },
  },
  {
    category: "home-kitchen",
    name: "Artisan Pour-Over Set",
    slug: "artisan-pour-over-set",
    price: 69.99,
    discount_price: 49.99,
    stock: 47,
    short_description: "Glass dripper, carafe and reusable filter.",
    description:
      "A complete pour-over kit with a borosilicate glass dripper, 600ml carafe and stainless steel filter. Brews a clean, bright cup with no paper filters to buy.",
    weight: 0.9,
    dimensions: { width: 15, height: 25, depth: 15 },
  },
  {
    category: "home-kitchen",
    name: "Stoneware Mug Set",
    slug: "stoneware-mug-set",
    price: 39.99,
    stock: 73,
    short_description: "Set of four hand-glazed stoneware mugs.",
    description:
      "Four 350ml stoneware mugs with a reactive glaze, so every piece is slightly different. Dishwasher and microwave safe, with a comfortable thick handle.",
    weight: 1.4,
    dimensions: { width: 30, height: 12, depth: 12 },
  },
  {
    category: "home-kitchen",
    name: "Terracotta Planter",
    slug: "terracotta-planter",
    price: 34.99,
    stock: 88,
    short_description: "Hand-thrown terracotta planter with drainage.",
    description:
      "A hand-thrown terracotta planter with a matching saucer and drainage hole. Breathable clay keeps roots healthy and develops a beautiful patina over time.",
    weight: 1.8,
    dimensions: { width: 18, height: 17, depth: 18 },
  },

  // Sports
  {
    category: "sports",
    name: "Pro Cast Dumbbell Set",
    slug: "pro-cast-dumbbell-set",
    price: 149.99,
    discount_price: 119.99,
    stock: 26,
    featured: true,
    short_description: "Rubber-coated cast dumbbells, pair of 10kg.",
    description:
      "A pair of 10kg cast-iron dumbbells with a durable rubber coating that protects floors and reduces noise. Knurled steel handles stay secure through every set.",
    weight: 20,
    dimensions: { width: 40, height: 18, depth: 18 },
  },
  {
    category: "sports",
    name: "Grip Fitness Dumbbells",
    slug: "grip-fitness-dumbbells",
    price: 89.99,
    stock: 34,
    short_description: "Neoprene dumbbells, pair of 5kg.",
    description:
      "Compact 5kg neoprene dumbbells for home workouts, warm-ups and mobility sessions. Soft-touch coating and a comfortable grip that won't slip.",
    weight: 10,
    dimensions: { width: 30, height: 14, depth: 14 },
  },
  {
    category: "sports",
    name: "Zen Yoga Mat",
    slug: "zen-yoga-mat",
    price: 49.99,
    discount_price: 39.99,
    stock: 61,
    short_description: "6mm non-slip mat with alignment guides.",
    description:
      "A 6mm natural-rubber mat with a grippy top layer and subtle alignment guides. Cushioned enough for long holds, light enough to carry to class.",
    weight: 1.5,
    dimensions: { width: 61, height: 0.6, depth: 183 },
  },

  // Books
  {
    category: "books",
    name: "The Art of Everyday Design",
    slug: "art-of-everyday-design",
    price: 34.99,
    discount_price: 27.99,
    stock: 45,
    featured: true,
    short_description: "A field guide to objects that quietly work.",
    description:
      "A beautifully illustrated look at the everyday objects that shape our lives, and the small decisions that make them feel inevitable. Part history, part design manifesto.",
    weight: 0.7,
    dimensions: { width: 18, height: 2.5, depth: 24 },
  },
  {
    category: "books",
    name: "Modern Minimalism",
    slug: "modern-minimalism",
    price: 29.99,
    stock: 52,
    short_description: "Rooms, routines and the case for less.",
    description:
      "A practical, warm guide to living with less — not as an aesthetic, but as a way to make room for what matters. Includes room-by-room notes and simple routines.",
    weight: 0.6,
    dimensions: { width: 17, height: 2, depth: 23 },
  },

  // Beauty
  {
    category: "beauty",
    name: "Amber Noir Eau de Parfum",
    slug: "amber-noir-eau-de-parfum",
    price: 119.99,
    discount_price: 89.99,
    stock: 30,
    featured: true,
    short_description: "Warm amber and cedar, 50ml eau de parfum.",
    description:
      "A soft, enveloping scent built around amber, cedar and a trace of vanilla. Long-wearing without being loud — the kind of fragrance people notice when they lean in.",
    weight: 0.25,
    dimensions: { width: 5, height: 14, depth: 5 },
  },
  {
    category: "beauty",
    name: "Botanical Glow Serum",
    slug: "botanical-glow-serum",
    price: 49.99,
    stock: 74,
    short_description: "Vitamin C and niacinamide brightening serum.",
    description:
      "A light, fast-absorbing serum with vitamin C, niacinamide and hyaluronic acid. Designed to even tone and add a healthy glow without irritation.",
    weight: 0.12,
    dimensions: { width: 4, height: 12, depth: 4 },
  },
  {
    category: "beauty",
    name: "Velvet Matte Lip Set",
    slug: "velvet-matte-lip-set",
    price: 39.99,
    discount_price: 29.99,
    stock: 58,
    short_description: "Three buildable matte lip colours.",
    description:
      "A trio of soft matte lips in everyday shades. Lightweight, non-drying and easy to build from a wash of colour to full coverage.",
    weight: 0.09,
    dimensions: { width: 8, height: 2, depth: 12 },
  },
  {
    category: "beauty",
    name: "Rose Quartz Skincare Set",
    slug: "rose-quartz-skincare-set",
    price: 74.99,
    stock: 41,
    short_description: "Cleanser, toning mist and moisturiser trio.",
    description:
      "A simple three-step routine for balanced, comfortable skin. A gentle gel cleanser, a hydrating mist and a ceramide moisturiser that layers under makeup.",
    weight: 0.45,
    dimensions: { width: 18, height: 16, depth: 8 },
  },
  {
    category: "beauty",
    name: "Silk Hair Ritual Oil",
    slug: "silk-hair-ritual-oil",
    price: 34.99,
    stock: 67,
    short_description: "Lightweight finishing oil for shine and softness.",
    description:
      "A non-greasy blend of argan and camellia oils that smooths frizz and adds shine. A few drops on damp or dry hair is all it takes.",
    weight: 0.14,
    dimensions: { width: 4, height: 13, depth: 4 },
  },
];

const GALLERY_POOL = {
  electronics: ["pulse-studio-headphones", "tactile-mechanical-keyboard", "chrono-smartwatch-s5", "lumen-cam-x100"],
  clothing: ["everyday-cotton-tee", "heritage-denim-jacket", "studio-crew-sweatshirt", "court-classic-sneakers"],
  accessories: ["nomad-leather-backpack", "metro-crossbody-bag", "vista-aviator-sunglasses", "summit-travel-backpack"],
  "home-kitchen": ["artisan-pour-over-set", "stoneware-mug-set", "terracotta-planter", "linen-accent-chair"],
  sports: ["grip-fitness-dumbbells", "zen-yoga-mat", "pro-cast-dumbbell-set"],
  books: ["modern-minimalism", "art-of-everyday-design"],
  beauty: ["botanical-glow-serum", "velvet-matte-lip-set", "rose-quartz-skincare-set", "silk-hair-ritual-oil"],
};

const DEMO_USERS = [
  { name: "Amara Okafor", email: "amara@example.com", points: 1780 },
  { name: "Daniel Reyes", email: "daniel@example.com", points: 920 },
  { name: "Mei Tanaka", email: "mei@example.com", points: 3410 },
  { name: "Lucas Silva", email: "lucas@example.com", points: 460 },
  { name: "Sofia Rossi", email: "sofia@example.com", points: 120 },
];

const REVIEW_COMMENTS = [
  "Genuinely better than I expected — the details feel considered and it arrived beautifully packaged.",
  "Exactly as described. Fast delivery and the quality is excellent for the price.",
  "I've used this every day for a few weeks now and it's holding up perfectly. Would buy again.",
  "Beautiful finish and very well made. A little smaller than I pictured, but I love it.",
  "Bought this as a gift and ended up ordering a second one for myself.",
  "Great value. Shipping was quick and everything arrived in perfect condition.",
  "The design is even nicer in person. Comfortable, sturdy and thoughtfully made.",
  "Does exactly what I needed. Simple, well-built and no complaints so far.",
];

function galleryFor(product) {
  const pool = (GALLERY_POOL[product.category] || []).filter(
    (slug) => slug !== product.slug
  );
  return pool.slice(0, 2).map((slug) => `/images/products/${slug}.jpg`);
}

async function seed() {
  const sql = getSql();

  try {
    for (const category of CATEGORIES) {
      await sql`
        INSERT INTO categories (name, slug, description, image_url, is_active)
        VALUES (${category.name}, ${category.slug}, ${category.description}, ${category.image_url}, TRUE)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          image_url = EXCLUDED.image_url,
          is_active = TRUE
      `;
    }
    console.log(`Categories ready (${CATEGORIES.length})`);

    const categoryRows = await sql`SELECT id, slug FROM categories`;
    const categoryIds = Object.fromEntries(
      categoryRows.map((row) => [row.slug, row.id])
    );

    let skuIndex = 1;
    for (const product of PRODUCTS) {
      const sku = `LMN-${String(skuIndex).padStart(3, "0")}`;
      skuIndex += 1;
      const imageUrl = `/images/products/${product.slug}.jpg`;
      const images = galleryFor(product);

      await sql`
        INSERT INTO products (
          category_id, name, slug, description, short_description, price,
          discount_price, stock, sku, image_url, images, is_featured,
          is_active, weight, dimensions
        ) VALUES (
          ${categoryIds[product.category]}, ${product.name}, ${product.slug},
          ${product.description}, ${product.short_description}, ${product.price},
          ${product.discount_price ?? null}, ${product.stock}, ${sku},
          ${imageUrl}, ${images}, ${product.featured ?? false}, TRUE,
          ${product.weight ?? null},
          ${product.dimensions ? JSON.stringify(product.dimensions) : null}
        )
        ON CONFLICT (slug) DO UPDATE SET
          category_id = EXCLUDED.category_id,
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          short_description = EXCLUDED.short_description,
          price = EXCLUDED.price,
          discount_price = EXCLUDED.discount_price,
          stock = EXCLUDED.stock,
          sku = EXCLUDED.sku,
          image_url = EXCLUDED.image_url,
          images = EXCLUDED.images,
          is_featured = EXCLUDED.is_featured,
          is_active = TRUE,
          weight = EXCLUDED.weight,
          dimensions = EXCLUDED.dimensions,
          updated_at = CURRENT_TIMESTAMP
      `;
    }
    console.log(`Products seeded (${PRODUCTS.length})`);

    const passwordHash = await bcrypt.hash("password123", 10);
    const userIds = [];
    for (const user of DEMO_USERS) {
      const rows = await sql`
        INSERT INTO users (name, email, password, role, loyalty_points)
        VALUES (${user.name}, ${user.email}, ${passwordHash}, 'customer', ${user.points})
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          loyalty_points = GREATEST(users.loyalty_points, EXCLUDED.loyalty_points)
        RETURNING id, name
      `;
      userIds.push(rows[0]);
    }
    console.log(`Demo customers ready (${userIds.length})`);

    const productRows = await sql`SELECT id FROM products WHERE is_active = TRUE ORDER BY id`;
    let reviewCount = 0;
    for (const row of productRows) {
      const perProduct = (row.id % 3) + 1;
      for (let i = 0; i < perProduct; i += 1) {
        const user = userIds[(row.id + i) % userIds.length];
        const rating = 4 + ((row.id + i) % 2);
        const comment = REVIEW_COMMENTS[(row.id + i) % REVIEW_COMMENTS.length];
        const inserted = await sql`
          INSERT INTO reviews (product_id, user_id, rating, comment, is_verified_purchase)
          VALUES (${row.id}, ${user.id}, ${rating}, ${comment}, ${(row.id + i) % 2 === 0})
          ON CONFLICT (product_id, user_id) DO NOTHING
          RETURNING id
        `;
        reviewCount += inserted.length;
      }
    }
    console.log(`Reviews seeded (+${reviewCount})`);

    const rewardCount = await sql`SELECT COUNT(*)::int AS count FROM loyalty_rewards`;
    if (rewardCount[0].count === 0) {
      await sql`
        INSERT INTO loyalty_rewards (name, description, points_required, discount_amount, discount_percent, is_active)
        VALUES
          ('Welcome Bonus', 'Get $5 off your next order', 100, 5.00, NULL, true),
          ('Silver Member', 'Get 10% off any order', 500, NULL, 10, true),
          ('Gold Member', 'Get 20% off any order', 1500, NULL, 20, true),
          ('Platinum Member', 'Get 30% off any order', 3000, NULL, 30, true)
      `;
      console.log("Loyalty rewards seeded");
    }

    const saleSlugs = [
      "aurora-wireless-headphones",
      "vertex-ultrabook-14",
      "nomad-leather-backpack",
      "pro-cast-dumbbell-set",
      "amber-noir-eau-de-parfum",
    ];
    const now = Date.now();
    let salesAdded = 0;
    for (let i = 0; i < saleSlugs.length; i += 1) {
      const rows = await sql`SELECT id FROM products WHERE slug = ${saleSlugs[i]}`;
      if (rows.length === 0) continue;
      const productId = rows[0].id;
      const existing = await sql`
        SELECT id FROM flash_sales
        WHERE product_id = ${productId} AND is_active = TRUE AND end_date >= NOW()
      `;
      if (existing.length > 0) continue;
      const start = new Date(now - 60 * 60 * 1000).toISOString();
      const finish = new Date(now + (2 + i) * 24 * 60 * 60 * 1000).toISOString();
      const percent = [20, 15, 25, 30, 10][i % 5];
      await sql`
        INSERT INTO flash_sales (product_id, discount_percent, start_date, end_date, max_quantity_per_user)
        VALUES (${productId}, ${percent}, ${start}, ${finish}, 5)
      `;
      salesAdded += 1;
    }
    console.log(`Flash sales seeded (+${salesAdded})`);

    const summary = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM categories WHERE is_active = TRUE) AS categories,
        (SELECT COUNT(*)::int FROM products WHERE is_active = TRUE) AS products,
        (SELECT COUNT(*)::int FROM reviews) AS reviews,
        (SELECT COUNT(*)::int FROM flash_sales WHERE is_active = TRUE AND end_date >= NOW()) AS active_flash_sales
    `;
    console.log("Seed summary:", summary[0]);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await end();
  }
}

seed();
