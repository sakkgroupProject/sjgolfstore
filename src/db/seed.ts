import { sql } from "drizzle-orm";
import { db } from "@/db";
import {
  addresses,
  auditLogs,
  categories,
  contactEnquiries,
  contentBlocks,
  discounts,
  inventoryHistory,
  jobs,
  newsletterSubscribers,
  notifications,
  orderEvents,
  orderItems,
  orders,
  pages,
  productOptions,
  products,
  reviews,
  searchSynonyms,
  settings,
  shippingRates,
  shippingZones,
  staffUsers,
  taxRegions,
  transactions,
  users,
  variants,
  webhooks,
  type ProductImage,
} from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { pool } from "@/db";
import { TABLE_DDL } from "@/db/tables";

/**
 * Product & marketing photography.
 *
 * These are the original Pexels stock photos (real photographs, free for
 * commercial use — pexels.com license, no attribution required). See
 * IMAGE_MANIFEST.md for a description of every image and how to replace
 * them with your own photos.
 */
/**
 * All product & marketing photography is bundled in `public/images/<id>.jpg`
 * (original Pexels stock photos) so the store renders instantly with zero
 * external dependencies. See IMAGE_MANIFEST.md for what each photo shows.
 */
const P = (id: number, _w = 1200, _h = 1200) => `/images/${id}.jpg`;

const IMG: Record<string, string> = {
  hero: P(35918445, 1800, 1000),
  story: P(5644638, 1200, 1400),
  clubs: P(15376335, 900, 1100),
  clubs2: P(9207752, 900, 1100),
  balls: P(1325731, 900, 1100),
  gloves: P(9366577, 900, 1100),
  bags: P(7758346, 900, 1100),
  accessories: P(9207753, 900, 1100),
  apparel: P(9366514, 900, 1100),
  apparel2: P(6256043, 900, 1100),
  training: P(6542400, 900, 1100),
  tech: P(1325724, 900, 1100),
  course: P(10028414, 1200, 800),
  course2: P(5644639, 1200, 800),
  course3: P(5151973, 1200, 800),
  course4: P(6256594, 1200, 800),
  course5: P(37825475, 1200, 800),
  bag2: P(1325681, 900, 1100),
  bag3: P(15686443, 900, 1100),
  lifestyle: P(6256342, 900, 1100),
  store: P(1325706, 1200, 800),
  woman: P(6230538, 900, 1100),
  walk: P(10579231, 1200, 800),
  duo: P(5044378, 1200, 800),
  balls2: P(1325733, 900, 1100),
};

type SeedProduct = {
  slug: string;
  title: string;
  brand: string;
  type: string;
  cat: string;
  price: number;
  compare?: number;
  cost: number;
  short: string;
  desc: string;
  main: number;
  tags: string[];
  options?: { name: string; values: string[] }[];
  specs?: { label: string; value: string }[];
  featured?: boolean;
  gender?: string;
  clubType?: string;
  shaft?: string;
  loft?: string;
  weight?: number;
  sold?: number;
};

const HAND_FLEX = [
  { name: "Hand", values: ["Right", "Left"] },
  { name: "Flex", values: ["Regular", "Stiff", "X-Stiff"] },
];
const SIZE_ONLY = [{ name: "Size", values: ["S", "M", "L", "XL", "XXL"] }];
const GLOVE_OPTS = [
  { name: "Hand", values: ["Left", "Right"] },
  { name: "Size", values: ["S", "M", "L", "XL"] },
];
const PACK_OPTS = [{ name: "Size", values: ["1 Dozen", "3 Dozen"] }];

const CATS = [
  { slug: "golf-clubs", name: "Golf Clubs", tagline: "Drivers, irons, wedges & putters", description: "Tour-inspired club technology for every handicap. Custom fit for hand, flex and loft so every swing delivers distance and control.", image: IMG.clubs },
  { slug: "golf-balls", name: "Golf Balls", tagline: "Tour, distance & soft feel", description: "Premium multi-layer golf balls engineered for greenside spin, straight flight and lasting durability.", image: IMG.balls },
  { slug: "golf-gloves", name: "Golf Gloves", tagline: "Cabretta leather & all-weather", description: "Tour-grade gloves with breathable leather and secure grip in every condition.", image: IMG.gloves },
  { slug: "golf-bags", name: "Golf Bags", tagline: "Stand, cart, carry & travel", description: "Lightweight stand bags, 14-way cart bags and protective travel covers built for the long haul.", image: IMG.bags },
  { slug: "golf-accessories", name: "Golf Accessories", tagline: "Tees, towels, headcovers & more", description: "The details that finish your bag — headcovers, towels, markers, rangefinder accessories and more.", image: IMG.accessories },
  { slug: "golf-apparel", name: "Golf Apparel", tagline: "Polos, outerwear, caps & trousers", description: "Performance fabrics with a clean American silhouette. Moisture wicking, four-way stretch, tour ready.", image: IMG.apparel },
  { slug: "training-equipment", name: "Training Equipment", tagline: "Practice like a pro", description: "Nets, mats, alignment aids and putting trainers that sharpen your game between rounds.", image: IMG.training },
  { slug: "golf-technology", name: "Golf Technology", tagline: "Launch monitors & GPS", description: "Rangefinders, launch monitors and swing analyzers that put real data in your bag.", image: IMG.tech },
];

const PRODUCTS: SeedProduct[] = [
  // ---------------- Golf Clubs ----------------
  { slug: "sj-tour-apex-driver", title: "SJ Tour Apex Driver", brand: "SJ Golf", type: "Drivers", cat: "golf-clubs", price: 49900, compare: 59900, cost: 26800, short: "460cc titanium driver with adjustable weighting for a piercing, forgiving ball flight.", desc: "The SJ Tour Apex Driver pairs a forged titanium face with a carbon crown to push mass low and deep. An adjustable 16-position hosel lets you dial loft and face angle in seconds, while rear perimeter weighting tames spin for a mid-launch, low-spin flight that holds its line in wind.",
    main: 8557694, tags: ["golf-clubs", "drivers", "featured", "sale"], options: HAND_FLEX, specs: [{ label: "Club", value: "Driver" }, { label: "Loft", value: "9° / 10.5° adjustable" }, { label: "Shaft", value: "SJ Project Graphite" }, { label: "Head Volume", value: "460cc" }, { label: "Grip", value: "SJ Tour Velvet 360" }], featured: true, clubType: "Driver", loft: "10.5", shaft: "Graphite", weight: 320, sold: 148 },
  { slug: "sj-forged-cb-irons", title: "SJ Forged CB Irons (5-PW)", brand: "SJ Golf", type: "Irons", cat: "golf-clubs", price: 89900, compare: 104900, cost: 51200, short: "Grain-flow forged cavity back irons with soft carbon steel feel.", desc: "A double-nickel chrome finish over grain-flow forged 1025E carbon steel gives these irons the soft, dampened feel better players ask for. Progressive cavity weighting keeps long irons forgiving while short irons stay compact and workable.",
    main: 15376330, tags: ["golf-clubs", "irons", "sale"], options: HAND_FLEX, specs: [{ label: "Set", value: "5-PW (6 clubs)" }, { label: "Material", value: "Forged 1025E carbon steel" }, { label: "Shaft", value: "SJ Steel or Graphite" }, { label: "Finish", value: "Double nickel chrome" }], clubType: "Irons", shaft: "Steel", weight: 2800, sold: 96 },
  { slug: "sj-blade-putter-milled", title: "SJ Milled Blade Putter", brand: "SJ Golf", type: "Putters", cat: "golf-clubs", price: 27900, cost: 13200, short: "CNC-milled 303 stainless blade with a soft, truthful roll.", desc: "Milled from a solid billet of 303 stainless steel with a face-milled pattern that normalizes ball speed across the face. A plumber neck with full-shaft offset suits players with an arcing stroke.",
    main: 34716904, tags: ["golf-clubs", "putters"], options: [{ name: "Hand", values: ["Right", "Left"] }], specs: [{ label: "Head", value: "303 stainless steel" }, { label: "Length", value: "34 in / 35 in" }, { label: "Loft", value: "3°" }, { label: "Grip", value: "SJ Pistol Tour" }], featured: true, clubType: "Putter", weight: 560, sold: 121 },
  { slug: "sj-wedge-series-raw", title: "SJ Raw Tour Wedge", brand: "SJ Golf", type: "Wedges", cat: "golf-clubs", price: 15900, cost: 7100, short: "Raw forged wedge with precision-milled grooves for maximum spin.", desc: "Micro-milled grooves and a raw, unplated face deliver Tour-level friction on partial shots. Grind options match how you deliver the club through turf.",
    main: 8557693, tags: ["golf-clubs", "wedges"], options: [{ name: "Hand", values: ["Right", "Left"] }, { name: "Flex", values: ["Wedge Flex", "Stiff"] }], specs: [{ label: "Lofts", value: "50° / 54° / 58° / 60°" }, { label: "Finish", value: "Raw" }, { label: "Grooves", value: "Precision milled" }], clubType: "Wedge", loft: "56", weight: 300, sold: 87 },
  { slug: "sj-fairway-x-wood", title: "SJ Fairway X 3-Wood", brand: "SJ Golf", type: "Fairway Woods", cat: "golf-clubs", price: 24900, compare: 28900, cost: 11800, short: "Low-spin stainless fairway wood built to hold greens from distance.", desc: "A shallow face and rear sole weight create a high, controllable launch that still lands steep. Perfect off the tee on tight par 4s or into long par 5s.",
    main: 17768938, tags: ["golf-clubs", "fairway-woods", "sale"], options: HAND_FLEX, specs: [{ label: "Loft", value: "15°" }, { label: "Shaft", value: "SJ Project Graphite" }], clubType: "Fairway Wood", loft: "15", weight: 210, sold: 64 },
  { slug: "sj-hybrid-rescue", title: "SJ Rescue Hybrid", brand: "SJ Golf", type: "Hybrids", cat: "golf-clubs", price: 19900, cost: 9200, short: "Easy-launch hybrid that replaces long irons without losing workability.", desc: "A compact steel body with internal weighting produces a high, soft-landing flight. The face is hot off the toe — where most amateurs miss.",
    main: 33855229, tags: ["golf-clubs", "hybrids"], options: HAND_FLEX, specs: [{ label: "Lofts", value: "19° / 22° / 25°" }, { label: "Shaft", value: "SJ Project Graphite" }], clubType: "Hybrid", loft: "22", weight: 240, sold: 73 },
  { slug: "sj-complete-set-14", title: "SJ Complete 14-Piece Set", brand: "SJ Golf", type: "Club Sets", cat: "golf-clubs", price: 129900, compare: 149900, cost: 71000, short: "Driver through putter with stand bag — everything you need to walk 18.", desc: "A matched set engineered around one swing profile: 460cc driver, fairway wood, two hybrids, 6-PW irons, sand wedge, mallet putter and a lightweight stand bag with headcovers.",
    main: 1325703, tags: ["golf-clubs", "sets", "sale", "featured"], options: HAND_FLEX, specs: [{ label: "Pieces", value: "14 including bag" }, { label: "Bag", value: "SJ Lite Stand Bag" }], featured: true, clubType: "Set", weight: 9500, sold: 41 },
  { slug: "sj-players-distance-irons", title: "SJ Players Distance Irons (4-PW)", brand: "SJ Golf", type: "Irons", cat: "golf-clubs", price: 109900, cost: 61000, short: "Hollow-body long irons with forged short irons for blended performance.", desc: "A two-piece construction places a thin forged face behind a soft body in the long irons for speed, while scoring irons stay solid forged for feel.",
    main: 9207752, tags: ["golf-clubs", "irons"], options: HAND_FLEX, specs: [{ label: "Set", value: "4-PW (7 clubs)" }, { label: "Construction", value: "Hollow body / forged" }], clubType: "Irons", shaft: "Steel", weight: 3100, sold: 58 },
  { slug: "sj-mallet-putter-align", title: "SJ Alignment Mallet Putter", brand: "SJ Golf", type: "Putters", cat: "golf-clubs", price: 22900, cost: 10600, short: "High-MOI mallet with a sightline that squares the face at address.", desc: "Tungsten heel-and-toe weights push stability outward for a putter that resists twisting on off-center strikes.",
    main: 34728093, tags: ["golf-clubs", "putters"], options: [{ name: "Hand", values: ["Right", "Left"] }], specs: [{ label: "Head", value: "6061 aluminum + tungsten" }, { label: "Length", value: "34 in / 35 in" }], clubType: "Putter", weight: 590, sold: 66 },
  { slug: "sj-driver-lt-womens", title: "SJ Apex Lite Driver — Women's", brand: "SJ Golf", type: "Drivers", cat: "golf-clubs", price: 44900, cost: 24200, short: "Lightweight build with higher loft for easy carry and added carry distance.", desc: "Lighter overall club weight, softer flex options and 12° of standard loft help generate speed and launch without forcing it.",
    main: 15376326, tags: ["golf-clubs", "drivers", "womens"], options: [{ name: "Hand", values: ["Right", "Left"] }, { name: "Flex", values: ["Ladies", "Regular"] }], specs: [{ label: "Loft", value: "12°" }, { label: "Shaft", value: "SJ Lite 45g" }], clubType: "Driver", gender: "Women", loft: "12", weight: 280, sold: 37 },
  { slug: "sj-junior-club-set", title: "SJ Junior Starter Set (Ages 9-12)", brand: "SJ Golf", type: "Club Sets", cat: "golf-clubs", price: 27900, compare: 32900, cost: 14100, short: "Lightweight, properly lengthed junior set that builds good habits early.", desc: "Age-appropriate lengths and flexible shafts make it easy for young players to launch the ball and stay interested.",
    main: 6542382, tags: ["golf-clubs", "junior", "sets", "sale"], options: [{ name: "Hand", values: ["Right", "Left"] }], specs: [{ label: "Clubs", value: "Driver, hybrid, 7i, PW, putter" }, { label: "Includes", value: "Stand bag + headcover" }], clubType: "Set", gender: "Junior", weight: 4200, sold: 52 },
  { slug: "sj-chipper-utility", title: "SJ Two-Way Chipper", brand: "SJ Golf", type: "Wedges", cat: "golf-clubs", price: 8900, cost: 4100, short: "Putter-length chipping club that takes the guesswork out of greenside shots.", desc: "A 35° face with putter weighting lets you use your putting stroke from the fringe.",
    main: 34716676, tags: ["golf-clubs", "wedges", "beginner"], options: [{ name: "Hand", values: ["Right", "Left"] }], specs: [{ label: "Loft", value: "35°" }, { label: "Length", value: "35 in" }], clubType: "Wedge", weight: 320, sold: 29 },

  // ---------------- Golf Balls ----------------
  { slug: "sj-tour-u-balls", title: "SJ Tour U Golf Balls", brand: "SJ Golf", type: "Tour Balls", cat: "golf-balls", price: 4499, compare: 4999, cost: 1900, short: "Four-piece urethane tour ball with fast core and greenside bite.", desc: "A cast urethane cover over a four-piece build gives low driver spin and high wedge spin. The 318-dimple pattern holds its line in crosswind.",
    main: 6256756, tags: ["golf-balls", "tour", "sale", "featured"], options: PACK_OPTS, specs: [{ label: "Construction", value: "4-piece" }, { label: "Cover", value: "Cast urethane" }, { label: "Compression", value: "90" }, { label: "Dimples", value: "318" }], featured: true, sold: 412 },
  { slug: "sj-soft-response-balls", title: "SJ Soft Response Golf Balls", brand: "SJ Golf", type: "Distance Balls", cat: "golf-balls", price: 2499, cost: 980, short: "Two-piece ionomer ball with an ultra-soft feel off the putter.", desc: "Low compression for slower swing speeds with a durable cover that plays a full round without scuffing.",
    main: 6256758, tags: ["golf-balls", "distance", "value"], options: PACK_OPTS, specs: [{ label: "Construction", value: "2-piece" }, { label: "Compression", value: "60" }], sold: 508 },
  { slug: "sj-practice-bulk-balls", title: "SJ Range Practice Balls (48 Pack)", brand: "SJ Golf", type: "Practice Balls", cat: "golf-balls", price: 1999, cost: 760, short: "Durable range-grade balls for net and mat practice sessions.", desc: "Weighted to fly true at reduced distance so you can practice in tighter spaces.",
    main: 6256752, tags: ["golf-balls", "practice", "value"], options: [{ name: "Size", values: ["48 Pack", "96 Pack"] }], sold: 233 },
  { slug: "sj-colored-balls-matte", title: "SJ Matte Color Golf Balls", brand: "SJ Golf", type: "Distance Balls", cat: "golf-balls", price: 2999, cost: 1180, short: "High-visibility matte finish that is easy to track and find.", desc: "Same energy core as our Soft Response with a matte urethane-blend paint that cuts glare.",
    main: 3608294, tags: ["golf-balls", "distance", "colors"], options: [{ name: "Size", values: ["1 Dozen", "3 Dozen"] }, { name: "Color", values: ["Matte Green", "Matte White", "Matte Orange"] }], sold: 187 },
  { slug: "sj-lady-soft-balls", title: "SJ Lady Soft Golf Balls", brand: "SJ Golf", type: "Distance Balls", cat: "golf-balls", price: 2699, cost: 1040, short: "Low-compression core tuned for moderate swing speeds.", desc: "Maximizes carry at lower speeds while staying soft around the greens.",
    main: 6256753, tags: ["golf-balls", "womens", "distance"], options: PACK_OPTS, gender: "Women", sold: 141 },
  { slug: "sj-logo-balls-custom", title: "SJ Custom Logo Golf Balls", brand: "SJ Golf", type: "Custom", cat: "golf-balls", price: 3999, cost: 1650, short: "Your club, company or event logo on a tour-grade urethane ball.", desc: "Minimum order of three dozen. Upload artwork at checkout and we proof within one business day.",
    main: 11789585, tags: ["golf-balls", "custom", "gift"], options: [{ name: "Size", values: ["3 Dozen", "6 Dozen"] }], sold: 74 },

  // ---------------- Golf Gloves ----------------
  { slug: "sj-cabretta-leather-glove", title: "SJ Cabretta Leather Glove", brand: "SJ Golf", type: "Gloves", cat: "golf-gloves", price: 2900, cost: 1180, short: "Premium Cabretta leather with a Tour-style closure and breathable back.", desc: "Selected Cabretta leather softens to your hand over a round. Perforated palm panel moves heat and moisture out.",
    main: 9207644, tags: ["golf-gloves", "leather", "featured"], options: GLOVE_OPTS, specs: [{ label: "Material", value: "Cabretta leather" }, { label: "Closure", value: "Tour wrap" }, { label: "Fit", value: "Regular / Cadet" }], featured: true, sold: 396 },
  { slug: "sj-all-weather-glove", title: "SJ All-Weather Grip Glove", brand: "SJ Golf", type: "Gloves", cat: "golf-gloves", price: 2200, cost: 890, short: "Synthetic glove that keeps its grip in rain and humidity.", desc: "A knitted synthetic palm gets tackier when wet — the glove you want when the forecast turns.",
    main: 6542389, tags: ["golf-gloves", "all-weather"], options: GLOVE_OPTS, sold: 264 },
  { slug: "sj-3-pack-gloves", title: "SJ Glove 3-Pack Value Bundle", brand: "SJ Golf", type: "Gloves", cat: "golf-gloves", price: 6900, compare: 8700, cost: 2900, short: "Three Cabretta gloves — a season of grip for the price of two.", desc: "Stock your bag. Same fit and leather as our single glove at a bundled price.",
    main: 6542399, tags: ["golf-gloves", "bundle", "sale"], options: GLOVE_OPTS, sold: 158 },
  { slug: "sj-ladies-gloves-fit", title: "SJ Ladies Fit Golf Glove", brand: "SJ Golf", type: "Gloves", cat: "golf-gloves", price: 2400, cost: 990, short: "Slimmer palm and narrower fingers for a true women's fit.", desc: "Cut on a women's last with soft leather that needs almost no break-in.",
    main: 6542430, tags: ["golf-gloves", "womens"], options: [{ name: "Hand", values: ["Left", "Right"] }, { name: "Size", values: ["S", "M", "L"] }], gender: "Women", sold: 121 },
  { slug: "sj-junior-glove", title: "SJ Junior Golf Glove", brand: "SJ Golf", type: "Gloves", cat: "golf-gloves", price: 1600, cost: 640, short: "Soft synthetic glove sized for growing hands.", desc: "Easy to pull on, easy to clean, and sized for junior sets.",
    main: 1325750, tags: ["golf-gloves", "junior"], options: [{ name: "Size", values: ["YS", "YM", "YL"] }], gender: "Junior", sold: 88 },

  // ---------------- Golf Bags ----------------
  { slug: "sj-tour-cart-bag-14", title: "SJ Tour 14-Way Cart Bag", brand: "SJ Golf", type: "Cart Bags", cat: "golf-bags", price: 27900, compare: 31900, cost: 14200, short: "Full-length 14-way dividers with 9 pockets and cart-friendly base.", desc: "Every club gets its own full-length sleeve so grips never tangle. Insulated cooler pocket, velour valuables pocket and an integrated umbrella sleeve.",
    main: 12357837, tags: ["golf-bags", "cart-bags", "sale", "featured"], options: [{ name: "Color", values: ["Forest", "Black", "Stone"] }], specs: [{ label: "Dividers", value: "14 full-length" }, { label: "Pockets", value: "9" }, { label: "Weight", value: "3.1 kg" }], featured: true, weight: 3100, sold: 132 },
  { slug: "sj-lite-stand-bag", title: "SJ Lite Stand Bag", brand: "SJ Golf", type: "Stand Bags", cat: "golf-bags", price: 21900, cost: 10800, short: "2.1 kg stand bag with a comfortable dual strap and auto-deploy legs.", desc: "We shaved every gram that did not help you play. Four pockets, a 4-way top and legs that deploy on their own.",
    main: 6542477, tags: ["golf-bags", "stand-bags"], options: [{ name: "Color", values: ["Forest", "Black", "Sand"] }], specs: [{ label: "Weight", value: "2.1 kg" }, { label: "Dividers", value: "4-way" }], weight: 2100, sold: 176 },
  { slug: "sj-carry-hybrid-bag", title: "SJ Carry Hybrid Bag", brand: "SJ Golf", type: "Carry Bags", cat: "golf-bags", price: 15900, cost: 7400, short: "Pencil-bag simplicity with stand legs and real pocket space.", desc: "Ideal for walking rounds and quick evening nine-hole loops.",
    main: 6256053, tags: ["golf-bags", "carry-bags"], options: [{ name: "Color", values: ["Black", "Stone"] }], weight: 1600, sold: 94 },
  { slug: "sj-travel-cover-hard", title: "SJ Hard Shell Travel Cover", brand: "SJ Golf", type: "Travel Bags", cat: "golf-bags", price: 24900, cost: 12100, short: "ABS hard shell with inline wheels and internal strap system.", desc: "Airline-proof protection with a locking zipper, skid plate and room for shoes.",
    main: 6542481, tags: ["golf-bags", "travel"], options: [{ name: "Color", values: ["Black", "Forest"] }], weight: 4800, sold: 63 },
  { slug: "sj-sunday-bag-canvas", title: "SJ Waxed Canvas Sunday Bag", brand: "SJ Golf", type: "Carry Bags", cat: "golf-bags", price: 12900, cost: 5900, short: "Waxed canvas carry bag with leather trim — a classic that ages well.", desc: "Hand-finished waxed canvas with a reinforced base and single shoulder pad.",
    main: 15686443, tags: ["golf-bags", "carry-bags", "heritage"], weight: 1200, sold: 48 },
  { slug: "sj-cart-bag-ladies", title: "SJ Ladies Cart Bag", brand: "SJ Golf", type: "Cart Bags", cat: "golf-bags", price: 19900, compare: 23900, cost: 9800, short: "Lighter cart bag with a shortened profile for smaller frames.", desc: "Same 14-way organization in a lighter, shorter chassis that is easier to lift onto a cart.",
    main: 6256054, tags: ["golf-bags", "womens", "sale"], options: [{ name: "Color", values: ["Rose", "Stone", "Black"] }], gender: "Women", weight: 2600, sold: 71 },

  // ---------------- Golf Accessories ----------------
  { slug: "sj-leather-headcover-set", title: "SJ Leather Headcover Set (Driver, FW, Hybrid)", brand: "SJ Golf", type: "Headcovers", cat: "golf-accessories", price: 8900, compare: 10900, cost: 4100, short: "Full-grain leather headcovers with a magnetic closure.", desc: "Tour-style barrel covers in waxed leather that protect crowns and look sharp on any bag.",
    main: 9207649, tags: ["golf-accessories", "headcovers", "sale"], options: [{ name: "Color", values: ["White", "Black", "Forest"] }], featured: true, sold: 208 },
  { slug: "sj-caddy-towel", title: "SJ Caddy Towel with Carabiner", brand: "SJ Golf", type: "Towels", cat: "golf-accessories", price: 2400, cost: 900, short: "Waffle-weave microfiber towel that clips to the bag.", desc: "One side for water, one side for dirt. Machine washable and quick drying.",
    main: 6255015, tags: ["golf-accessories", "towels"], options: [{ name: "Color", values: ["White", "Forest", "Grey"] }], sold: 312 },
  { slug: "sj-pro-tees-100", title: "SJ Pro Bamboo Tees (100 Pack)", brand: "SJ Golf", type: "Tees", cat: "golf-accessories", price: 999, cost: 340, short: "Biodegradable bamboo tees in 2.75 in and 3.25 in.", desc: "Six-cavity reduced-friction tip for cleaner launch and less spin.",
    main: 6256839, tags: ["golf-accessories", "tees", "value"], options: [{ name: "Size", values: ["2.75 in", "3.25 in"] }], sold: 621 },
  { slug: "sj-ball-marker-pivot", title: "SJ Pivot Divot Tool & Ball Marker", brand: "SJ Golf", type: "Ball Markers", cat: "golf-accessories", price: 1800, cost: 690, short: "Machined aluminum switchblade divot tool with a magnetic marker.", desc: "Fits in a pocket, springs open, and repairs ball marks without tearing roots.",
    main: 15686442, tags: ["golf-accessories", "markers"], options: [{ name: "Color", values: ["Silver", "Black", "Copper"] }], sold: 284 },
  { slug: "sj-grip-kit-regrip", title: "SJ Regrip Kit (13 Grips + Tape + Solvent)", brand: "SJ Golf", type: "Grips", cat: "golf-accessories", price: 8900, cost: 4200, short: "Everything required to regrip a full set at home.", desc: "Includes 13 Tour Velvet grips, 15 grip tape strips, 4 oz solvent, vise clamp and rubber shaft holder.",
    main: 18251226, tags: ["golf-accessories", "grips", "workshop"], options: [{ name: "Size", values: ["Standard", "Midsize", "Jumbo"] }], sold: 77 },
  { slug: "sj-umbrella-68", title: "SJ 68 in Double Canopy Umbrella", brand: "SJ Golf", type: "Umbrellas", cat: "golf-accessories", price: 3900, cost: 1750, short: "Wind-rated double canopy that covers you and your bag.", desc: "Fiberglass ribs with a padded handle that doubles as a grip in the rain.",
    main: 6230435, tags: ["golf-accessories", "rain"], sold: 119 },
  { slug: "sj-shoe-bag-vent", title: "SJ Ventilated Shoe Bag", brand: "SJ Golf", type: "Bags", cat: "golf-accessories", price: 2900, cost: 1180, short: "Mesh shoe bag with a zip pocket for spikes and socks.", desc: "Keeps wet shoes out of your trunk and your travel cover.",
    main: 5044378, tags: ["golf-accessories", "bags"], sold: 96 },
  { slug: "sj-gift-card", title: "SJ Golf Digital Gift Card", brand: "SJ Golf", type: "Gift Cards", cat: "golf-accessories", price: 10000, cost: 0, short: "Delivered by email — the safe answer for the golfer who has everything.", desc: "Digital delivery, no expiration, redeemable across the entire store.",
    main: 6230533, tags: ["golf-accessories", "gift"], options: [{ name: "Size", values: ["$50", "$100", "$250"] }], sold: 264 },

  // ---------------- Golf Apparel ----------------
  { slug: "sj-performance-polo", title: "SJ Performance Polo", brand: "SJ Golf", type: "Polos", cat: "golf-apparel", price: 7900, compare: 8900, cost: 3400, short: "Four-way stretch polo with moisture wicking and UPF 30 protection.", desc: "A clean knit collar that will not curl, a longer tail that stays tucked, and a fabric that breathes on 95° afternoons.",
    main: 6256595, tags: ["golf-apparel", "polos", "sale", "featured"], options: SIZE_ONLY, specs: [{ label: "Fabric", value: "88% poly / 12% spandex" }, { label: "Protection", value: "UPF 30" }, { label: "Care", value: "Machine wash cold" }], featured: true, sold: 522 },
  { slug: "sj-tour-quarter-zip", title: "SJ Tour Quarter Zip", brand: "SJ Golf", type: "Outerwear", cat: "golf-apparel", price: 9900, cost: 4300, short: "Lightweight brushed-back layer for cool morning tee times.", desc: "Wears like a sweatshirt, swings like a polo. Raglan shoulders remove restriction at the top of the backswing.",
    main: 6256598, tags: ["golf-apparel", "outerwear"], options: SIZE_ONLY, sold: 246 },
  { slug: "sj-waterproof-jacket", title: "SJ Waterproof Rain Jacket", brand: "SJ Golf", type: "Outerwear", cat: "golf-apparel", price: 18900, compare: 21900, cost: 8900, short: "Fully seam-sealed 15k/15k shell with adjustable cuffs.", desc: "Packs into its own pocket. Waterproof, windproof and quiet enough to swing in.",
    main: 6256043, tags: ["golf-apparel", "rain", "sale"], options: SIZE_ONLY, sold: 134 },
  { slug: "sj-tour-trousers", title: "SJ Tour Trousers", brand: "SJ Golf", type: "Trousers", cat: "golf-apparel", price: 9900, cost: 4200, short: "Tailored straight-leg trouser with mechanical stretch.", desc: "Wrinkle resistant, quick drying and cut long enough to stay put through the swing.",
    main: 6256773, tags: ["golf-apparel", "trousers"], options: [{ name: "Size", values: ["30", "32", "34", "36", "38"] }], sold: 178 },
  { slug: "sj-flex-shorts", title: "SJ Flex Shorts (9 in)", brand: "SJ Golf", type: "Shorts", cat: "golf-apparel", price: 6900, cost: 2900, short: "Nine-inch inseam short with a stretch waistband and zip pocket.", desc: "Two front pockets, one deep ball pocket and a hidden tee pocket.",
    main: 38890585, tags: ["golf-apparel", "shorts"], options: [{ name: "Size", values: ["30", "32", "34", "36", "38"] }], sold: 209 },
  { slug: "sj-twill-cap", title: "SJ Twill Tour Cap", brand: "SJ Golf", type: "Caps", cat: "golf-apparel", price: 3200, cost: 1250, short: "Structured twill cap with an adjustable strap and moisture band.", desc: "Low-profile crown that holds its shape and a sweat-managing inner band.",
    main: 18242550, tags: ["golf-apparel", "caps"], options: [{ name: "Size", values: ["S/M", "L/XL"] }, { name: "Color", values: ["White", "Forest", "Black"] }], sold: 388 },
  { slug: "sj-ladies-skort", title: "SJ Ladies Performance Skort", brand: "SJ Golf", type: "Skorts", cat: "golf-apparel", price: 7400, cost: 3100, short: "Built-in short with ball pocket and a swing-free skirt.", desc: "Four-way stretch woven with a wide comfort waistband.",
    main: 9366473, tags: ["golf-apparel", "womens"], options: [{ name: "Size", values: ["XS", "S", "M", "L", "XL"] }], gender: "Women", sold: 164 },
  { slug: "sj-mid-layer-vest", title: "SJ Quilted Mid-Layer Vest", brand: "SJ Golf", type: "Outerwear", cat: "golf-apparel", price: 11900, cost: 5200, short: "Insulated vest that keeps your core warm and shoulders free.", desc: "Lightweight synthetic fill, wind-blocking front panel, water-repellent finish.",
    main: 6230150, tags: ["golf-apparel", "outerwear", "winter"], options: SIZE_ONLY, sold: 91 },

  // ---------------- Training Equipment ----------------
  { slug: "sj-practice-net-pro", title: "SJ Pro Practice Net 10x7", brand: "SJ Golf", type: "Nets", cat: "training-equipment", price: 21900, compare: 25900, cost: 10400, short: "Freestanding hitting net that takes full-driver speed.", desc: "A steel-frame, knotless-net build rated for real ball speeds. Sets up in under two minutes and folds flat.",
    main: 34710298, tags: ["training", "nets", "sale", "featured"], options: [{ name: "Size", values: ["10x7 ft", "8x6 ft"] }], featured: true, weight: 12000, sold: 143 },
  { slug: "sj-hitting-mat-premier", title: "SJ Premier Hitting Mat 5x5", brand: "SJ Golf", type: "Mats", cat: "training-equipment", price: 27900, cost: 13600, short: "Turf-top mat with a real-feel fairway insert that forgives fat shots.", desc: "5 mm foam base absorbs shock while the nylon face accepts tees at any height.",
    main: 34715854, tags: ["training", "mats"], options: [{ name: "Size", values: ["5x5 ft", "4x4 ft"] }], weight: 18000, sold: 87 },
  { slug: "sj-putting-mirror", title: "SJ Putting Alignment Mirror", brand: "SJ Golf", type: "Putting Aids", cat: "training-equipment", price: 3900, cost: 1450, short: "See your eye line, putter face and gate in one look.", desc: "Fits in a pants pocket, works on any green, and includes two gate pegs.",
    main: 34716752, tags: ["training", "putting"], sold: 298 },
  { slug: "sj-swing-trainer-weighted", title: "SJ Weighted Swing Trainer 48 in", brand: "SJ Golf", type: "Swing Trainers", cat: "training-equipment", price: 5900, cost: 2400, short: "Weighted trainer that grooves tempo and strengthens golf muscles.", desc: "Six weight positions let you warm up or build lag with the same tool.",
    main: 34674923, tags: ["training", "swing"], options: [{ name: "Flex", values: ["Regular", "Stiff"] }], sold: 176 },
  { slug: "sj-alignment-sticks", title: "SJ Alignment Stick Set (2 Pack)", brand: "SJ Golf", type: "Alignment Aids", cat: "training-equipment", price: 1900, cost: 620, short: "Fiberglass sticks for aim, ball position and swing plane drills.", desc: "The cheapest, most effective training aid in golf. Includes drill card.",
    main: 34672420, tags: ["training", "alignment", "value"], options: [{ name: "Color", values: ["Green", "Orange", "White"] }], sold: 441 },

  // ---------------- Golf Technology ----------------
  { slug: "sj-launch-monitor-personal", title: "SJ Personal Launch Monitor", brand: "SJ Golf", type: "Launch Monitors", cat: "golf-technology", price: 59900, compare: 69900, cost: 32400, short: "Radar-based launch monitor with club and ball data on your phone.", desc: "Sixteen data points including ball speed, launch, spin, apex and carry. Works indoors and outdoors with no calibrated space required.",
    main: 34727086, tags: ["technology", "launch-monitors", "sale", "featured"], options: [{ name: "Size", values: ["Standard"] }], specs: [{ label: "Data Points", value: "16" }, { label: "Battery", value: "6 hours" }, { label: "Connectivity", value: "Bluetooth / USB-C" }], featured: true, weight: 900, sold: 118 },
  { slug: "sj-rangefinder-slope", title: "SJ Slope Rangefinder 1200", brand: "SJ Golf", type: "Rangefinders", cat: "golf-technology", price: 19900, cost: 8900, short: "Slope-adjusted distance with magnetic mount and vibration lock.", desc: "6x magnification, 1,200-yard range, fast focus and legal-for-tournament slope switch.",
    main: 32031155, tags: ["technology", "rangefinders"], options: [{ name: "Color", values: ["Black", "White"] }], weight: 320, sold: 342 },
  { slug: "sj-gps-watch", title: "SJ GPS Golf Watch", brand: "SJ Golf", type: "GPS Devices", cat: "golf-technology", price: 24900, compare: 27900, cost: 11800, short: "Preloaded 42,000 courses with green view and shot tracking.", desc: "Fourteen-day battery in watch mode, hazards laid out hole by hole and auto shot detection.",
    main: 6230144, tags: ["technology", "gps", "sale"], sold: 227 },
  { slug: "sj-swing-analyzer", title: "SJ Swing Analyzer Sensor", brand: "SJ Golf", type: "Swing Analyzers", cat: "golf-technology", price: 14900, cost: 6400, short: "Grip-mounted sensor that measures tempo, plane and speed.", desc: "Clips to any club and streams 3D swing data to the SJ app with drill recommendations.",
    main: 34713538, tags: ["technology", "swing"], weight: 60, sold: 158 },
  { slug: "sj-cart-gps-mount", title: "SJ Magnetic Cart GPS Mount", brand: "SJ Golf", type: "Accessories", cat: "golf-technology", price: 3900, cost: 1480, short: "Neodymium magnet mount that holds any rangefinder on any cart.", desc: "Rubber-coated base protects the frame; ball joint lets you dial the angle.",
    main: 1325709, tags: ["technology", "accessories"], sold: 203 },
];

const OPTION_DEFAULTS: Record<string, { name: string; values: string[] }[]> = {
  "golf-clubs": HAND_FLEX,
  "golf-balls": PACK_OPTS,
  "golf-gloves": GLOVE_OPTS,
  "golf-bags": [{ name: "Color", values: ["Standard"] }],
  "golf-accessories": [{ name: "Size", values: ["Standard"] }],
  "golf-apparel": SIZE_ONLY,
  "training-equipment": [{ name: "Size", values: ["Standard"] }],
  "golf-technology": [{ name: "Size", values: ["Standard"] }],
};

// deterministic stock pattern: index 7 and 19 are intentionally out of stock
function stockFor(index: number, variantIndex: number): number {
  if (index % 9 === 2) return 0;
  if (index % 11 === 5 && variantIndex % 3 === 0) return 0;
  return ((index * 7 + variantIndex * 13) % 22) + 3;
}

export async function seedDatabase() {
  await db.execute(sql`
    TRUNCATE TABLE cart_items, carts, order_items, order_events, orders, transactions, variants,
    product_options, products, categories, users, addresses, discounts, shipping_rates, shipping_zones,
    tax_regions, newsletter_subscribers, contact_enquiries, content_blocks, pages, reviews,
    inventory_history, staff_users, audit_logs, notifications, settings, search_synonyms, webhooks, jobs
    RESTART IDENTITY CASCADE
  `);

  const catRows = await db
    .insert(categories)
    .values(
      CATS.map((c, i) => ({
        slug: c.slug,
        name: c.name,
        tagline: c.tagline,
        description: c.description,
        imageUrl: c.image,
        sortOrder: i,
        seoTitle: `${c.name} | SJ Golf Store`,
        seoDescription: c.description.slice(0, 155),
      })),
    )
    .returning();
  const catBySlug = new Map(catRows.map((c) => [c.slug, c]));

  let index = 0;
  for (const p of PRODUCTS) {
    const catId = catBySlug.get(p.cat)?.id ?? catRows[0].id;
    const ctxPool = [10028414, 5644639, 5151973, 6256594, 37825475, 10579231, 1325733, 1325681, 6256342, 6230538];
    const contextIds = [ctxPool[index % ctxPool.length], ctxPool[(index * 3 + 4) % ctxPool.length]].filter(
      (id, i, arr) => id !== p.main && arr.indexOf(id) === i,
    );
    const imgs: ProductImage[] = [
      { url: P(p.main, 900, 1100), alt: p.title },
      ...contextIds.map((id, i) => ({ url: P(id, 1200, 800), alt: `${p.title} — on the course (${i + 2})` })),
    ];
    const inserted = await db
      .insert(products)
      .values({
        slug: p.slug.replace(/\s+/g, "-"),
        title: p.title,
        brand: p.brand,
        shortDescription: p.short,
        description: p.desc,
        categoryId: catId,
        productType: p.type,
        priceCents: p.price,
        compareAtCents: p.compare ?? null,
        costCents: p.cost,
        sku: `SJ-${String(index + 1000).padStart(4, "0")}`,
        barcode: `88${String(100000 + index * 37).slice(0, 8)}`,
        tags: p.tags,
        images: imgs,
        specs: p.specs ?? [],
        gender: p.gender ?? "Unisex",
        clubType: p.clubType ?? "",
        shaft: p.shaft ?? "",
        loft: p.loft ?? "",
        weightGrams: p.weight ?? 500,
        ratingSum: 0,
        reviewCount: 0,
        unitsSold: p.sold ?? 10,
        views: (p.sold ?? 10) * 11,
        isFeatured: Boolean(p.featured),
        seoTitle: `${p.title} | SJ Golf Store`,
        seoDescription: p.short.slice(0, 155),
      })
      .returning();
    const product = inserted[0];

    const options = p.options ?? OPTION_DEFAULTS[p.cat] ?? [{ name: "Size", values: ["Standard"] }];
    await db.insert(productOptions).values(
      options.map((o, i) => ({ productId: product.id, name: o.name, values: o.values, position: i })),
    );

    const combos = options.reduce<Record<string, string>[]>(
      (acc, o) => acc.flatMap((prev) => o.values.map((v) => ({ ...prev, [o.name]: v }))),
      [{}],
    );
    await db.insert(variants).values(
      combos.map((combo, vi) => {
        const suffix = Object.values(combo).map((v) => v.slice(0, 2).toUpperCase()).join("-") || "STD";
        return {
          productId: product.id,
          title: Object.values(combo).join(" / ") || "Standard",
          sku: `${product.sku}-${suffix}-${vi + 1}`,
          barcode: `88${String(200000 + index * 41 + vi).slice(0, 8)}`,
          priceCents: p.price,
          compareAtCents: p.compare ?? null,
          costCents: p.cost,
          options: combo,
          inventoryQty: stockFor(index, vi),
          weightGrams: p.weight ?? 500,
          imageUrl: imgs[vi % imgs.length]?.url ?? "",
          position: vi,
        };
      }),
    );

    const reviewCount = ((index * 5) % 9) + 1;
    const avg = [4.5, 4.7, 4.8, 4.3, 5, 4.6][index % 6];
    await db
      .update(products)
      .set({ ratingSum: Math.round(avg * reviewCount), reviewCount })
      .where(sql`${products.id} = ${product.id}`);

    await db.insert(reviews).values([
      {
        productId: product.id,
        customerName: ["Marcus T.", "Dan R.", "Priya S.", "Alex H.", "Jordan B."][index % 5],
        rating: 5,
        title: "Exactly as described",
        body: "Shipped fast, packaging was clean, and the quality is a step above what I expected at this price.",
        status: "approved",
      },
      {
        productId: product.id,
        customerName: ["Chris L.", "Sam W.", "Nate P."][index % 3],
        rating: 4,
        title: "Great value",
        body: "Took a round to dial in, but the performance is solid. Customer service answered my fit question same day.",
        status: index % 4 === 0 ? "pending" : "approved",
      },
    ]);

    index += 1;
  }

  // ---------- Customers ----------
  const customerSeed = [
    ["john.smith@example.com", "John", "Smith"],
    ["mike.brown@example.com", "Mike", "Brown"],
    ["sarah.davis@example.com", "Sarah", "Davis"],
    ["daniel.wilson@example.com", "Daniel", "Wilson"],
    ["emily.moore@example.com", "Emily", "Moore"],
    ["robert.taylor@example.com", "Robert", "Taylor"],
  ] as const;
  const userRows = await db
    .insert(users)
    .values([
      ...customerSeed.map(([email, first, last], i) => ({
        email,
        passwordHash: hashPassword("password123"),
        firstName: first,
        lastName: last,
        phone: `(407) 555-01${10 + i}`,
        role: "customer",
        acceptsMarketing: i % 2 === 0,
        createdAt: new Date(Date.now() - (i + 2) * 86400000 * 21),
      })),
      {
        email: "admin@sjgolfstore.com",
        passwordHash: hashPassword("admin123"),
        firstName: "Avery",
        lastName: "Cole",
        phone: "(407) 555-0100",
        role: "admin",
      },
    ])
    .returning();

  await db.insert(addresses).values([
    { userId: userRows[0].id, label: "Home", firstName: "John", lastName: "Smith", address1: "1428 Lake View Dr", city: "Orlando", state: "FL", postalCode: "32801", phone: "(407) 555-0110", isDefault: true },
    { userId: userRows[0].id, label: "Office", firstName: "John", lastName: "Smith", company: "Smith & Co", address1: "90 Park Ave", city: "New York", state: "NY", postalCode: "10016", isDefault: false },
    { userId: userRows[1].id, label: "Home", firstName: "Mike", lastName: "Brown", address1: "77 Pebble Beach Way", city: "Austin", state: "TX", postalCode: "78701", isDefault: true },
    { userId: userRows[2].id, label: "Home", firstName: "Sarah", lastName: "Davis", address1: "520 Cypress Ln", city: "Scottsdale", state: "AZ", postalCode: "85251", isDefault: true },
  ]);

  // ---------- Discounts ----------
  await db.insert(discounts).values([
    { code: "WELCOME20", description: "20% off your first order", type: "percentage", value: 20, status: "active", usageLimit: 0 },
    { code: "GOLF50", description: "$50 off orders over $400", type: "fixed", value: 5000, minSubtotalCents: 40000, status: "active" },
    { code: "FREESHIP", description: "Free standard shipping", type: "free_shipping", value: 0, status: "active" },
    { code: "BUY2GET1", description: "Buy 2 dozen, get 1 free", type: "bxgy", value: 0, buyQuantity: 2, getQuantity: 1, status: "active" },
    { code: "SPRING25", description: "25% off — spring campaign", type: "percentage", value: 25, status: "scheduled", startsAt: new Date(Date.now() + 86400000 * 10) },
    { code: "HOLIDAY10", description: "10% off holiday", type: "percentage", value: 10, status: "expired", endsAt: new Date(Date.now() - 86400000 * 5) },
  ]);

  // ---------- Shipping ----------
  const zoneRows = await db
    .insert(shippingZones)
    .values([
      { name: "United States", countries: ["United States"] },
      { name: "Canada", countries: ["Canada"] },
      { name: "International", countries: ["United Kingdom", "Australia", "Germany", "Japan"] },
    ])
    .returning();
  await db.insert(shippingRates).values([
    { zoneId: zoneRows[0].id, name: "Standard Shipping", description: "Ground, 3-7 business days", type: "flat", priceCents: 999, freeOverCents: 10000, transitDays: "3-7 business days" },
    { zoneId: zoneRows[0].id, name: "Free Shipping", description: "Free on orders over $100", type: "price", priceCents: 0, freeOverCents: 10000, transitDays: "5-9 business days" },
    { zoneId: zoneRows[0].id, name: "Express Shipping", description: "2 business days", type: "flat", priceCents: 2499, transitDays: "2 business days" },
    { zoneId: zoneRows[0].id, name: "Overnight Shipping", description: "Next business day", type: "flat", priceCents: 4499, transitDays: "Next business day" },
    { zoneId: zoneRows[1].id, name: "Canada Standard", description: "6-10 business days", type: "flat", priceCents: 1999, transitDays: "6-10 business days" },
    { zoneId: zoneRows[1].id, name: "Canada Express", description: "3-4 business days", type: "flat", priceCents: 3999, transitDays: "3-4 business days" },
    { zoneId: zoneRows[2].id, name: "International Standard", description: "8-16 business days, duties billed to recipient", type: "flat", priceCents: 3999, transitDays: "8-16 business days" },
  ]);

  await db.insert(taxRegions).values([
    { region: "FL", label: "Florida", rateBps: 700 },
    { region: "NY", label: "New York", rateBps: 875 },
    { region: "TX", label: "Texas", rateBps: 825 },
    { region: "CA", label: "California", rateBps: 785 },
    { region: "AZ", label: "Arizona", rateBps: 560 },
    { region: "WA", label: "Washington", rateBps: 1025 },
    { region: "IL", label: "Illinois", rateBps: 625 },
    { region: "PA", label: "Pennsylvania", rateBps: 600 },
  ]);

  // ---------- Orders ----------
  const statuses = [
    ["paid", "shipped", "complete"],
    ["paid", "processing", "processing"],
    ["paid", "unfulfilled", "open"],
    ["pending", "unfulfilled", "open"],
    ["paid", "delivered", "complete"],
    ["refunded", "cancelled", "cancelled"],
  ] as const;
  const carriers = ["UPS", "FedEx", "USPS"];
  const productRows = await db.select().from(products);
  const variantRows = await db.select().from(variants);

  for (let i = 0; i < 26; i += 1) {
    const user = userRows[i % 6];
    const [payment, fulfillment, status] = statuses[i % statuses.length];
    const lineCount = (i % 3) + 1;
    const items: {
      productId: number;
      variantId: number;
      title: string;
      variantTitle: string;
      sku: string;
      imageUrl: string;
      quantity: number;
      unitPriceCents: number;
      totalCents: number;
    }[] = [];
    for (let li = 0; li < lineCount; li += 1) {
      const prod = productRows[(i * 3 + li * 7) % productRows.length];
      const variant = variantRows.find((v) => v.productId === prod.id) ?? variantRows[0];
      const qty = ((i + li) % 2) + 1;
      items.push({
        productId: prod.id,
        variantId: variant.id,
        title: prod.title,
        variantTitle: variant.title,
        sku: variant.sku,
        imageUrl: prod.images[0]?.url ?? "",
        quantity: qty,
        unitPriceCents: variant.priceCents,
        totalCents: variant.priceCents * qty,
      });
    }
    const subtotal = items.reduce((s, it) => s + it.totalCents, 0);
    const discountCents = i % 4 === 0 ? Math.round(subtotal * 0.1) : 0;
    const shippingCents = subtotal >= 10000 ? 0 : 999;
    const taxCents = Math.round((subtotal - discountCents) * 0.07);
    const total = subtotal - discountCents + shippingCents + taxCents;
    const placedAt = new Date(Date.now() - i * 86400000 * 3 - i * 3600000);

    const orderRow = await db
      .insert(orders)
      .values({
        orderNumber: `SJ${10240 + i}`,
        userId: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        address1: `${100 + i} Fairway ${["Dr", "Ave", "Blvd", "Ln"][i % 4]}`,
        city: ["Orlando", "Austin", "Scottsdale", "San Diego", "Chicago", "Atlanta"][i % 6],
        state: ["FL", "TX", "AZ", "CA", "IL", "GA"][i % 6],
        postalCode: `328${String(10 + i).padStart(2, "0")}`,
        country: "United States",
        shippingMethod: i % 5 === 0 ? "Express Shipping" : "Standard Shipping",
        shippingCents,
        subtotalCents: subtotal,
        discountCents,
        taxCents,
        totalCents: total,
        discountCode: discountCents ? "WELCOME20" : "",
        taxRate: 700,
        paymentStatus: payment,
        fulfillmentStatus: fulfillment,
        status,
        carrier: fulfillment === "shipped" || fulfillment === "delivered" ? carriers[i % 3] : "",
        trackingNumber: fulfillment === "shipped" || fulfillment === "delivered" ? `1Z${String(100000 + i * 7)}US` : "",
        notes: i % 6 === 0 ? "Customer asked for delivery after 5 PM." : "",
        isGuest: false,
        createdAt: placedAt,
      })
      .returning();

    await db.insert(orderItems).values(items.map((it) => ({ ...it, orderId: orderRow[0].id })));
    await db.insert(orderEvents).values([
      { orderId: orderRow[0].id, type: "placed", message: "Order placed", actor: user.email, createdAt: placedAt },
      { orderId: orderRow[0].id, type: "payment", message: `Payment ${payment}`, actor: "SJ Pay", createdAt: new Date(placedAt.getTime() + 60000) },
      ...(fulfillment !== "unfulfilled"
        ? [{ orderId: orderRow[0].id, type: "fulfillment", message: `Fulfillment ${fulfillment}`, actor: "admin", createdAt: new Date(placedAt.getTime() + 86400000) }]
        : []),
    ]);
    await db.insert(transactions).values({
      orderId: orderRow[0].id,
      provider: "SJ Pay",
      providerTxId: `txn_${String(900000 + i * 13)}`,
      type: payment === "refunded" ? "refund" : "sale",
      amountCents: total,
      status: payment === "pending" ? "pending" : payment === "refunded" ? "refunded" : "success",
      createdAt: placedAt,
    });
  }

  // ---------- Guests / abandoned ----------
  await db.insert(notifications).values([
    { type: "order", title: "3 new orders", body: "Orders SJ10264, SJ10263 and SJ10262 need review.", href: "/admin/orders" },
    { type: "inventory", title: "2 low stock products", body: "SJ Tour U Golf Balls and SJ Pro Tees are below threshold.", href: "/admin/inventory" },
    { type: "payment", title: "1 failed payment", body: "Order SJ10251 payment was declined.", href: "/admin/payments" },
    { type: "refund", title: "1 refund request", body: "Order SJ10245 refund is awaiting approval.", href: "/admin/orders" },
    { type: "customer", title: "1 new customer", body: "robert.taylor@example.com created an account.", href: "/admin/customers" },
  ]);

  // ---------- Content ----------
  await db.insert(contentBlocks).values([
    { key: "hero", section: "home", eyebrow: "New Season · 2026 Line", title: "ELEVATE YOUR GAME", subtitle: "Premium golf equipment built for your next round.", body: "Clubs, balls, bags and gear from brands tour players trust — shipped fast from our U.S. warehouse.", imageUrl: IMG.hero, ctaLabel: "Shop Golf Clubs", ctaHref: "/golf-clubs", data: { secondaryLabel: "Shop All Equipment", secondaryHref: "/shop" }, sortOrder: 0 },
    { key: "value_prop", section: "home", title: "Why shop SJ Golf?", subtitle: "", body: "", data: { item1Title: "Premium Gear", item1Body: "Tour-level equipment, vetted by our fitting team.", item2Title: "Fast U.S. Shipping", item2Body: "Orders over $100 ship free, most leave same day.", item3Title: "Trusted Service", item3Body: "Real golfers answer the phone. 30-day returns." }, sortOrder: 1 },
    { key: "story", section: "home", eyebrow: "Our Story", title: "Built by golfers, for golfers", body: "SJ Golf Store started in a 400 square foot shop in Orlando with one fitting bay and a simple idea: sell the gear we actually play. Today we stock the full line of clubs, balls, bags and apparel — and we still fit every order like it is going in our own bag.", imageUrl: IMG.story, ctaLabel: "Shop All Equipment", ctaHref: "/shop", sortOrder: 2 },
    { key: "newsletter", section: "home", eyebrow: "Newsletter", title: "STAY IN THE GAME", subtitle: "Get updates on new golf gear, offers and store news.", body: "We send one email a week. No spam, unsubscribe any time.", sortOrder: 3 },
  ]);

  await db.insert(pages).values([
    { slug: "refund-policy", title: "Refund Policy", body: "We accept returns on unused equipment within 30 days of delivery.\n\nClubs that have been custom built or fitted to specification are not returnable unless there is a manufacturing defect. Golf balls must be unopened in original packaging. Apparel may be returned unworn with tags attached.\n\nRefunds are issued to the original payment method within 5-10 business days of the returned item arriving at our warehouse. Original shipping charges are non-refundable unless the return is a result of our error.\n\nTo start a return, contact support@sjgolfstore.com with your order number.", seoDescription: "SJ Golf Store refund and return policy for golf equipment and apparel." },
    { slug: "privacy-policy", title: "Privacy Policy", body: "SJ Golf Store respects your privacy. This policy explains what we collect and how we use it.\n\nWe collect the information required to fulfil your order: name, email, shipping address, phone number and payment details. Payment card data is processed by our payment provider and is never stored on our servers.\n\nWe use order information to ship products, provide support and — if you opt in — send marketing email. We do not sell personal information to third parties.\n\nYou may request access to, correction of, or deletion of your personal data at any time by emailing privacy@sjgolfstore.com.", seoDescription: "How SJ Golf Store collects, uses and protects your personal information." },
    { slug: "terms-of-service", title: "Terms of Service", body: "By using sjgolfstore.com you agree to these terms.\n\nAll prices are listed in U.S. dollars and are subject to change without notice. We reserve the right to cancel any order caused by pricing or inventory errors.\n\nProduct images are representative. Custom-built clubs, clearance items and digital gift cards are final sale where stated.\n\nThis site and all content are the property of SJ Golf Store. Nothing may be reproduced without written permission.\n\nThese terms are governed by the laws of the State of Florida.", seoDescription: "Terms of service for shopping with SJ Golf Store." },
    { slug: "shipping-policy", title: "Shipping Policy", body: "Orders placed before 2 PM ET on a business day are processed the same day.\n\nStandard shipping is $9.99 and free on orders over $100. Express shipping arrives in 2 business days for $24.99. Overnight shipping is available for $44.99.\n\nWe ship to all 50 states. Alaska and Hawaii may require an additional 2-3 business days. International shipping to Canada, the U.K., Australia, Germany and Japan is available at checkout; duties and import taxes are the responsibility of the recipient.\n\nOversized items such as bags, nets and travel covers may ship separately.", seoDescription: "Shipping rates, delivery times and international shipping for SJ Golf Store." },
    { slug: "faq", title: "Frequently Asked Questions", body: "How do I choose the right flex?\nFlex should match your swing speed. Under 75 mph choose Regular, 75-95 mph choose Stiff, above 95 mph choose X-Stiff.\n\nDo you offer club fitting?\nYes. Add a note at checkout or email fitting@sjgolfstore.com and our team will confirm specifications before building.\n\nWhen will my order ship?\nIn-stock items leave our warehouse within one business day. You will receive tracking by email.\n\nCan I change my order?\nContact us within one hour of ordering and we will do our best to update it before it ships.", seoDescription: "Answers about fitting, flex, shipping and returns at SJ Golf Store." },
    { slug: "contact", title: "Contact Us", body: "Our Orlando team answers every message within one business day.\n\nEmail: support@sjgolfstore.com\nPhone: (407) 555-0100\nFitting questions: fitting@sjgolfstore.com\nWholesale: wholesale@sjgolfstore.com\n\nWarehouse (not open to the public)\n2100 Magnum Ave, Suite 120\nOrlando, FL 32809", seoDescription: "Contact SJ Golf Store customer service by email or phone." },
  ]);

  await db.insert(settings).values([
    { key: "store_name", value: "SJ Golf Store", group: "store", label: "Store name" },
    { key: "store_email", value: "support@sjgolfstore.com", group: "store", label: "Contact email" },
    { key: "store_phone", value: "(407) 555-0100", group: "store", label: "Phone" },
    { key: "store_address", value: "2100 Magnum Ave, Suite 120, Orlando, FL 32809", group: "store", label: "Business address" },
    { key: "currency", value: "USD", group: "store", label: "Currency" },
    { key: "timezone", value: "America/New_York", group: "store", label: "Timezone" },
    { key: "guest_checkout", value: "true", group: "checkout", label: "Allow guest checkout" },
    { key: "free_shipping_threshold", value: "10000", group: "shipping", label: "Free shipping over (cents)" },
    { key: "tax_provider", value: "SJ Tax Service", group: "tax", label: "Tax provider" },
    { key: "tax_nexus_states", value: "FL,TX,CA,NY,AZ", group: "tax", label: "Nexus states" },
    { key: "payment_provider", value: "SJ Pay", group: "payments", label: "Payment gateway" },
    { key: "payment_mode", value: "test", group: "payments", label: "Mode" },
    { key: "email_sender_name", value: "SJ Golf Store", group: "email", label: "Sender name" },
    { key: "email_sender_address", value: "no-reply@sjgolfstore.com", group: "email", label: "Sender email" },
    { key: "ga4_id", value: "G-SJGOLF0001", group: "analytics", label: "GA4 measurement ID" },
    { key: "meta_pixel_id", value: "", group: "analytics", label: "Meta Pixel ID" },
    { key: "seo_default_title", value: "SJ Golf Store | Premium Golf Equipment", group: "seo", label: "Default title" },
    { key: "seo_default_description", value: "Premium golf clubs, balls, bags, gloves, apparel, training aids and technology. Free U.S. shipping over $100.", group: "seo", label: "Default description" },
    { key: "seo_robots", value: "index, follow", group: "seo", label: "Robots" },
    { key: "password_policy", value: "Minimum 8 characters", group: "security", label: "Password policy" },
    { key: "two_factor_required", value: "true", group: "security", label: "Require 2FA for admin" },
  ]);

  await db.insert(searchSynonyms).values([
    { term: "driver", synonyms: ["big dog", "1 wood", "tee shot"] },
    { term: "putter", synonyms: ["flat stick", "blade", "mallet"] },
    { term: "gloves", synonyms: ["glove", "cabretta", "grip"] },
    { term: "balls", synonyms: ["ball", "dozen", "sleeve"] },
    { term: "irons", synonyms: ["iron set", "blades", "cavity back"] },
    { term: "rangefinder", synonyms: ["range finder", "laser", "distance"] },
  ]);

  await db.insert(staffUsers).values([
    { name: "Avery Cole", email: "admin@sjgolfstore.com", role: "Super Admin", permissions: ["*"], twoFactorEnabled: true, lastLoginAt: new Date() },
    { name: "Sarah Nguyen", email: "sarah@sjgolfstore.com", role: "Order Manager", permissions: ["orders.view", "orders.edit", "orders.refund", "customers.view"], twoFactorEnabled: true, lastLoginAt: new Date(Date.now() - 3600000) },
    { name: "Mike Ortiz", email: "mike@sjgolfstore.com", role: "Product Manager", permissions: ["products.view", "products.create", "products.edit", "inventory.edit"], twoFactorEnabled: false, lastLoginAt: new Date(Date.now() - 86400000) },
    { name: "Dana Patel", email: "dana@sjgolfstore.com", role: "Content Manager", permissions: ["content.edit", "seo.edit", "media.view"], twoFactorEnabled: false, lastLoginAt: new Date(Date.now() - 86400000 * 4) },
    { name: "Lee Fontaine", email: "lee@sjgolfstore.com", role: "Finance Manager", permissions: ["payments.view", "refunds.process", "tax.view", "reports.view"], twoFactorEnabled: true, lastLoginAt: new Date(Date.now() - 86400000 * 2) },
  ]);

  await db.insert(newsletterSubscribers).values(
    ["golfer@example.com", "clubchamp@example.com", "scratchgolfer@example.com", "weekendplayer@example.com", "fairwayfan@example.com"].map((email, i) => ({
      email,
      source: i % 2 === 0 ? "footer" : "homepage",
      createdAt: new Date(Date.now() - i * 86400000 * 3),
    })),
  );

  await db.insert(contactEnquiries).values([
    { name: "Tom Becker", email: "tom@example.com", subject: "Driver fitting", message: "I swing around 95 mph. Should I go Stiff or X-Stiff in the Tour Apex?", status: "new" },
    { name: "Karen Mills", email: "karen@example.com", subject: "Order change", message: "Can I swap the size on order SJ10252 before it ships?", status: "open" },
    { name: "Owen Reid", email: "owen@example.com", subject: "Wholesale", message: "We run a driving range in Georgia and would like pricing on bulk balls.", status: "replied" },
  ]);

  const variantSample = variantRows.slice(0, 8);
  await db.insert(inventoryHistory).values(
    variantSample.map((v, i) => ({
      variantId: v.id,
      productName: productRows.find((p) => p.id === v.productId)?.title ?? "",
      variantTitle: v.title,
      sku: v.sku,
      previousQty: v.inventoryQty,
      newQty: v.inventoryQty + 10,
      adjustment: 10,
      reason: ["Stock received", "Manual count", "Return to stock", "Cycle count"][i % 4],
      actor: "Mike Ortiz",
      notes: "Weekly restock from warehouse",
    })),
  );

  await db.insert(auditLogs).values([
    { actor: "Mike Ortiz", action: "Updated Product", resource: "SJ Tour Apex Driver", detail: "Price: $599.00 → $499.00" },
    { actor: "Sarah Nguyen", action: "Fulfilled Order", resource: "#SJ10255", detail: "Created UPS shipment 1Z1000US" },
    { actor: "Lee Fontaine", action: "Processed Refund", resource: "#SJ10245", detail: "Refunded $589.00 — customer return" },
    { actor: "Avery Cole", action: "Updated Settings", resource: "Tax", detail: "Added nexus state AZ at 5.6%" },
    { actor: "Dana Patel", action: "Published Content", resource: "Homepage Hero", detail: "Headline changed to ELEVATE YOUR GAME" },
  ]);

  await db.insert(webhooks).values([
    { name: "Payment Webhook", endpoint: "/api/webhooks/payments", status: "healthy", lastReceivedAt: new Date(Date.now() - 120000) },
    { name: "Shipping Webhook", endpoint: "/api/webhooks/shipping", status: "healthy", lastReceivedAt: new Date(Date.now() - 600000) },
    { name: "Tax Sync Webhook", endpoint: "/api/webhooks/tax", status: "failing", lastReceivedAt: new Date(Date.now() - 86400000), failureCount: 2 },
  ]);

  await db.insert(jobs).values([
    { name: "Email: order confirmation", status: "completed", durationMs: 240 },
    { name: "Inventory sync", status: "completed", durationMs: 1840 },
    { name: "Payment capture", status: "completed", durationMs: 610 },
    { name: "Tax rate refresh", status: "failed", durationMs: 4200, message: "Upstream timeout after 4s" },
    { name: "Report: monthly sales", status: "pending", durationMs: 0 },
  ]);

  void IMG.course;
}

/** Creates every table if missing (idempotent DDL from @/db/tables). */
async function ensureSchema(): Promise<void> {
  for (const statement of TABLE_DDL) {
    await pool.query(statement);
  }
}

let bootstrapPromise: Promise<void> | null = null;

/**
 * Zero-config bootstrap: creates the full schema when missing, then seeds the
 * complete demo catalogue (products, variants, orders, customers, settings…)
 * when the database is empty. Safe to call on every request — it is a
 * singleton and every statement is idempotent.
 */
export async function ensureSeeded() {
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = (async () => {
    try {
      await ensureSchema();
      const rows = await db.select({ count: sql<number>`count(*)::int` }).from(categories);
      if (Number(rows[0]?.count ?? 0) === 0) await seedDatabase();
    } catch (error) {
      // If the database is unreachable, retry on the next request.
      bootstrapPromise = null;
      throw error;
    }
  })();
  return bootstrapPromise;
}
