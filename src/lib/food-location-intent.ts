export function detectFoodShoppingIntent(text: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  
  // Shopping and location intent keywords
  const intentKeywords = [
    "kothay", "কোথায়", "kinbo", "kinbo?", "কিনবো", "kinte", "কিনতে",
    "pawa jay", "পাওয়া যায়", "near me", "nearby", "shop", "store", 
    "supermarket", "bazar", "market", "grocery", "kothay pabo", 
    "kothay kine pawa jay", "where to buy", "buy", "purchase"
  ];

  // Common food items (just as examples, the intent is mainly driven by the keywords above)
  const foodKeywords = [
    "tuna", "lal shak", "dal", "dim", "egg", "oats", "vegetables", "fruits", 
    "fish", "chicken", "milk", "yogurt", "chira", "muri", "brown rice", "atta", 
    "rice", "healthy food", "dudh", "vat", "chal", "ata", "murgi", "goru", "beef", 
    "meat", "goat", "chagol", "vera", "lamb", "deshi mach", "food"
  ];

  // We consider it a shopping intent if it contains a shopping keyword
  // AND either a food keyword OR it's a short query highly focused on buying
  const hasIntent = intentKeywords.some(keyword => lowerText.includes(keyword));
  const hasFood = foodKeywords.some(keyword => lowerText.includes(keyword));

  return hasIntent && (hasFood || lowerText.length < 50);
}

export function extractFoodSearchTerm(text: string): string {
  if (!text) return "healthy food";
  const lowerText = text.toLowerCase();
  
  // Remove common question phrases to isolate the food item
  let cleaned = lowerText
    .replace(/kothay kinye pawa jay\??/g, "")
    .replace(/kothay pawa jay\??/g, "")
    .replace(/kothay pabo\??/g, "")
    .replace(/kothay kinbo\??/g, "")
    .replace(/where to buy\??/g, "")
    .replace(/near me\??/g, "")
    .replace(/nearby\??/g, "")
    .replace(/please/g, "")
    .replace(/suggest/g, "")
    .replace(/ami/g, "")
    .replace(/kivabe/g, "")
    .trim();

  // If we cleaned it too much, fallback to original or generic
  if (cleaned.length < 2) {
    // Try to find a known food keyword
    const foodKeywords = [
      "canned tuna", "tuna mach", "tuna", "lal shak", "dal", "dim", "boiled egg", "egg", "oats", "vegetables", "fruits", 
      "fish", "chicken", "milk", "yogurt", "chira", "muri", "brown rice", "atta", 
      "rice", "healthy food", "dudh", "vat", "chal", "ata", "murgi", "goru", "beef", 
      "meat", "goat", "chagol", "vera", "lamb", "deshi mach"
    ];
    for (const food of foodKeywords) {
      if (lowerText.includes(food)) return food;
    }
    return "healthy food";
  }

  return cleaned;
}

export function buildGoogleMapsSearchUrl(searchTerm: string, coords?: { latitude: number; longitude: number }): string {
  const query = encodeURIComponent(`${searchTerm} near me`);
  if (coords) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchTerm)}+near+${coords.latitude},${coords.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function buildSupermarketSearchUrl(searchTerm: string, coords?: { latitude: number; longitude: number }): string {
  const query = encodeURIComponent(`${searchTerm} supermarket near me`);
  if (coords) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchTerm)}+supermarket+near+${coords.latitude},${coords.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function buildHealthyStoreSearchUrl(searchTerm: string, coords?: { latitude: number; longitude: number }): string {
  const query = encodeURIComponent(`healthy food store near me`);
  if (coords) {
    return `https://www.google.com/maps/search/?api=1&query=healthy+food+store+near+${coords.latitude},${coords.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}