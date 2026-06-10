
export type ProductTrustStatus =
  | "verified_official"
  | "needs_manual_verification"
  | "no_visible_code"
  | "not_applicable_cooked_meal"
  | "unknown";

export type ProductTrustSignal = {
  type:
    | "bsti_text"
    | "bds_text"
    | "license_number"
    | "certificate_number"
    | "qr_mentioned"
    | "brand_or_label_text"
    | "packaged_product_hint"
    | "cooked_meal_hint"
    | "manual_user_input";
  label: string;
  confidence: "low" | "medium" | "high";
};

export type ProductTrustCheck = {
  status: ProductTrustStatus;
  title: string;
  message: string;
  detectedSignals: ProductTrustSignal[];
  suggestedAction: string;
  officialVerificationLabel: string;
  officialVerificationUrl?: string;
  manualInputPrompt?: string;
  confidence: "low" | "medium" | "high";
  disclaimer: string;
  isDemo?: boolean;
};

export type ProductTrustInput = {
  foodName?: string;
  detectedText?: string;
  detectedIngredients?: string[];
  imageDescription?: string;
  imageKind?: "cooked_meal" | "packaged_product" | "unknown";
  productName?: string;
  brandName?: string;
  manualCode?: string;
  userUploadedImage?: boolean;
  userQuery?: string;
  isDemo?: boolean;
};

export const OFFICIAL_BSTI_VERIFICATION_URL = "https://bsti.gov.bd"; // Search/portal link

export function isLikelyCookedMeal(text: string): boolean {
  const cookedKeywords = [
    "curry", "rice", "bhat", "biryani", "khichuri", "dal", "fish", "vegetable",
    "thali", "plate", "home cooked", "tiffin", "bhuna", "bhaji", "bhorta",
    "ভাত", "ডাল", "মাছ", "তরকারি", "খিচুড়ি", "বিরিয়ানি", "ভাজি", "ভর্তা"
  ];
  const lowerText = text.toLowerCase();
  return cookedKeywords.some(kw => lowerText.includes(kw));
}

export function isLikelyPackagedProduct(text: string): boolean {
  const packagedKeywords = [
    "packet", "bottle", "jar", "oil", "spice", "biscuit", "snack", "water",
    "labeled", "brand", "package", "label", "barcode", "qr", "certificate",
    "license", "bsti", "bds", "exp", "mfg", "batch", "mrp",
    "প্যাকেট", "বোতল", "জার", "লেবেল", "ব্র্যান্ড"
  ];
  const lowerText = text.toLowerCase();
  return packagedKeywords.some(kw => lowerText.includes(kw));
}

export function detectProductTrustSignals(input: ProductTrustInput): ProductTrustSignal[] {
  const signals: ProductTrustSignal[] = [];
  const allText = [
    input.foodName,
    input.detectedText,
    ...(input.detectedIngredients || []),
    input.imageDescription,
    input.productName,
    input.brandName,
    input.userQuery
  ].filter(Boolean).join(" ").toLowerCase();

  if (allText.includes("bsti")) {
    signals.push({ type: "bsti_text", label: "BSTI Mention", confidence: "medium" });
  }
  if (allText.includes("bds")) {
    signals.push({ type: "bds_text", label: "BDS Mark", confidence: "low" });
  }
  if (allText.includes("qr") || allText.includes("code")) {
    signals.push({ type: "qr_mentioned", label: "QR/Code Mention", confidence: "low" });
  }
  if (input.brandName) {
    signals.push({ type: "brand_or_label_text", label: `Brand: ${input.brandName}`, confidence: "high" });
  }
  if (input.manualCode) {
    signals.push({ type: "manual_user_input", label: `Manual Code: ${input.manualCode}`, confidence: "high" });
  }
  
  if (isLikelyPackagedProduct(allText)) {
    signals.push({ type: "packaged_product_hint", label: "Likely Packaged Product", confidence: "medium" });
  } else if (isLikelyCookedMeal(allText)) {
    signals.push({ type: "cooked_meal_hint", label: "Likely Cooked Meal", confidence: "medium" });
  }

  return signals;
}

export function analyzeProductTrust(input: ProductTrustInput): ProductTrustCheck {
  const signals = detectProductTrustSignals(input);
  const allText = [
    input.foodName,
    input.detectedText,
    ...(input.detectedIngredients || []),
    input.imageDescription,
    input.productName,
    input.brandName,
    input.userQuery,
    input.manualCode
  ].filter(Boolean).join(" ").toLowerCase();

  const isDemo = input.isDemo || false;
  const disclaimer = "Desi Digest does not certify products. Please verify through official sources.";

  // Demo Fallback
  if (isDemo && (allText.includes("spice") || allText.includes("packet"))) {
    return {
      status: "needs_manual_verification",
      title: "Product Trust Check (Sample)",
      message: "A possible BSTI/license/QR signal was detected. Please verify it through the official BSTI verification channel or the product’s visible code.",
      detectedSignals: [
        { type: "bsti_text", label: "BSTI Mark Detected", confidence: "medium" },
        { type: "packaged_product_hint", label: "Packaged Spice Packet", confidence: "high" }
      ],
      suggestedAction: "Verify this product's license number on the BSTI portal.",
      officialVerificationLabel: "Open official verification",
      officialVerificationUrl: OFFICIAL_BSTI_VERIFICATION_URL,
      manualInputPrompt: "Enter visible BSTI license/certificate/QR code",
      confidence: "medium",
      disclaimer,
      isDemo: true
    };
  }

  // Cooked Meal Logic
  if (isLikelyCookedMeal(allText) && !isLikelyPackagedProduct(allText)) {
    return {
      status: "not_applicable_cooked_meal",
      title: "Product Trust Check",
      message: "BSTI label verification usually applies to packaged products, not cooked meals. This result focuses on nutrition guidance.",
      detectedSignals: signals.filter(s => s.type === "cooked_meal_hint"),
      suggestedAction: "Focus on the nutritional balance of this meal.",
      officialVerificationLabel: "Search official BSTI verification",
      confidence: "high",
      disclaimer,
      isDemo
    };
  }

  // Packaged Product Logic
  const hasTrustSignal = signals.some(s => ["bsti_text", "bds_text", "license_number", "qr_mentioned", "manual_user_input"].includes(s.type));
  
  if (hasTrustSignal || input.manualCode) {
    return {
      status: "needs_manual_verification",
      title: "Product Trust Check",
      message: "A possible BSTI/license/QR signal was detected. Please verify it through the official BSTI verification channel or the product’s visible code.",
      detectedSignals: signals,
      suggestedAction: "Use the official verification page to confirm this code.",
      officialVerificationLabel: "Open official verification",
      officialVerificationUrl: OFFICIAL_BSTI_VERIFICATION_URL,
      manualInputPrompt: "Enter visible BSTI license/certificate/QR code",
      confidence: "medium",
      disclaimer,
      isDemo
    };
  }

  if (isLikelyPackagedProduct(allText)) {
    return {
      status: "no_visible_code",
      title: "Product Trust Check",
      message: "No clear BSTI mark, certificate, QR, or license code was detected from the available image/text.",
      detectedSignals: signals,
      suggestedAction: "Manually check the package for a BSTI mark or license number.",
      officialVerificationLabel: "Search official BSTI verification",
      officialVerificationUrl: OFFICIAL_BSTI_VERIFICATION_URL,
      manualInputPrompt: "Enter visible BSTI license/certificate/QR code",
      confidence: "low",
      disclaimer,
      isDemo
    };
  }

  // Unknown
  return {
    status: "unknown",
    title: "Product Trust Check",
    message: "I could not confidently tell whether this is a packaged product or cooked meal from the available data.",
    detectedSignals: signals,
    suggestedAction: "If this is a packaged product, look for a BSTI mark.",
    officialVerificationLabel: "Search official BSTI verification",
    confidence: "low",
    disclaimer,
    isDemo
  };
}

export function sanitizeProductTrustText(text: string): string {
  // Remove technical jargon or provider names if they somehow leaked
  return text.replace(/\b(gemini|openrouter|ai|gpt|llm|vision)\b/gi, "").trim();
}
