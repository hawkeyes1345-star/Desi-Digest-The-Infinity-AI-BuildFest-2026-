import { supabase } from "@/integrations/supabase/client";

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

export async function getPersistentNudgeImage(imageKind: string): Promise<NudgeImageInfo | null> {
  if (process.env.SMART_NUDGE_IMAGE_FETCH_ENABLED !== "true") return null;

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
    if (!searchRes.ok) return null;
    
    const searchData = await searchRes.json();
    const pages = searchData.query?.pages;
    if (!pages) return null;

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

    if (!imageUrl) return null;

    // 3. Download the image
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) return null;
    
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
    }

    return {
      url: publicUrlData.publicUrl,
      source: "Wikimedia Commons",
      sourceUrl: sourceUrl,
      attribution: attribution
    };

  } catch (error) {
    console.warn(`[Nudge Image Service] Error in getPersistentNudgeImage:`, error);
    return null;
  }
}
