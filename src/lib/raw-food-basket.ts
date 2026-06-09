export type RawIngredient = {
  id: string;
  nameBn: string;
  nameEn: string;
  category: "vegetable" | "protein" | "grain" | "fruit" | "dairy" | "spice" | "other";
  searchTerms: string[];
  unitHint: string;
  nutritionNote: string;
  imageKind?: string;
};

export type RawFoodBasket = {
  id: string;
  title: string;
  reason: string;
  ingredients: RawIngredient[];
  disclaimer: string;
};

const COMMON_DISCLAIMER = "Desi Digest helps you find ingredients. Purchases happen on external platforms or local shops. Availability and price may vary. General nutrition guidance — not medical advice.";

// Helper to quickly build standard ingredients
const i = (
  id: string, nameBn: string, nameEn: string, category: RawIngredient["category"], 
  searchTerms: string[], unitHint: string, nutritionNote: string, imageKind?: string
): RawIngredient => ({ id, nameBn, nameEn, category, searchTerms, unitHint, nutritionNote, imageKind });

export const PREDEFINED_BASKETS: RawFoodBasket[] = [
  {
    id: "balanced-deshi",
    title: "Balanced Deshi Plate",
    reason: "Standard healthy ingredients for a classic balanced Bangladeshi meal.",
    disclaimer: COMMON_DISCLAIMER,
    ingredients: [
      i("rice", "চাল / লাল চাল", "Rice / Brown Rice", "grain", ["চাল", "rice", "brown rice", "miniket", "najirshail"], "1-5 kg", "Carbohydrate source. Brown rice adds fiber.", "rice"),
      i("dal", "মসুর ডাল", "Masoor Dal (Lentils)", "protein", ["মসুর ডাল", "masoor dal", "lentil"], "500g - 1kg", "Plant-based protein and fiber.", "dal"),
      i("egg", "ডিম", "Eggs", "protein", ["ডিম", "egg", "farm egg", "deshi egg"], "1 dozen", "High quality, budget-friendly protein.", "egg"),
      i("lal-shak", "লাল শাক", "Red Amaranth (Lal Shak)", "vegetable", ["লাল শাক", "lal shak", "red amaranth"], "2-3 ati (bunches)", "Rich in iron and dietary fiber.", "lal-shak"),
      i("mixed-veg", "মিক্সড সবজি (পেঁপে, গাজর, বরবটি)", "Mixed Veg (Papaya, Carrot, Beans)", "vegetable", ["পেঁপে", "গাজর", "বরবটি", "papaya", "carrot", "beans", "vegetables"], "1-2 kg total", "Vitamins and essential micronutrients.", "vegetables"),
      i("lemon", "লেবু", "Lemon", "other", ["লেবু", "lemon", "kagoji lebu"], "4-8 pcs", "Vitamin C, helps absorb iron from shak.", "lemon")
    ]
  },
  {
    id: "high-fiber",
    title: "High Fiber Support",
    reason: "Ingredients specifically chosen to support digestion and prolonged fullness.",
    disclaimer: COMMON_DISCLAIMER,
    ingredients: [
      i("oats", "ওটস", "Oats", "grain", ["ওটস", "oats", "rolled oats"], "500g", "High soluble fiber for breakfast.", "oats"),
      i("pui-shak", "পুঁই শাক / লাউ শাক", "Pui / Lau Shak", "vegetable", ["পুঁই শাক", "লাউ শাক", "pui shak", "lau shak", "leafy greens"], "2 bunches", "Excellent roughage for gut health.", "leafy-greens"),
      i("papaya", "পাকা পেঁপে", "Ripe Papaya", "fruit", ["পাকা পেঁপে", "ripe papaya"], "1 pc", "Natural digestive enzymes and fiber.", "papaya"),
      i("dal-boot", "বুট / ছোলা", "Chickpeas (Chola)", "protein", ["ছোলা", "বুট", "chickpeas", "chola"], "500g", "Complex carbs and high fiber protein.", "lentil"),
      i("chia", "তোকমা / চিয়া সীড", "Tokma / Chia Seeds", "other", ["তোকমা", "চিয়া সীড", "tokma", "chia seeds"], "100g", "Soak in water for extra hydration fiber.", "chia-seed")
    ]
  },
  {
    id: "budget-protein",
    title: "Budget Protein Pack",
    reason: "Cost-effective, high-quality protein sources for daily muscle and energy needs.",
    disclaimer: COMMON_DISCLAIMER,
    ingredients: [
      i("egg", "ডিম", "Eggs", "protein", ["ডিম", "egg"], "1 dozen", "Complete amino acid profile.", "egg"),
      i("dal-mix", "মিক্সড ডাল (মসুর, মুগ)", "Mixed Dal", "protein", ["মসুর ডাল", "মুগ ডাল", "mixed dal"], "1 kg", "Excellent budget protein when paired with rice.", "dal"),
      i("small-fish", "ছোট মাছ / গুঁড়া মাছ", "Small Fish", "protein", ["ছোট মাছ", "গুঁড়া মাছ", "mola", "kachki", "small fish"], "500g", "High in protein, calcium, and healthy fats.", "fish"),
      i("soybean", "সয়াবিন বড়ি", "Soy Chunks", "protein", ["সয়াবিন বড়ি", "soy chunks", "nutrela"], "200g", "Highly concentrated plant protein.", "lentil")
    ]
  },
  {
    id: "light-dinner",
    title: "Light Dinner Basket",
    reason: "Easily digestible ingredients for a lighter, balanced evening meal.",
    disclaimer: COMMON_DISCLAIMER,
    ingredients: [
      i("roti", "লাল আটা", "Brown Atta", "grain", ["লাল আটা", "brown atta", "whole wheat"], "1 kg", "Better evening carb choice than white rice.", "roti"),
      i("lau", "লাউ / পেঁপে", "Bottle Gourd (Lau) / Papaya", "vegetable", ["লাউ", "bottle gourd", "green papaya"], "1 medium", "Very light on the stomach, high water content.", "vegetables"),
      i("chicken", "মুরগির বুকের মাংস", "Chicken Breast", "protein", ["মুরগি", "chicken breast", "murgi"], "500g", "Lean protein, easy to digest.", "chicken"),
      i("tok-doi", "টক দই", "Plain Yogurt (Tok Doi)", "dairy", ["টক দই", "plain yogurt", "tok doi"], "500g", "Probiotics to support overnight digestion.", "yogurt")
    ]
  }
];

export function getBasketById(id: string): RawFoodBasket {
  return PREDEFINED_BASKETS.find(b => b.id === id) || PREDEFINED_BASKETS[0];
}