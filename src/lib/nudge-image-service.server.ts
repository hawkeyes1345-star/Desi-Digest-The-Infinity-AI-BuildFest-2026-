import { supabase } from "@/integrations/supabase/client";
import { type NudgeImageKind } from "./smart-health-nudge";

const BUCKET_NAME = "nudge-foods";

export type NudgeImageInfo = {
  url: string;
  source: string;
  sourceUrl: string;
  attribution?: string;
};

// Map imageKind to Wikimedia search queries
const WIKIMEDIA_QUERIES: Record<string, string> = {
  "lal-shak": "Red amaranth vegetable Bangladesh",
  "dal": "Yellow lentil dal bowl",
  "water": "Glass of clear water",
  "egg": "Boiled eggs on a plate",
  "fish": "Cooked fish curry Bangladeshi",
  "vegetables": "Bangladeshi mixed vegetables bhaji",
  "rice-balance": "Healthy balanced meal plate with rice and vegetables",
  "generic": "Healthy fresh food vegetables"
};

// We dynamically map the expanded kinds to our downloaded local files
export async function getGuaranteedNudgeImage(imageKind: NudgeImageKind | string): Promise<NudgeImageInfo> {
  const kind = imageKind as NudgeImageKind;
  
  // We have specific downloaded files for these
  const fileMap: Record<string, { file: string; url: string; attr: string }> = {
    "apple": { file: "apple.jpg", url: "https://www.pexels.com/photo/102104/", attr: "Apple" },
    "banana": { file: "banana.jpg", url: "https://www.pexels.com/photo/2872755/", attr: "Banana" },
    "mango": { file: "mango.jpg", url: "https://www.pexels.com/photo/2294471/", attr: "Mango" },
    "orange": { file: "orange.jpg", url: "https://www.pexels.com/photo/327090/", attr: "Orange" },
    "watermelon": { file: "watermelon.jpg", url: "https://www.pexels.com/photo/1313267/", attr: "Watermelon" },
    "coconut": { file: "coconut.jpg", url: "https://www.pexels.com/photo/4195527/", attr: "Coconut" },
    "dates": { file: "dates.jpg", url: "https://commons.wikimedia.org/wiki/File:Dried_dates.jpg", attr: "Dates" },
    "pomegranate": { file: "pomegranate.jpg", url: "https://www.pexels.com/photo/5753063/", attr: "Pomegranate" },
    "papaya": { file: "papaya.jpg", url: "https://www.pexels.com/photo/8753754/", attr: "Papaya" },
    "tomato": { file: "tomato.jpg", url: "https://www.pexels.com/photo/1327838/", attr: "Tomato" },
    "cucumber": { file: "cucumber.jpg", url: "https://www.pexels.com/photo/3568039/", attr: "Cucumber" },
    "carrot": { file: "carrot.jpg", url: "https://www.pexels.com/photo/143133/", attr: "Carrot" },
    "cabbage": { file: "cabbage.jpg", url: "https://commons.wikimedia.org/wiki/File:Cabbage_and_cross_section_on_white.jpg", attr: "Cabbage" },
    "cauliflower": { file: "cauliflower.jpg", url: "https://commons.wikimedia.org/wiki/File:Cauliflower_1_bd.jpg", attr: "Cauliflower" },
    "potato": { file: "potato.jpg", url: "https://commons.wikimedia.org/wiki/File:A_Potato.jpg", attr: "Potato" },
    "onion": { file: "onion.jpg", url: "https://www.pexels.com/photo/1448054/", attr: "Onion" },
    "garlic": { file: "garlic.jpg", url: "https://www.pexels.com/photo/1393382/", attr: "Garlic" },
    "ginger": { file: "ginger.jpg", url: "https://www.pexels.com/photo/4197491/", attr: "Ginger" },
    "lemon": { file: "lemon.jpg", url: "https://www.pexels.com/photo/1414115/", attr: "Lemon" },
    "leafy-greens": { file: "leafy-greens.jpg", url: "https://www.pexels.com/photo/2325843/", attr: "Leafy greens" },
    "turmeric": { file: "turmeric.jpg", url: "https://www.pexels.com/photo/1341279/", attr: "Turmeric" },
    "cinnamon": { file: "cinnamon.jpg", url: "https://www.pexels.com/photo/277253/", attr: "Cinnamon" },
    "black-pepper": { file: "black-pepper.jpg", url: "https://www.pexels.com/photo/4187607/", attr: "Black pepper" },
    "honey": { file: "honey.jpg", url: "https://www.pexels.com/photo/1118332/", attr: "Honey" },
    "chia-seed": { file: "chia-seed.jpg", url: "https://www.pexels.com/photo/9551192/", attr: "Chia seed" },
    "chicken": { file: "chicken.jpg", url: "https://www.pexels.com/photo/616353/", attr: "Chicken" },
    "beef": { file: "beef.jpg", url: "https://www.pexels.com/photo/65175/", attr: "Beef" },
    "shrimp": { file: "shrimp.jpg", url: "https://www.pexels.com/photo/566345/", attr: "Shrimp" },
    "lentil": { file: "lentil.jpg", url: "https://www.pexels.com/photo/4110332/", attr: "Lentil" },
    "milk": { file: "milk.jpg", url: "https://www.pexels.com/photo/248412/", attr: "Milk" },
    "yogurt": { file: "yogurt.jpg", url: "https://www.pexels.com/photo/2861536/", attr: "Yogurt" },
    "cheese": { file: "cheese.jpg", url: "https://www.pexels.com/photo/2059151/", attr: "Cheese/Paneer" },
    "rice": { file: "rice.jpg", url: "https://www.pexels.com/photo/4110251/", attr: "Rice" },
    "roti": { file: "roti.jpg", url: "https://www.pexels.com/photo/2089808/", attr: "Roti" },
    "oats": { file: "oats.jpg", url: "https://commons.wikimedia.org/wiki/File:Rolled_Oats.jpg", attr: "Oats" },
    "bread": { file: "bread.jpg", url: "https://www.pexels.com/photo/209206/", attr: "Bread" },
    "tea": { file: "tea.jpg", url: "https://www.pexels.com/photo/1417945/", attr: "Tea" },
    "healthy-snack": { file: "healthy-snack.jpg", url: "https://www.pexels.com/photo/1640777/", attr: "Healthy Snack" },
    
    // Core mapped
    "lal-shak": { file: "lal-shak.jpg", url: "https://www.pexels.com/photo/6608616/", attr: "Lal Shak" },
    "dal": { file: "dal.jpg", url: "https://www.pexels.com/photo/7363671/", attr: "Dal" },
    "water": { file: "water.jpg", url: "https://www.pexels.com/photo/416528/", attr: "Water" },
    "egg": { file: "egg.jpg", url: "https://www.pexels.com/photo/824635/", attr: "Egg" },
    "fish": { file: "fish.jpg", url: "https://www.pexels.com/photo/3296280/", attr: "Fish" },
    "vegetables": { file: "vegetables.jpg", url: "https://www.pexels.com/photo/1414651/", attr: "Vegetables" },
    "rice-balance": { file: "rice-balance.jpg", url: "https://www.pexels.com/photo/1640772/", attr: "Balanced Plate" },
    "generic": { file: "generic.jpg", url: "https://www.pexels.com/photo/1640777/", attr: "Healthy Food" },
  };

  // Find exact match or fallback by category
  let mapping = fileMap[kind];

  if (!mapping) {
    if (kind.includes("shak") || kind.includes("greens")) mapping = fileMap["leafy-greens"];
    else if (kind.includes("dal") || kind.includes("chola") || kind.includes("boot") || kind.includes("soybean") || kind.includes("legume")) mapping = fileMap["lentil"];
    else if (kind.includes("fish")) mapping = fileMap["fish"];
    else if (kind.includes("beef") || kind.includes("mutton")) mapping = fileMap["beef"];
    else if (kind.includes("chicken")) mapping = fileMap["chicken"];
    else if (kind.includes("egg")) mapping = fileMap["egg"];
    else if (kind.includes("water")) mapping = fileMap["water"];
    else if (kind.includes("milk") || kind.includes("doi")) mapping = fileMap["milk"];
    else if (kind.includes("rice") || kind.includes("chira") || kind.includes("muri")) mapping = fileMap["rice"];
    else if (kind.includes("roti") || kind.includes("atta") || kind.includes("paratha") || kind.includes("suji")) mapping = fileMap["roti"];
    else if (kind.includes("fruit") || kind.includes("bel") || kind.includes("amla") || kind.includes("litchi") || kind.includes("jackfruit") || kind.includes("guava") || kind.includes("malta") || kind.includes("pineapple")) mapping = fileMap["apple"];
    else if (kind.includes("veg") || kind.includes("lau") || kind.includes("begun") || kind.includes("potol") || kind.includes("korola") || kind.includes("dherosh") || kind.includes("beans") || kind.includes("pumpkin") || kind.includes("sweet-potato") || kind.includes("chili")) mapping = fileMap["vegetables"];
    else if (kind.includes("zira") || kind.includes("methi") || kind.includes("cumin") || kind.includes("coriander") || kind.includes("sesame") || kind.includes("seed") || kind.includes("oil") || kind.includes("peanut") || kind.includes("almond")) mapping = fileMap["chia-seed"];
    else mapping = fileMap["generic"];
  }

  return {
    url: `/nudge-foods/${mapping.file}`,
    source: "Free licensed photo",
    sourceUrl: mapping.url,
    attribution: `Real photo used for ${mapping.attr}`
  };
}

export async function getPersistentNudgeImage(imageKind: string): Promise<NudgeImageInfo | null> {
  const fallback = await getGuaranteedNudgeImage(imageKind);
  
  if (process.env.SMART_NUDGE_IMAGE_FETCH_ENABLED !== "true") {
     // Return curated fallback immediately if live fetch is disabled
     return fallback;
  }

  try {
    const filename = `${imageKind}.jpg`;

    // 1. Check if the image already exists in Supabase
    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filename);
    
    const { data: files } = await supabase.storage.from(BUCKET_NAME).list("", {
      search: filename
    });

    if (files && files.length > 0 && files[0].name === filename) {
      return {
        url: publicUrlData.publicUrl,
        source: "Wikimedia Commons",
        sourceUrl: "https://commons.wikimedia.org"
      };
    }

    // 2. If missing, attempt to fetch from Wikimedia Commons API
    const query = WIKIMEDIA_QUERIES[imageKind] || WIKIMEDIA_QUERIES["generic"];
    
    // Search Wikimedia API with more specific params
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages|info&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&pithumbsize=1000&inprop=url`;
    
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return fallback;
    
    const searchData = await searchRes.json();
    const pages = searchData.query?.pages;
    if (!pages) return fallback;

    // Get first page with a thumbnail
    let imageUrl: string | null = null;
    let sourceUrl: string = "https://commons.wikimedia.org";
    let attribution: string = "Wikimedia Commons";

    for (const pageId in pages) {
      if (pages[pageId].thumbnail?.source) {
        imageUrl = pages[pageId].thumbnail.source;
        sourceUrl = pages[pageId].fullurl || sourceUrl;
        attribution = pages[pageId].title || attribution;
        break;
      }
    }

    if (!imageUrl) return fallback;

    // 3. Download the image
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) return fallback;
    
    const arrayBuffer = await imageRes.arrayBuffer();

    // 4. Upload to Supabase
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.warn(`[Nudge Image Service] Failed to upload ${filename}: ${uploadError.message}`);
      return fallback;
    }

    return {
      url: publicUrlData.publicUrl,
      source: "Wikimedia Commons",
      sourceUrl: sourceUrl,
      attribution: attribution
    };

  } catch (error) {
    console.warn(`[Nudge Image Service] Error in getPersistentNudgeImage, using fallback:`, error);
    return fallback;
  }
}
