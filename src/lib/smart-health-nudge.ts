import { type MealLog } from "./meals.functions";

export const SMART_NUDGE_IMAGE_KINDS = [
  // Leafy greens
  "lal-shak", "palong-shak", "pui-shak", "kolmi-shak", "data-shak", "lau-shak", "kochu-shak", "methi-shak", "spinach", "leafy-greens",
  // Vegetables
  "lau", "begun", "potol", "korola", "dherosh", "tomato", "cucumber", "carrot", "cabbage", "cauliflower", "beans", "pumpkin", "papaya-green", "potato", "sweet-potato", "onion", "garlic", "ginger", "lemon", "green-chili", "mixed-vegetables", "vegetables",
  // Fruits
  "banana", "apple", "guava", "papaya", "mango", "orange", "malta", "pineapple", "watermelon", "coconut", "dates", "jackfruit", "litchi", "amla", "bel", "pomegranate", "fruits",
  // Staples
  "rice", "brown-rice", "rice-balance", "roti", "atta", "paratha", "chira", "muri", "oats", "bread", "suji", "khichuri",
  // Pulses
  "dal", "masoor-dal", "mug-dal", "chola", "boot", "lentil", "beans-legume", "soybean",
  // Protein
  "egg", "boiled-egg", "chicken", "fish", "small-fish", "rui-fish", "katla-fish", "hilsa", "tuna", "canned-tuna", "beef", "mutton", "shrimp",
  // Dairy
  "milk", "yogurt", "tok-doi", "paneer", "cheese",
  // Nuts / natural
  "kalo-zira", "methi", "honey", "turmeric", "cinnamon", "black-pepper", "cumin", "coriander", "sesame", "peanut", "almond", "chia-seed", "flaxseed", "mustard-oil", "olive-oil",
  // Drinks
  "water", "lemon-water", "coconut-water", "green-tea", "tea", "milk-tea",
  // Generic
  "balanced-meal", "healthy-snack", "generic"
] as const;

export type NudgeImageKind = typeof SMART_NUDGE_IMAGE_KINDS[number];

export function normalizeImageKind(input: string): NudgeImageKind {
  const normalized = input.toLowerCase().replace(/_/g, "-");
  if (SMART_NUDGE_IMAGE_KINDS.includes(normalized as any)) {
    return normalized as NudgeImageKind;
  }
  
  // Fallbacks by category mapping
  if (normalized.includes("shak") || normalized.includes("spinach")) return "leafy-greens";
  if (normalized.includes("fish") || normalized.includes("mach")) return "fish";
  if (normalized.includes("dal") || normalized.includes("lentil") || normalized.includes("bean")) return "dal";
  if (normalized.includes("water") || normalized.includes("pani")) return "water";
  if (normalized.includes("egg") || normalized.includes("dim")) return "egg";
  if (normalized.includes("chicken") || normalized.includes("beef") || normalized.includes("meat")) return "chicken";
  if (normalized.includes("milk") || normalized.includes("doi") || normalized.includes("yogurt")) return "milk";
  if (normalized.includes("rice") || normalized.includes("bhat")) return "rice";
  if (normalized.includes("fruit")) return "fruits";
  if (normalized.includes("veg") || normalized.includes("shobji")) return "vegetables";
  
  return "generic";
}

export type SmartHealthNudgePlanItem = {
  day: number;
  titleBn: string;
  titleEn: string;
  suggestionBn: string;
  suggestionEn: string;
  benefitBn: string;
  benefitEn: string;
  imageKind: NudgeImageKind;
  imageUrl?: string;
};

export type SmartHealthNudge = {
  id: string;
  titleBn: string;
  titleEn: string;
  messageBn: string;
  messageEn: string;
  benefitBn: string;
  benefitEn: string;
  actionLabelBn: string;
  actionLabelEn: string;
  imageKind: NudgeImageKind;
  imageUrl?: string;
  imageSource?: string;
  imageSourceUrl?: string;
  priority: "low" | "medium" | "high";
  reasonBn: string;
  reasonEn: string;
  disclaimerBn: string;
  disclaimerEn: string;
  isDemo?: boolean;
  sevenDayPlan?: SmartHealthNudgePlanItem[];
  checkInQuestionBn?: string;
  checkInQuestionEn?: string;
  exerciseSuggestionBn?: string;
  exerciseSuggestionEn?: string;
};

export function getFallbackSevenDayPlan(nudgeId: string): SmartHealthNudgePlanItem[] {
  const id = nudgeId.toLowerCase();
  
  if (id.includes("low-fiber") || id.includes("fiber")) {
    return [
      {
        day: 1,
        titleBn: "ডাল যোগ করুন",
        titleEn: "Add lentils",
        suggestionBn: "ভাতের সাথে এক বাটি ডাল খান।",
        suggestionEn: "Have a bowl of dal with your rice.",
        benefitBn: "ফাইবার ও প্রোটিন বাড়ায়",
        benefitEn: "Adds fiber and protein",
        imageKind: "dal"
      },
      {
        day: 2,
        titleBn: "লাল শাক যোগ করুন",
        titleEn: "Add red amaranth",
        suggestionBn: "দুপুরে খাবারের সাথে লাল শাক বা অন্য শাক রাখুন।",
        suggestionEn: "Include red amaranth or other leafy greens with lunch.",
        benefitBn: "হজম শক্তি বৃদ্ধি করে",
        benefitEn: "Boosts digestion",
        imageKind: "lal-shak"
      },
      {
        day: 3,
        titleBn: "সবজি মিক্স করুন",
        titleEn: "Mix vegetables",
        suggestionBn: "আপনার প্লেটের অর্ধেক অংশ সবজি দিয়ে পূরণ করুন।",
        suggestionEn: "Fill half of your plate with mixed vegetables.",
        benefitBn: "ভিটামিন ও ফাইবার সরবরাহ করে",
        benefitEn: "Provides vitamins and fiber",
        imageKind: "mixed-vegetables"
      },
      {
        day: 4,
        titleBn: "ফল খান",
        titleEn: "Eat a fruit",
        suggestionBn: "বিকেলে নাশতায় একটি পেয়ারা বা কলা খান।",
        suggestionEn: "Eat a guava or banana as an afternoon snack.",
        benefitBn: "মিষ্টির ক্রেভিং কমায় ও ফাইবার দেয়",
        benefitEn: "Reduces sweet cravings and adds fiber",
        imageKind: "fruits"
      },
      {
        day: 5,
        titleBn: "ভাজা পোড়া কমান",
        titleEn: "Reduce fried snacks",
        suggestionBn: "সিংগারা-সমুচার বদলে মুড়ি বা ভাজাহীন ছোলা বুট খান।",
        suggestionEn: "Swap shingara/samosa for puffed rice or boiled chickpeas.",
        benefitBn: "অতিরিক্ত ক্যালরি ও ক্ষতিকর ফ্যাট কমায়",
        benefitEn: "Reduces extra calories and unhealthy fats",
        imageKind: "healthy-snack"
      },
      {
        day: 6,
        titleBn: "পর্যাপ্ত পানি",
        titleEn: "Enough water",
        suggestionBn: "সারাদিনে ৮-১০ গ্লাস পানি পান নিশ্চিত করুন।",
        suggestionEn: "Ensure 8-10 glasses of water throughout the day.",
        benefitBn: "ফাইবার হজমে সাহায্য করে",
        benefitEn: "Helps digest fiber",
        imageKind: "water"
      },
      {
        day: 7,
        titleBn: "ব্যালেন্সড দেশি প্লেট",
        titleEn: "Balanced Deshi plate",
        suggestionBn: "১/৪ ভাত, ১/৪ প্রোটিন এবং ১/২ অংশ সবজি দিয়ে প্লেট সাজান।",
        suggestionEn: "Fill 1/4 with rice, 1/4 with protein, and 1/2 with veggies.",
        benefitBn: "দীর্ঘক্ষণ এনার্জি বজায় রাখে",
        benefitEn: "Provides sustained energy",
        imageKind: "balanced-meal"
      }
    ];
  }
  
  if (id.includes("fried") || id.includes("oil") || id.includes("fat")) {
    return [
      {
        day: 1,
        titleBn: "সেদ্ধ ডিম খান",
        titleEn: "Eat boiled egg",
        suggestionBn: "তেলে ভাজা ডিমের বদলে সেদ্ধ ডিম বেছে নিন।",
        suggestionEn: "Choose a boiled egg instead of a fried egg.",
        benefitBn: "অতিরিক্ত তেল ছাড়াই প্রোটিন দেয়",
        benefitEn: "Provides protein without extra oil",
        imageKind: "boiled-egg"
      },
      {
        day: 2,
        titleBn: "ডাল বা স্যুপ",
        titleEn: "Lentils or soup",
        suggestionBn: "বিকেলের নাস্তায় ভাজা তেলের খাবারের বদলে পাতলা ডাল বা সবজি স্যুপ খান।",
        suggestionEn: "Have thin dal or vegetable soup instead of oily snacks.",
        benefitBn: "পাকস্থলীকে আরাম দেয়",
        benefitEn: "Soothes the stomach",
        imageKind: "dal"
      },
      {
        day: 3,
        titleBn: "মাছ ভাজা এড়িয়ে চলুন",
        titleEn: "Avoid deep-fried fish",
        suggestionBn: "মাছ কড়া ভাজার বদলে ঝোল বা ভাপে রান্না করুন।",
        suggestionEn: "Try fish curry or steamed fish instead of deep frying.",
        benefitBn: "মাছের পুষ্টিগুণ বজায় থাকে",
        benefitEn: "Preserves fish nutrients",
        imageKind: "fish"
      },
      {
        day: 4,
        titleBn: "সবজি তরকারি",
        titleEn: "Vegetable curry",
        suggestionBn: "কম তেলে রান্না করা সবজি তরকারি খান।",
        suggestionEn: "Eat vegetable curry prepared with minimal oil.",
        benefitBn: "ফাইবার বাড়ে এবং ফ্যাট কমে",
        benefitEn: "Increases fiber and reduces fat",
        imageKind: "vegetables"
      },
      {
        day: 5,
        titleBn: "মুড়ি ও ছোলা",
        titleEn: "Puffed rice & chickpeas",
        suggestionBn: "তেলে ভাজা পিয়াজু-বেগুনির বদলে কম তেলের ছোলা ও মুড়ি খান।",
        suggestionEn: "Swap deep-fried peaju/beguni for low-oil chickpeas and puffed rice.",
        benefitBn: "হার্টের জন্য ভালো",
        benefitEn: "Heart friendly option",
        imageKind: "healthy-snack"
      },
      {
        day: 6,
        titleBn: "লেবু পানি",
        titleEn: "Lemon water",
        suggestionBn: "চর্বিযুক্ত খাবারের পর হালকা গরম পানিতে লেবু চিপে খান।",
        suggestionEn: "Have warm lemon water after rich meals.",
        benefitBn: "হজম সহজ করে",
        benefitEn: "Aids digestion",
        imageKind: "lemon-water"
      },
      {
        day: 7,
        titleBn: "তেলমুক্ত খাবার",
        titleEn: "Oil-free alternative",
        suggestionBn: "আজকের অন্তত একটি প্রধান খাবার সেদ্ধ বা ভাপানো আইটেম দিয়ে সাজান।",
        suggestionEn: "Include at least one boiled or steamed dish in today's main meals.",
        benefitBn: "শরীরকে রিফ্রেশ করে",
        benefitEn: "Refreshes your body",
        imageKind: "balanced-meal"
      }
    ];
  }
  
  if (id.includes("rice") || id.includes("carb") || id.includes("bhat")) {
    return [
      {
        day: 1,
        titleBn: "ভাতের পরিমাণ কমান",
        titleEn: "Reduce rice portion",
        suggestionBn: "আজকের প্লেটে ভাতের পরিমাণ এক-তৃতীয়াংশ কমিয়ে দিন।",
        suggestionEn: "Reduce your rice portion by one-third today.",
        benefitBn: "রক্তে শর্করার মাত্রা ঠিক রাখে",
        benefitEn: "Keeps blood sugar stable",
        imageKind: "rice-balance"
      },
      {
        day: 2,
        titleBn: "প্রোটিন যোগ করুন",
        titleEn: "Add protein",
        suggestionBn: "ভাতের সমপরিমাণ বা তার চেয়ে বেশি মাছ বা ডাল প্লেটে রাখুন।",
        suggestionEn: "Ensure fish or dal portion is equal to or larger than rice.",
        benefitBn: "দীর্ঘক্ষণ পেট ভরা রাখতে সাহায্য করে",
        benefitEn: "Helps keep you full longer",
        imageKind: "egg"
      },
      {
        day: 3,
        titleBn: "লাল চালের ভাত",
        titleEn: "Brown rice option",
        suggestionBn: "সম্ভব হলে সাদা ভাতের বদলে লাল চালের ভাত (Brown Rice) ট্রাই করুন।",
        suggestionEn: "Try brown rice instead of white rice if possible.",
        benefitBn: "ধীরে ধীরে এনার্জি রিলিজ করে",
        benefitEn: "Releases energy slowly",
        imageKind: "brown-rice"
      },
      {
        day: 4,
        titleBn: "বেশি সবজি",
        titleEn: "More vegetables",
        suggestionBn: "ভাতের চেয়ে সবজির পরিমাণ দ্বিগুণ করুন।",
        suggestionEn: "Ensure the vegetable portion is double the rice portion.",
        benefitBn: "কম ক্যালরি ও বেশি ফাইবার",
        benefitEn: "Low calories, high fiber",
        imageKind: "vegetables"
      },
      {
        day: 5,
        titleBn: "রুটি ট্রাই করুন",
        titleEn: "Try Roti",
        suggestionBn: "রাতে ভাতের বদলে দুটি লাল আটার রুটি খান।",
        suggestionEn: "Have two whole wheat rotis instead of rice at night.",
        benefitBn: "ভালো ফাইবার যুক্ত কার্বোহাইড্রেট",
        benefitEn: "Good complex carbs with fiber",
        imageKind: "roti"
      },
      {
        day: 6,
        titleBn: "সালাদ দিয়ে শুরু",
        titleEn: "Start with salad",
        suggestionBn: "ভাত খাওয়ার ৫ মিনিট আগে শসা ও টমেটোর সালাদ খেয়ে নিন।",
        suggestionEn: "Eat a cucumber and tomato salad 5 mins before rice.",
        benefitBn: "অতিরিক্ত ভাত খাওয়া প্রতিরোধ করে",
        benefitEn: "Prevents overeating rice",
        imageKind: "cucumber"
      },
      {
        day: 7,
        titleBn: "ব্যালেন্সড প্লেট ফর্মুলা",
        titleEn: "Balanced plate formula",
        suggestionBn: "ভাতের প্লেটের অর্ধেক সবজি, এক-চতুর্থাংশ প্রোটিন ও এক-চতুর্থাংশ ভাত রাখুন।",
        suggestionEn: "Fill half plate with veggies, 1/4 with protein, and 1/4 with rice.",
        benefitBn: "পারফেক্ট পুষ্টি ব্যালেন্স",
        benefitEn: "Perfect nutritional balance",
        imageKind: "balanced-meal"
      }
    ];
  }
  
  if (id.includes("hydration") || id.includes("water") || id.includes("constipation") || id.includes("pani")) {
    return [
      {
        day: 1,
        titleBn: "সকালে এক গ্লাস পানি",
        titleEn: "Morning water",
        suggestionBn: "ঘুম থেকে উঠে খালি পেটে এক গ্লাস কুসুম গরম পানি পান করুন।",
        suggestionEn: "Drink a glass of warm water on an empty stomach after waking up.",
        benefitBn: "মেটাবলিজম সক্রিয় করে",
        benefitEn: "Activates metabolism",
        imageKind: "water"
      },
      {
        day: 2,
        titleBn: "ডাল যোগ করুন",
        titleEn: "Add lentils",
        suggestionBn: "আজকের দুপুরে বা রাতে ঘন ডাল খান।",
        suggestionEn: "Have a bowl of thick dal with lunch or dinner.",
        benefitBn: "ফাইবার সরবরাহ বাড়ায়",
        benefitEn: "Increases fiber supply",
        imageKind: "dal"
      },
      {
        day: 3,
        titleBn: "সবুজ শাক",
        titleEn: "Green leafy veggies",
        suggestionBn: "দুপুরের খাবারে লাল শাক বা পুই শাক রাখুন।",
        suggestionEn: "Include red amaranth or pui shak in lunch.",
        benefitBn: "কোষ্ঠকাঠিন্য দূর করতে সাহায্য করে",
        benefitEn: "Helps relieve constipation",
        imageKind: "leafy-greens"
      },
      {
        day: 4,
        titleBn: "মিক্সড সবজি তরকারি",
        titleEn: "Mixed vegetable curry",
        suggestionBn: "পেঁপে, লাউ ও মিষ্টি কুমড়া দিয়ে তৈরি ঝোল তরকারি খান।",
        suggestionEn: "Eat a light curry made with papaya, bottle gourd, and pumpkin.",
        benefitBn: "সহজ পাচ্য ও পানিসমৃদ্ধ",
        benefitEn: "Easy to digest and hydrating",
        imageKind: "vegetables"
      },
      {
        day: 5,
        titleBn: "ফল ও ফাইবার",
        titleEn: "Fruit & fiber",
        suggestionBn: "নাশতায় একটি কলা বা পাকা পেঁপে খান।",
        suggestionEn: "Eat a banana or ripe papaya for snacks.",
        benefitBn: "স্বাভাবিক বাওয়েল মুভমেন্টে সাহায্য করে",
        benefitEn: "Promotes natural bowel movement",
        imageKind: "fruits"
      },
      {
        day: 6,
        titleBn: "লেবু বা ডাবের পানি",
        titleEn: "Lemon or coconut water",
        suggestionBn: "আজকে মিষ্টি পানীয়ের বদলে লেবুর শরবত বা ডাবের পানি খান।",
        suggestionEn: "Choose lemon water or coconut water instead of sweet drinks.",
        benefitBn: "ইলেক্ট্রোলাইট ব্যালেন্স বজায় রাখে",
        benefitEn: "Maintains electrolyte balance",
        imageKind: "water"
      },
      {
        day: 7,
        titleBn: "৮ গ্লাস পানির লক্ষ্য",
        titleEn: "8 glasses water goal",
        suggestionBn: "সারাদিনে প্রতিটি খাবারের ৩০ মিনিট আগে ও পরে পানি পান করুন।",
        suggestionEn: "Drink water 30 minutes before and after each meal today.",
        benefitBn: "পরিপূর্ণ হাইড্রেশন নিশ্চিত করে",
        benefitEn: "Ensures complete hydration",
        imageKind: "water"
      }
    ];
  }
  
  if (id.includes("budget") || id.includes("sosta") || id.includes("cheap")) {
    return [
      {
        day: 1,
        titleBn: "ডালই সেরা",
        titleEn: "Dal is great",
        suggestionBn: "আজকের প্রোটিনের উৎস হিসেবে মসুর বা মুগ ডাল খান।",
        suggestionEn: "Have red lentils or mug dal as your primary protein today.",
        benefitBn: "স্বল্প খরচে ভালো মানের প্রোটিন",
        benefitEn: "Affordable quality protein",
        imageKind: "dal"
      },
      {
        day: 2,
        titleBn: "ডিম একটি আদর্শ খাবার",
        titleEn: "Egg - the perfect food",
        suggestionBn: "দুপুরের খাবারে একটি সেদ্ধ ডিম যোগ করুন।",
        suggestionEn: "Add a boiled egg to your lunch.",
        benefitBn: "সবচেয়ে সাশ্রয়ী প্রথম শ্রেণীর প্রোটিন",
        benefitEn: "Most affordable first-class protein",
        imageKind: "egg"
      },
      {
        day: 3,
        titleBn: "মৌসুমী শাক",
        titleEn: "Seasonal leafy greens",
        suggestionBn: "বাজারে সবচেয়ে সাশ্রয়ী মৌসুমী শাক (যেমন ডাটা বা কলমি শাক) কিনে রান্না করুন।",
        suggestionEn: "Cook the most affordable seasonal greens (like data or kolmi shak).",
        benefitBn: "কম খরচে প্রচুর ফাইবার ও আয়রন",
        benefitEn: "High fiber and iron at low cost",
        imageKind: "leafy-greens"
      },
      {
        day: 4,
        titleBn: "ছোট মাছ",
        titleEn: "Small fish",
        suggestionBn: "বড় মাছের বদলে সাশ্রয়ী ছোট মলা বা পুঁটি মাছ রান্না করুন।",
        suggestionEn: "Try small local fish like mola or puti instead of big fish.",
        benefitBn: "ক্যালসিয়াম ও পুষ্টিতে ভরপুর",
        benefitEn: "Rich in calcium and micronutrients",
        imageKind: "small-fish"
      },
      {
        day: 5,
        titleBn: "আলু ও ডিমের ঝোল",
        titleEn: "Potato & egg curry",
        suggestionBn: "কম খরচে আলু ও ডিমের হালকা ঝোল রান্না করে ভাত দিয়ে খান।",
        suggestionEn: "Enjoy a simple low-cost potato and egg curry with rice.",
        benefitBn: "সহজ ও সাশ্রয়ী পুষ্টি",
        benefitEn: "Simple and budget-friendly nutrition",
        imageKind: "egg"
      },
      {
        day: 6,
        titleBn: "মুড়ি ও ছোলা নাস্তা",
        titleEn: "Puffed rice & chickpea snack",
        suggestionBn: "বাইরের ভাজা পোড়া না কিনে ঘরে বানানো ছোলা ও মুড়ি খান।",
        suggestionEn: "Have homemade boiled chickpeas and puffed rice instead of buying snacks.",
        benefitBn: "পকেট ও পেট দুইই ভালো থাকে",
        benefitEn: "Saves money and supports digestion",
        imageKind: "healthy-snack"
      },
      {
        day: 7,
        titleBn: "স্বল্প বাজেটে ব্যালেন্সড প্লেট",
        titleEn: "Budget balanced plate",
        suggestionBn: "ভাত, ডাল, ডিম ভাজি এবং শাক দিয়ে দুপুরের খাবার সাজান।",
        suggestionEn: "Serve rice, lentils, a fried/boiled egg, and greens for lunch.",
        benefitBn: "কম খরচে সম্পূর্ণ পুষ্টি",
        benefitEn: "Complete nutrition on a low budget",
        imageKind: "balanced-meal"
      }
    ];
  }
  
  // Default fallback (nudge-default-balance etc.)
  return [
    {
      day: 1,
      titleBn: "ডাল যোগ করুন",
      titleEn: "Add lentils",
      suggestionBn: "ভাতের সাথে এক বাটি ডাল খান।",
      suggestionEn: "Have a bowl of dal with your rice.",
      benefitBn: "ফাইবার ও প্রোটিন বাড়ায়",
      benefitEn: "Adds fiber and protein",
      imageKind: "dal"
    },
    {
      day: 2,
      titleBn: "লাল শাক যোগ করুন",
      titleEn: "Add red amaranth",
      suggestionBn: "দুপুরে খাবারের সাথে লাল শাক বা অন্য শাক রাখুন।",
      suggestionEn: "Include red amaranth or other leafy greens with lunch.",
      benefitBn: "হজম শক্তি বৃদ্ধি করে",
      benefitEn: "Boosts digestion",
      imageKind: "lal-shak"
    },
    {
      day: 3,
      titleBn: "সবজি মিক্স করুন",
      titleEn: "Mix vegetables",
      suggestionBn: "আপনার প্লেটের অর্ধেক অংশ সবজি দিয়ে পূরণ করুন।",
      suggestionEn: "Fill half of your plate with mixed vegetables.",
      benefitBn: "ভিটামিন ও ফাইবার সরবরাহ করে",
      benefitEn: "Provides vitamins and fiber",
      imageKind: "mixed-vegetables"
    },
    {
      day: 4,
      titleBn: "ফল খান",
      titleEn: "Eat a fruit",
      suggestionBn: "বিকেলে নাশতায় একটি পেয়ারা বা কলা খান।",
      suggestionEn: "Eat a guava or banana as an afternoon snack.",
      benefitBn: "মিষ্টির ক্রেভিং কমায় ও ফাইবার দেয়",
      benefitEn: "Reduces sweet cravings and adds fiber",
      imageKind: "fruits"
    },
    {
      day: 5,
      titleBn: "ভাজা পোড়া কমান",
      titleEn: "Reduce fried snacks",
      suggestionBn: "সিংগারা-সমুচার বদলে মুড়ি বা ভাজাহীন ছোলা বুট খান।",
      suggestionEn: "Swap shingara/samosa for puffed rice or boiled chickpeas.",
      benefitBn: "অতিরিক্ত ক্যালরি ও ক্ষতিকর ফ্যাট কমায়",
      benefitEn: "Reduces extra calories and unhealthy fats",
      imageKind: "healthy-snack"
    },
    {
      day: 6,
      titleBn: "পর্যাপ্ত পানি",
      titleEn: "Enough water",
      suggestionBn: "সারাদিনে ৮-১০ গ্লাস পানি পান নিশ্চিত করুন।",
      suggestionEn: "Ensure 8-10 glasses of water throughout the day.",
      benefitBn: "ফাইবার হজমে সাহায্য করে",
      benefitEn: "Helps digest fiber",
      imageKind: "water"
    },
    {
      day: 7,
      titleBn: "ব্যালেন্সড দেশি প্লেট",
      titleEn: "Balanced Deshi plate",
      suggestionBn: "১/৪ ভাত, ১/৪ প্রোটিন এবং ১/২ অংশ সবজি দিয়ে প্লেট সাজান।",
      suggestionEn: "Fill 1/4 with rice, 1/4 with protein, and 1/2 with veggies.",
      benefitBn: "দীর্ঘক্ষণ এনার্জি বজায় রাখে",
      benefitEn: "Provides sustained energy",
      imageKind: "balanced-meal"
    }
  ];
}

export function enrichNudgeWithPlanAndDetails(nudge: SmartHealthNudge): SmartHealthNudge {
  const result = { ...nudge };
  
  if (!result.sevenDayPlan || result.sevenDayPlan.length !== 7) {
    result.sevenDayPlan = getFallbackSevenDayPlan(result.id);
  }
  
  if (!result.checkInQuestionBn || !result.checkInQuestionEn) {
    const id = result.id.toLowerCase();
    if (id.includes("low-fiber") || id.includes("fiber")) {
      result.checkInQuestionBn = result.checkInQuestionBn || "দাদু ভাই, কালকে কি লাল শাক/সবজি খেয়েছো?";
      result.checkInQuestionEn = result.checkInQuestionEn || "Did you add any vegetables yesterday?";
    } else if (id.includes("fried") || id.includes("oil") || id.includes("fat")) {
      result.checkInQuestionBn = result.checkInQuestionBn || "দাদু ভাই, কালকে কি ভাজা-পোড়া খাবার এড়িয়ে চলেছো?";
      result.checkInQuestionEn = result.checkInQuestionEn || "Were you able to avoid oily fried food yesterday?";
    } else if (id.includes("rice") || id.includes("carb") || id.includes("bhat")) {
      result.checkInQuestionBn = result.checkInQuestionBn || "দাদু ভাই, কালকে ভাতের পোর্শন কি একটু ব্যালেন্স করেছো?";
      result.checkInQuestionEn = result.checkInQuestionEn || "Did you manage to balance your rice portion yesterday?";
    } else if (id.includes("hydration") || id.includes("water") || id.includes("constipation") || id.includes("pani")) {
      result.checkInQuestionBn = result.checkInQuestionBn || "দাদু ভাই, কালকে কি পর্যাপ্ত পানি পান করেছো?";
      result.checkInQuestionEn = result.checkInQuestionEn || "Did you drink enough water yesterday?";
    } else if (id.includes("budget") || id.includes("sosta") || id.includes("cheap")) {
      result.checkInQuestionBn = result.checkInQuestionBn || "দাদু ভাই, কালকে কি ডিম বা ডাল জাতীয় প্রোটিন খেয়েছো?";
      result.checkInQuestionEn = result.checkInQuestionEn || "Did you add egg or lentils to your food yesterday?";
    } else {
      result.checkInQuestionBn = result.checkInQuestionBn || "দাদু ভাই, কালকে কি ব্যালেন্সড প্লেট ফলো করতে পেরেছো?";
      result.checkInQuestionEn = result.checkInQuestionEn || "Did you follow a balanced plate yesterday?";
    }
  }

  if (!result.exerciseSuggestionBn || !result.exerciseSuggestionEn) {
    const id = result.id.toLowerCase();
    if (id.includes("low-fiber") || id.includes("fiber")) {
      result.exerciseSuggestionBn = result.exerciseSuggestionBn || "আজকে খাবার শেষে ১৫ মিনিট হাঁটার চেষ্টা করুন।";
      result.exerciseSuggestionEn = result.exerciseSuggestionEn || "Try to walk for 15 minutes after meals today.";
    } else if (id.includes("fried") || id.includes("oil") || id.includes("fat")) {
      result.exerciseSuggestionBn = result.exerciseSuggestionBn || "আজকে ১০ মিনিট হালকা স্ট্রেচিং ট্রাই করতে পারেন।";
      result.exerciseSuggestionEn = result.exerciseSuggestionEn || "Consider trying 10 minutes of light stretching today.";
    } else if (id.includes("rice") || id.includes("carb") || id.includes("bhat")) {
      result.exerciseSuggestionBn = result.exerciseSuggestionBn || "আজকে খাবার পর ১০-১৫ মিনিট হাঁটুন।";
      result.exerciseSuggestionEn = result.exerciseSuggestionEn || "Walk for 10-15 minutes after eating today.";
    } else if (id.includes("hydration") || id.includes("water") || id.includes("constipation") || id.includes("pani")) {
      result.exerciseSuggestionBn = result.exerciseSuggestionBn || "আজকে ১৫ মিনিট ব্রিস্ক ওয়াক করুন।";
      result.exerciseSuggestionEn = result.exerciseSuggestionEn || "Try a 15-minute brisk walk today.";
    } else if (id.includes("budget") || id.includes("sosta") || id.includes("cheap")) {
      result.exerciseSuggestionBn = result.exerciseSuggestionBn || "আজকে অন্তত ১০ মিনিট ঘরের ভেতর সক্রিয় থাকুন।";
      result.exerciseSuggestionEn = result.exerciseSuggestionEn || "Try to stay active inside your home for at least 10 minutes today.";
    } else {
      result.exerciseSuggestionBn = result.exerciseSuggestionBn || "আজকে একটু সক্রিয় থাকার চেষ্টা করুন।";
      result.exerciseSuggestionEn = result.exerciseSuggestionEn || "Try to stay active today.";
    }
  }

  return result;
}

// Simple helper to safely analyze meals
export function generateSmartNudge(
  profile: any,
  recentMeals: MealLog[],
  isDemo: boolean = false
): SmartHealthNudge | null {
  const disclaimerBn = "General nutrition guidance — not medical advice. Doctor er poramorsho nin.";
  const disclaimerEn = "General nutrition guidance — not medical advice. Consult a professional.";

  let rawNudge: SmartHealthNudge | null = null;

  if (isDemo) {
    rawNudge = {
      id: "nudge-demo",
      titleBn: "Sample demo nudge",
      titleEn: "Sample demo nudge",
      messageBn: "Sample data based nudge: dal, shak, and vegetables add korle fiber and meal balance improve hote pare.",
      messageEn: "Sample data based nudge: adding dal, shak, and vegetables can improve fiber and meal balance.",
      benefitBn: "Demo data only.",
      benefitEn: "Demo data only.",
      actionLabelBn: "Bujhte perechi",
      actionLabelEn: "Got it",
      imageKind: "vegetables",
      priority: "high",
      reasonBn: "demo-mode logic search pattern",
      reasonEn: "demo-mode logic search pattern",
      disclaimerBn,
      disclaimerEn,
      isDemo: true,
      checkInQuestionBn: "Dadu bhai, kalke ki vegetables ektu kheyecho?",
      checkInQuestionEn: "Did you manage to eat some vegetables yesterday?",
      exerciseSuggestionBn: "Ajke 10 minute halka walk korun.",
      exerciseSuggestionEn: "Try a light 10-minute walk today."
    };
  } else {
    // Calculate some simple stats over recent meals
    let totalFiber = 0;
    let totalProtein = 0;
    let totalCalories = 0;
    let totalWater = 0;
    
    // Look at today's meals
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysMeals = recentMeals.filter(m => {
      if (!m.logged_at) return false;
      const d = new Date(m.logged_at);
      return d >= today;
    });

    todaysMeals.forEach(m => {
      totalFiber += (m.fiber_g || 0);
      totalProtein += (m.protein_g || 0);
      totalCalories += (m.calories || 0);
      totalWater += (m.water_ml || 0);
    });

    // Example A: Low fiber pattern (if logged some meals but fiber is very low)
    if (todaysMeals.length >= 1 && totalFiber < 10) {
      rawNudge = {
        id: "nudge-low-fiber",
        titleBn: "Ajke lal shak ba shobji add korun",
        titleEn: "Add red amaranth or vegetables today",
        messageBn: "Apnar recent meal pattern e fiber kom mone hocche. Lal shak, dal, ba mixed shobji add korle digestion and fullness support pete paren.",
        messageEn: "Your recent meal pattern seems low in fiber. Adding red amaranth, lentils, or mixed vegetables can support digestion and fullness.",
        benefitBn: "Fiber digestion and fullness support kore.",
        benefitEn: "Fiber supports digestion and keeps you full longer.",
        actionLabelBn: "Pusti-somponno idea dekhun",
        actionLabelEn: "View healthier idea",
        imageKind: "lal-shak",
        priority: "high",
        reasonBn: "Fiber intake ektu kom chilo kisu meal e.",
        reasonEn: "Fiber intake was slightly low in recent meals.",
        disclaimerBn,
        disclaimerEn,
        checkInQuestionBn: "Dadu bhai, kalke ki lal shak/shobji kheyecho?",
        checkInQuestionEn: "Did you add any vegetables yesterday?",
        exerciseSuggestionBn: "Ajke ektu beksi walk try korun.",
        exerciseSuggestionEn: "Try walking a bit more today."
      };
    }
    // Example D: High calories but low protein (approximate "high rice/low protein" pattern)
    else if (todaysMeals.length >= 1 && totalCalories > 1000 && totalProtein < 30) {
      rawNudge = {
        id: "nudge-rice-balance",
        titleBn: "Bhat er portion balance korun",
        titleEn: "Balance your rice portion",
        messageBn: "Plate e bhat beshi hole energy intake bere jete pare. Bhat er sathe dal, dim, mach, murgi ba shobji add korle balance better hoy.",
        messageEn: "Too much rice can lead to high energy intake. Balancing it with lentils, eggs, fish, or vegetables helps maintain a healthy plate.",
        benefitBn: "Protein + fiber plate ke more balanced kore.",
        benefitEn: "Protein and fiber make your plate more balanced.",
        actionLabelBn: "Meal balance korun",
        actionLabelEn: "Balance your plate",
        imageKind: "rice-balance",
        priority: "medium",
        reasonBn: "Protein er tulonay bhat ektu beshi chilo.",
        reasonEn: "Rice portion was high compared to protein intake.",
        disclaimerBn,
        disclaimerEn,
        checkInQuestionBn: "Dadu bhai, kalke bhat er sathe ektu protein ba shobji add korte perecho?",
        checkInQuestionEn: "Did you balance your rice portion yesterday?",
        exerciseSuggestionBn: "Halka stretching try korte paren.",
        exerciseSuggestionEn: "Consider some light stretching today."
      };
    }
    // Example B: Generic hydration/fiber reminder if we haven't hit others
    else if (todaysMeals.length >= 2 && totalWater < 1000) {
      rawNudge = {
        id: "nudge-hydration-fiber",
        titleBn: "Pani + fiber reminder",
        titleEn: "Water + fiber reminder",
        messageBn: "Apnar profile/meal pattern theke mone hocche, pani and fiber beshi khele digestion support hobe. Ajke pani intake ektu socheton thakun.",
        messageEn: "Based on your pattern, more water and fiber can support your health. Be mindful of your water intake today.",
        benefitBn: "Hydration and fiber bowel movement support korte pare.",
        benefitEn: "Hydration and fiber support regular bowel movements.",
        actionLabelBn: "Pani pan korun",
        actionLabelEn: "Drink some water",
        imageKind: "water",
        priority: "medium",
        reasonBn: "Pani intake ektu kom chilo kisu meal e.",
        reasonEn: "Water intake was slightly low recently.",
        disclaimerBn,
        disclaimerEn,
        checkInQuestionBn: "Dadu bhai, kalke pani intake ektu barate perecho?",
        checkInQuestionEn: "Did you drink more water yesterday?",
        exerciseSuggestionBn: "10 minute brisk walk try korun.",
        exerciseSuggestionEn: "Try a 10-minute brisk walk today."
      };
    }
    // Default / Empty State
    else {
      rawNudge = {
        id: "nudge-default-balance",
        titleBn: "Aktu balanced Deshi plate diye shuru korun",
        titleEn: "Start with a balanced Deshi plate",
        messageBn: "Bhat ba ruti er sathe dal/protein and shobji add korle meal balance better hoy.",
        messageEn: "Adding lentils, protein, and vegetables to your rice or roti makes for a more balanced meal.",
        benefitBn: "Balanced meal sustained energy provide kore.",
        benefitEn: "Balanced meals provide sustained energy throughout the day.",
        actionLabelBn: "Poroborti meal plan korun",
        actionLabelEn: "Plan your next meal",
        imageKind: "generic",
        priority: "low",
        reasonBn: "General wellness recommendation.",
        reasonEn: "General wellness recommendation.",
        disclaimerBn,
        disclaimerEn,
        checkInQuestionBn: "Dadu bhai, kalke ki balanced plate follow korte perecho?",
        checkInQuestionEn: "Did you have a balanced plate yesterday?",
        exerciseSuggestionBn: "Ajke ektu active thakar chesta korun.",
        exerciseSuggestionEn: "Try to stay active today."
      };
    }
  }

  return rawNudge ? enrichNudgeWithPlanAndDetails(rawNudge) : null;
}

export type NudgeFeedbackState = {
  date: string;
  completedNudgeIds: string[];
  notUsefulNudgeIds: string[];
  remindedLater: {
    [nudgeId: string]: number;
  };
  completionCount: number;
};

const FEEDBACK_STATE_KEY = "desi-digest:nudge-feedback:v1";

export function getFeedbackState(): NudgeFeedbackState {
  if (typeof window === "undefined") {
    return {
      date: "",
      completedNudgeIds: [],
      notUsefulNudgeIds: [],
      remindedLater: {},
      completionCount: 0
    };
  }
  
  const today = new Date().toISOString().split("T")[0];
  const stored = localStorage.getItem(FEEDBACK_STATE_KEY);
  
  if (stored) {
    try {
      const state = JSON.parse(stored) as NudgeFeedbackState;
      if (state.date === today) {
        return state;
      }
      // Date changed: Reset daily but preserve completionCount
      return {
        date: today,
        completedNudgeIds: [],
        notUsefulNudgeIds: [],
        remindedLater: {},
        completionCount: state.completionCount || 0
      };
    } catch (e) {
      // ignore parse error
    }
  }
  
  return {
    date: today,
    completedNudgeIds: [],
    notUsefulNudgeIds: [],
    remindedLater: {},
    completionCount: 0
  };
}

export function saveFeedbackState(state: NudgeFeedbackState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FEEDBACK_STATE_KEY, JSON.stringify(state));
}

export function recordFeedbackCompleted(nudgeId: string) {
  const state = getFeedbackState();
  if (!state.completedNudgeIds.includes(nudgeId)) {
    state.completedNudgeIds.push(nudgeId);
    state.completionCount += 1;
    saveFeedbackState(state);
  }
}

export function recordFeedbackRemindLater(nudgeId: string) {
  const state = getFeedbackState();
  state.remindedLater[nudgeId] = Date.now();
  saveFeedbackState(state);
}

export function recordFeedbackNotUseful(nudgeId: string) {
  const state = getFeedbackState();
  if (!state.notUsefulNudgeIds.includes(nudgeId)) {
    state.notUsefulNudgeIds.push(nudgeId);
    saveFeedbackState(state);
  }
}

export function isNudgeRestricted(nudgeId: string): boolean {
  const state = getFeedbackState();
  
  if (state.completedNudgeIds.includes(nudgeId)) {
    return true;
  }
  
  if (state.notUsefulNudgeIds.includes(nudgeId)) {
    return true;
  }
  
  const remindedAt = state.remindedLater[nudgeId];
  if (remindedAt) {
    const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
    if (Date.now() - remindedAt < FOUR_HOURS_MS) {
      return true;
    }
  }
  
  return false;
}

export function shouldShowNudge(nudgeId: string): boolean {
  if (typeof window === "undefined") return false;
  
  if (isNudgeRestricted(nudgeId)) {
    return false;
  }
  
  const key = "desi-digest:nudge-state:v1";
  const stored = localStorage.getItem(key);
  
  const todayDate = new Date().toISOString().split("T")[0];
  
  let state = {
    date: todayDate,
    shownCount: 0,
    lastShownAt: 0,
    dismissedNudgeIds: [] as string[]
  };
  
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.date === todayDate) {
        state = { ...state, ...parsed };
      }
    } catch (e) {
      // ignore parsing error
    }
  }
  
  // Has it been dismissed?
  if (state.dismissedNudgeIds.includes(nudgeId)) {
    return false;
  }
  
  // Max 6 times per day
  if (state.shownCount >= 6) {
    return false;
  }
  
  // Min 4 hours gap
  const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
  const now = Date.now();
  if (state.lastShownAt > 0 && (now - state.lastShownAt) < FOUR_HOURS_MS) {
    return false;
  }
  
  return true;
}

export function recordNudgeShown(nudgeId: string) {
  if (typeof window === "undefined") return;
  const key = "desi-digest:nudge-state:v1";
  const stored = localStorage.getItem(key);
  
  const todayDate = new Date().toISOString().split("T")[0];
  let state = {
    date: todayDate,
    shownCount: 0,
    lastShownAt: 0,
    dismissedNudgeIds: [] as string[]
  };
  
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.date === todayDate) {
        state = { ...state, ...parsed };
      }
    } catch (e) {
      // ignore
    }
  }
  
  state.shownCount += 1;
  state.lastShownAt = Date.now();
  
  localStorage.setItem(key, JSON.stringify(state));
}

export function dismissNudge(nudgeId: string) {
  if (typeof window === "undefined") return;
  const key = "desi-digest:nudge-state:v1";
  const stored = localStorage.getItem(key);
  
  const todayDate = new Date().toISOString().split("T")[0];
  let state = {
    date: todayDate,
    shownCount: 0,
    lastShownAt: 0,
    dismissedNudgeIds: [] as string[]
  };
  
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.date === todayDate) {
        state = { ...state, ...parsed };
      }
    } catch (e) {
      // ignore
    }
  }
  
  if (!state.dismissedNudgeIds.includes(nudgeId)) {
    state.dismissedNudgeIds.push(nudgeId);
  }
  
  localStorage.setItem(key, JSON.stringify(state));
}

const UNSAFE_WORDS = [
  "diagnosis", "cure", "treatment", "guaranteed", 
  "apnar diabetes ache", "apnar rog ache", "rog dhora porse", 
  "medical treatment", "clinically proven", 
  "gemini", "openrouter", "edamam", "api", "provider", "model", 
  "fallback", "cache", "quota", "429", "404"
];

export function sanitizeNudgeText(text: string): string {
  if (!text) return "";
  let sanitized = text;
  for (const word of UNSAFE_WORDS) {
    const regex = new RegExp(word, "gi");
    sanitized = sanitized.replace(regex, "[nutrition guidance]");
  }
  return sanitized;
}

export function validateNudgeSafety(nudge: SmartHealthNudge): boolean {
  try {
    const allText = [
      nudge.titleBn,
      nudge.titleEn,
      nudge.messageBn,
      nudge.messageEn,
      nudge.benefitBn,
      nudge.benefitEn,
      nudge.actionLabelBn,
      nudge.actionLabelEn,
      nudge.reasonBn,
      nudge.reasonEn,
      nudge.checkInQuestionBn || "",
      nudge.checkInQuestionEn || "",
      ...(nudge.sevenDayPlan || []).flatMap(p => [p.titleBn, p.titleEn, p.suggestionBn, p.suggestionEn, p.benefitBn, p.benefitEn])
    ].join(" ").toLowerCase();

    for (const word of UNSAFE_WORDS) {
      if (allText.includes(word.toLowerCase())) {
        return false;
      }
    }

    if (!nudge.disclaimerEn || !nudge.disclaimerEn.includes("not medical advice")) {
      return false;
    }

    if (nudge.sevenDayPlan && nudge.sevenDayPlan.length !== 7) {
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
}

// ==========================================
// HABIT LOOP STATE MANAGEMENT
// ==========================================

export type HabitAnswer = "yes" | "partly" | "no" | "skip";

export type HabitDay = {
  date: string;
  nudgeId: string;
  imageKind: NudgeImageKind;
  titleBn: string;
  titleEn: string;
  checkInQuestionBn: string;
  checkInQuestionEn: string;
  answer?: HabitAnswer;
  answeredAt?: number;
};

export type HabitState = {
  activePlanId: string;
  startedAt: string;
  currentDay: number;
  days: HabitDay[];
  lastPopupDate: string;
  lastCheckInDate: string;
  sevenDaySummaryShown?: boolean;
};

const HABIT_STATE_KEY = "desi-digest:nanumoni-habit-loop:v1";

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function getHabitState(): HabitState | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(HABIT_STATE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as HabitState;
  } catch (e) {
    return null;
  }
}

export function saveHabitState(state: HabitState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HABIT_STATE_KEY, JSON.stringify(state));
}

export function initOrUpdateHabitState(nudge: SmartHealthNudge) {
  const today = getTodayStr();
  let state = getHabitState();

  if (!state) {
    state = {
      activePlanId: nudge.id,
      startedAt: today,
      currentDay: 1,
      days: [],
      lastPopupDate: "",
      lastCheckInDate: "",
      sevenDaySummaryShown: false,
    };
  }

  // If the last popup date was today, we already added today's nudge to the cycle.
  if (state.lastPopupDate !== today) {
    state.lastPopupDate = today;
    
    // Add today's nudge to days array if it's not already there for today
    const existingIndex = state.days.findIndex(d => d.date === today);
    const newDay: HabitDay = {
      date: today,
      nudgeId: nudge.id,
      imageKind: nudge.imageKind,
      titleBn: nudge.titleBn,
      titleEn: nudge.titleEn,
      checkInQuestionBn: nudge.checkInQuestionBn || "Dadu bhai, kalke ki suggestion follow korte perecho?",
      checkInQuestionEn: nudge.checkInQuestionEn || "Did you follow yesterday's tip?"
    };

    if (existingIndex >= 0) {
      // update existing
      state.days[existingIndex] = { ...state.days[existingIndex], ...newDay };
    } else {
      state.days.push(newDay);
      // Increment currentDay if we added a new distinct day
      if (state.days.length > 1) {
         state.currentDay = state.days.length;
      }
    }
  }

  saveHabitState(state);
}

export function getPendingCheckIn(): HabitDay | null {
  const state = getHabitState();
  if (!state || state.days.length === 0) return null;

  const today = getTodayStr();

  // We want to check in on the most recent day that is NOT today, and has NO answer yet.
  // Generally, that's yesterday (or the last day they saw a popup).
  const pendingDays = state.days.filter(d => d.date !== today && !d.answer);
  if (pendingDays.length > 0) {
    // Return the latest pending day
    return pendingDays[pendingDays.length - 1];
  }
  return null;
}

export function recordCheckIn(date: string, answer: HabitAnswer) {
  const state = getHabitState();
  if (!state) return;

  const dayIndex = state.days.findIndex(d => d.date === date);
  if (dayIndex >= 0) {
    state.days[dayIndex].answer = answer;
    state.days[dayIndex].answeredAt = Date.now();
    state.lastCheckInDate = getTodayStr();
    saveHabitState(state);
  }
}

export function shouldShowSevenDaySummary(): boolean {
  const state = getHabitState();
  if (!state) return false;
  if (state.sevenDaySummaryShown) return false;
  
  // Only show if we have 7 days recorded, AND all days up to the 7th have answers or we are past day 7
  if (state.days.length >= 7) {
    // For MVP, just show it if we hit 7 days.
    return true;
  }
  return false;
}

export function markSevenDaySummaryShown() {
  const state = getHabitState();
  if (state) {
    state.sevenDaySummaryShown = true;
    saveHabitState(state);
  }
}
