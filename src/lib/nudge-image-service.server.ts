import { supabase } from "@/integrations/supabase/client";

const BUCKET_NAME = "nudge-foods";

// Map imageKind to Wikimedia search queries
const WIKIMEDIA_QUERIES: Record<string, string> = {
  "lal-shak": "red amaranth Bangladesh",
  "dal": "cooked lentil dal bowl",
  "water": "glass of drinking water",
  "egg": "boiled egg cut in half",
  "fish": "cooked fish curry bowl",
  "vegetables": "mixed cooked vegetables",
  "rice-balance": "healthy balanced meal plate rice",
  "generic": "healthy balanced meal plate"
};

export async function getPersistentNudgeImage(imageKind: string): Promise<string | null> {
  if (process.env.SMART_NUDGE_IMAGE_FETCH_ENABLED !== "true") return null;

  try {
    const filename = `${imageKind}.jpg`;

    // 1. Check if the image already exists in Supabase
    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filename);
    
    // We need to actually see if it exists by trying to download or list it
    // getPublicUrl always returns a URL even if the file doesn't exist.
    const { data: files } = await supabase.storage.from(BUCKET_NAME).list("", {
      search: filename
    });

    if (files && files.length > 0 && files[0].name === filename) {
      return publicUrlData.publicUrl;
    }

    // 2. If missing, attempt to fetch from Wikimedia Commons API
    const query = WIKIMEDIA_QUERIES[imageKind] || WIKIMEDIA_QUERIES["generic"];
    
    // Search Wikimedia API
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=0&pithumbsize=800`;
    
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;
    
    const searchData = await searchRes.json();
    const pages = searchData.query?.pages;
    if (!pages) return null;

    // Get first page with a thumbnail
    let imageUrl: string | null = null;
    for (const pageId in pages) {
      if (pages[pageId].thumbnail?.source) {
        imageUrl = pages[pageId].thumbnail.source;
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
        upsert: false
      });

    if (uploadError) {
      // If bucket doesn't exist, this might fail. We can silently fail and return null
      // to let the UI fallback.
      console.warn(`[Nudge Image Service] Failed to upload ${filename}: ${uploadError.message}`);
      return null;
    }

    // 5. Return the new public URL
    const { data: newPublicUrl } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filename);
    return newPublicUrl.publicUrl;

  } catch (error) {
    console.warn(`[Nudge Image Service] Error in getPersistentNudgeImage:`, error);
    return null;
  }
}
