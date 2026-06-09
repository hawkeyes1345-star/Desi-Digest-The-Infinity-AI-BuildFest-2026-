import { type NudgeImageKind } from "./smart-health-nudge";

export function getClientFallbackImage(kind: NudgeImageKind | string) {
  const fileMap: Record<string, string> = {
    "apple": "apple.jpg", "banana": "banana.jpg", "mango": "mango.jpg", "orange": "orange.jpg",
    "watermelon": "watermelon.jpg", "coconut": "coconut.jpg", "dates": "dates.jpg",
    "pomegranate": "pomegranate.jpg", "papaya": "papaya.jpg", "tomato": "tomato.jpg",
    "cucumber": "cucumber.jpg", "carrot": "carrot.jpg", "cabbage": "cabbage.jpg",
    "cauliflower": "cauliflower.jpg", "potato": "potato.jpg", "onion": "onion.jpg",
    "garlic": "garlic.jpg", "ginger": "ginger.jpg", "lemon": "lemon.jpg", "leafy-greens": "leafy-greens.jpg",
    "turmeric": "turmeric.jpg", "cinnamon": "cinnamon.jpg", "black-pepper": "black-pepper.jpg",
    "honey": "honey.jpg", "chia-seed": "chia-seed.jpg", "chicken": "chicken.jpg",
    "beef": "beef.jpg", "shrimp": "shrimp.jpg", "lentil": "lentil.jpg", "milk": "milk.jpg",
    "yogurt": "yogurt.jpg", "cheese": "cheese.jpg", "rice": "rice.jpg", "roti": "roti.jpg",
    "oats": "oats.jpg", "bread": "bread.jpg", "tea": "tea.jpg", "healthy-snack": "healthy-snack.jpg",
    "lal-shak": "lal-shak.jpg", "dal": "dal.jpg", "water": "water.jpg", "egg": "egg.jpg",
    "fish": "fish.jpg", "vegetables": "vegetables.jpg", "rice-balance": "rice-balance.jpg",
    "generic": "generic.jpg", "boiled-egg": "egg.jpg", "brown-rice": "rice.jpg",
    "lemon-water": "water.jpg", "balanced-meal": "rice-balance.jpg", "mixed-vegetables": "vegetables.jpg",
    "fruits": "apple.jpg", "small-fish": "fish.jpg",
  };

  let mapping = fileMap[kind];

  if (!mapping) {
    if (kind.includes("shak") || kind.includes("greens")) mapping = "leafy-greens.jpg";
    else if (kind.includes("dal") || kind.includes("chola") || kind.includes("boot") || kind.includes("soybean") || kind.includes("legume")) mapping = "lentil.jpg";
    else if (kind.includes("fish")) mapping = "fish.jpg";
    else if (kind.includes("beef") || kind.includes("mutton")) mapping = "beef.jpg";
    else if (kind.includes("chicken")) mapping = "chicken.jpg";
    else if (kind.includes("egg")) mapping = "egg.jpg";
    else if (kind.includes("water")) mapping = "water.jpg";
    else if (kind.includes("milk") || kind.includes("doi")) mapping = "milk.jpg";
    else if (kind.includes("rice") || kind.includes("chira") || kind.includes("muri")) mapping = "rice.jpg";
    else if (kind.includes("roti") || kind.includes("atta") || kind.includes("paratha") || kind.includes("suji")) mapping = "roti.jpg";
    else if (kind.includes("fruit") || kind.includes("bel") || kind.includes("amla") || kind.includes("litchi") || kind.includes("jackfruit") || kind.includes("guava") || kind.includes("malta") || kind.includes("pineapple")) mapping = "apple.jpg";
    else if (kind.includes("veg") || kind.includes("lau") || kind.includes("begun") || kind.includes("potol") || kind.includes("korola") || kind.includes("dherosh") || kind.includes("beans") || kind.includes("pumpkin") || kind.includes("sweet-potato") || kind.includes("chili")) mapping = "vegetables.jpg";
    else if (kind.includes("zira") || kind.includes("methi") || kind.includes("cumin") || kind.includes("coriander") || kind.includes("sesame") || kind.includes("seed") || kind.includes("oil") || kind.includes("peanut") || kind.includes("almond")) mapping = "chia-seed.jpg";
    else mapping = "generic.jpg";
  }

  return {
    url: `/nudge-foods/${mapping}`,
    source: "Free licensed photo",
    sourceUrl: "#",
    attribution: `Real photo used for ${mapping}`
  };
}