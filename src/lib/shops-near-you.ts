export type NearbyShopSourceType =
  | "public_map_seed"
  | "curated_demo"
  | "sample_partner"
  | "google_maps_search";

export type NearbyShop = {
  id: string;
  name: string;
  area: string;
  city: string;
  country: "Bangladesh";
  lat?: number;
  lng?: number;
  distanceKm?: number;
  imageKind:
    | "home-kitchen"
    | "cafe"
    | "tiffin"
    | "vegetables"
    | "fruit"
    | "fish"
    | "grocery"
    | "farmer"
    | "market"
    | "arot"
    | "generic";
  popularItems: string[];
  type:
    | "home_made"
    | "restaurant"
    | "farmer_sourced"
    | "grocery"
    | "fruit_shop"
    | "fish_market"
    | "vegetable_market"
    | "wholesale_arot"
    | "supermarket"
    | "kacha_bazar";
  dietMatch: boolean;
  isPartnerDemo: boolean;
  sourceType: NearbyShopSourceType;
  sourceLabel?: string;
  sourceUrl?: string;
  lastChecked?: string;
  confidence: "high" | "medium" | "demo";
  sourcing?: "direct_farmer" | "local_market" | "home_cooked" | "public_market" | "unknown";
  description: string;
  mapQuery: string;
};

export const NEARBY_SHOPS: NearbyShop[] = [
  // --- PUBLIC MAP SEEDS (Real locations used as search seeds) ---
  {
    id: "karwan-bazar",
    name: "Karwan Bazar Wholesale Market",
    area: "Karwan Bazar",
    city: "Dhaka",
    country: "Bangladesh",
    lat: 23.7516,
    lng: 90.3934,
    imageKind: "market",
    popularItems: ["Fresh Vegetables", "Wholesale Fruits", "Spices", "Fish"],
    type: "wholesale_arot",
    dietMatch: true,
    isPartnerDemo: false,
    sourceType: "public_map_seed",
    sourceLabel: "Public Map Seed",
    confidence: "high",
    sourcing: "public_market",
    description: "One of the largest public wholesale markets in Dhaka for fresh produce and groceries.",
    mapQuery: "Karwan Bazar Kitchen Market Dhaka"
  },
  {
    id: "mohammadpur-krishi",
    name: "Mohammadpur Krishi Market",
    area: "Mohammadpur",
    city: "Dhaka",
    country: "Bangladesh",
    lat: 23.7656,
    lng: 90.3582,
    imageKind: "vegetables",
    popularItems: ["Fresh Vegetables", "Raw Meat", "Local Fish"],
    type: "kacha_bazar",
    dietMatch: true,
    isPartnerDemo: false,
    sourceType: "public_map_seed",
    sourceLabel: "Public Map Seed",
    confidence: "high",
    sourcing: "public_market",
    description: "A major local kitchen market known for fresh agricultural produce.",
    mapQuery: "Mohammadpur Krishi Market Dhaka"
  },
  {
    id: "jatrabari-arot",
    name: "Jatrabari Wholesale Vegetable Market",
    area: "Jatrabari",
    city: "Dhaka",
    country: "Bangladesh",
    imageKind: "arot",
    popularItems: ["Bulk Vegetables", "Seasonal Fruits"],
    type: "wholesale_arot",
    dietMatch: true,
    isPartnerDemo: false,
    sourceType: "public_map_seed",
    sourceLabel: "Public Map Seed",
    confidence: "medium", // Omitting exact lat/lng for safety, using search query
    sourcing: "public_market",
    description: "Major wholesale hub for vegetables and fruits coming into Dhaka.",
    mapQuery: "Jatrabari Vegetable Arot Dhaka"
  },
  {
    id: "shyambazar-fruit",
    name: "Shyambazar Wholesale Market",
    area: "Sadarghat",
    city: "Dhaka",
    country: "Bangladesh",
    imageKind: "fruit",
    popularItems: ["Fresh Fruits", "Onion & Garlic", "Spices"],
    type: "wholesale_arot",
    dietMatch: true,
    isPartnerDemo: false,
    sourceType: "public_map_seed",
    sourceLabel: "Public Map Seed",
    confidence: "medium",
    sourcing: "public_market",
    description: "Historic wholesale market by the Buriganga river, excellent for bulk fruit and spices.",
    mapQuery: "Shyambazar Wholesale Market Dhaka"
  },

  // --- GOOGLE MAPS SEARCH HELPERS (Dynamic search triggers) ---
  {
    id: "search-fresh-veg",
    name: "Nearby Fresh Vegetables",
    area: "Your Area",
    city: "Dhaka",
    country: "Bangladesh",
    imageKind: "vegetables",
    popularItems: ["Lal Shak", "Lau", "Mixed Veg"],
    type: "vegetable_market",
    dietMatch: true,
    isPartnerDemo: false,
    sourceType: "google_maps_search",
    sourceLabel: "Search Helper",
    confidence: "high",
    sourcing: "local_market",
    description: "Find local kacha bazars and vegetable vendors currently open near you.",
    mapQuery: "Fresh vegetables kacha bazar near me"
  },
  {
    id: "search-fish",
    name: "Nearby Fish Markets",
    area: "Your Area",
    city: "Dhaka",
    country: "Bangladesh",
    imageKind: "fish",
    popularItems: ["Rui", "Hilsa", "Small Fish"],
    type: "fish_market",
    dietMatch: true,
    isPartnerDemo: false,
    sourceType: "google_maps_search",
    sourceLabel: "Search Helper",
    confidence: "high",
    sourcing: "local_market",
    description: "Search for local fish markets or specific fish vendors in your vicinity.",
    mapQuery: "Fish market near me"
  },
  {
    id: "search-grocery",
    name: "Nearby Grocery / Supermarkets",
    area: "Your Area",
    city: "Dhaka",
    country: "Bangladesh",
    imageKind: "grocery",
    popularItems: ["Oats", "Brown Rice", "Dal", "Eggs"],
    type: "supermarket",
    dietMatch: true,
    isPartnerDemo: false,
    sourceType: "google_maps_search",
    sourceLabel: "Search Helper",
    confidence: "high",
    sourcing: "local_market",
    description: "Find nearby supermarkets for packaged staples like oats, brown rice, and dairy.",
    mapQuery: "Grocery supermarket near me"
  },
  {
    id: "search-tiffin",
    name: "Nearby Home-Cooked Tiffin",
    area: "Your Area",
    city: "Dhaka",
    country: "Bangladesh",
    imageKind: "tiffin",
    popularItems: ["Low-oil Meals", "Office Lunch", "Healthy Sets"],
    type: "home_made",
    dietMatch: true,
    isPartnerDemo: false,
    sourceType: "google_maps_search",
    sourceLabel: "Search Helper",
    confidence: "medium",
    sourcing: "home_cooked",
    description: "Discover local home-kitchens and tiffin providers around you.",
    mapQuery: "Home cooked tiffin delivery near me"
  },

  // --- CURATED DEMO / SAMPLE PARTNERS (Fictional, clearly labeled) ---
  {
    id: "demo-razia",
    name: "Razia's Home Kitchen",
    area: "Dhanmondi",
    city: "Dhaka",
    country: "Bangladesh",
    lat: 23.7461,
    lng: 90.3742,
    imageKind: "home-kitchen",
    popularItems: ["Low-oil Chicken Curry", "Brown Rice Set", "Mixed Sobji"],
    type: "home_made",
    dietMatch: true,
    isPartnerDemo: true,
    sourceType: "sample_partner",
    sourceLabel: "Sample Partner",
    confidence: "demo",
    sourcing: "home_cooked",
    description: "Demo data: A sample home kitchen focusing on low-oil, diabetic-friendly portion sizes. (Not a real partner).",
    mapQuery: "Home food delivery Dhanmondi"
  },
  {
    id: "demo-amena",
    name: "Amena Bibi's Tiffin",
    area: "Mirpur",
    city: "Dhaka",
    country: "Bangladesh",
    lat: 23.8052,
    lng: 90.3638,
    imageKind: "tiffin",
    popularItems: ["Office Lunch Box", "Lal Shak Bhaji", "Roti Set"],
    type: "home_made",
    dietMatch: true,
    isPartnerDemo: true,
    sourceType: "sample_partner",
    sourceLabel: "Sample Partner",
    confidence: "demo",
    sourcing: "home_cooked",
    description: "Demo data: Sample tiffin service offering balanced Deshi plates for office goers. (Not a real partner).",
    mapQuery: "Tiffin service Mirpur"
  },
  {
    id: "demo-farmer-box",
    name: "Farmer Sourced Veg Box",
    area: "Gazipur",
    city: "Dhaka",
    country: "Bangladesh",
    imageKind: "farmer",
    popularItems: ["Organic Papaya", "Fresh Spinach", "Local Tomatoes"],
    type: "farmer_sourced",
    dietMatch: true,
    isPartnerDemo: true,
    sourceType: "curated_demo",
    sourceLabel: "Demo Data",
    confidence: "demo",
    sourcing: "direct_farmer",
    description: "Demo data: Sample agricultural initiative bringing direct farmer produce to your area. (Not a real partner).",
    mapQuery: "Organic vegetables Gazipur"
  },
  {
    id: "demo-fish-dal",
    name: "Small Fish & Dal Kitchen",
    area: "Uttara",
    city: "Dhaka",
    country: "Bangladesh",
    imageKind: "cafe",
    popularItems: ["Mola Fish Curry", "Masoor Dal", "Lemon Water"],
    type: "restaurant",
    dietMatch: true,
    isPartnerDemo: true,
    sourceType: "curated_demo",
    sourceLabel: "Demo Data",
    confidence: "demo",
    sourcing: "local_market",
    description: "Demo data: A sample local eatery prioritizing high-protein, budget-friendly traditional meals. (Not a real partner).",
    mapQuery: "Local Bengali restaurant Uttara"
  }
];