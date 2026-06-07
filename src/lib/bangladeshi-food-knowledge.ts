export type FoodCategory =
  | "staples"
  | "proteins"
  | "vegetables_shak"
  | "snacks_fried"
  | "dairy_sweets"
  | "drinks";

export type FoodItem = {
  canonicalName: string;
  banglaName: string;
  banglishName: string;
  aliases: string[];
  category: FoodCategory;
  nutritionRole: string;
  healthNotes: string;
  servingContext: string;
  betterPrep: string;
  worsePrep: string;
  nutrients: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    iron?: number;
    sodium?: number;
  };
  glycemicImpact: "low" | "medium" | "high";
  studentBudgetFriendly: boolean;
};

export const BANGLADESHI_FOODS: FoodItem[] = [
  // Staples
  {
    canonicalName: "Bhat (White Rice)",
    banglaName: "ভাত",
    banglishName: "bhat",
    aliases: ["bhat", "rice", "white rice", "ভাত", "সাদা ভাত"],
    category: "staples",
    nutritionRole: "Carbohydrates, Energy",
    healthNotes: "High glycemic index, can spike blood sugar. Eat in controlled portions, paired with dal and greens.",
    servingContext: "Main staple for lunch and dinner, eaten with curries.",
    betterPrep: "Boiled and drained.",
    worsePrep: "Fried with oil (fried rice) or cooked as rich pilaf.",
    nutrients: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 },
    glycemicImpact: "high",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Ruti (Roti)",
    banglaName: "রুটি",
    banglishName: "ruti",
    aliases: ["ruti", "roti", "atta ruti", "chapati", "রুটি", "আটার রুটি"],
    category: "staples",
    nutritionRole: "Complex Carbohydrates, Fiber, B Vitamins",
    healthNotes: "Better fiber content and lower glycemic spike than white rice. Highly recommended for diabetics.",
    servingContext: "Breakfast staple, eaten with bhaji, dal, or egg.",
    betterPrep: "Dry roasted on a tawa without oil.",
    worsePrep: "Fried with oil or ghee.",
    nutrients: { calories: 275, protein: 10, carbs: 55, fat: 1.5, fiber: 7 },
    glycemicImpact: "medium",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Paratha",
    banglaName: "পরোটা",
    banglishName: "paratha",
    aliases: ["paratha", "porota", "parota", "পরোটা", "পরটা"],
    category: "staples",
    nutritionRole: "Fats, Carbohydrates, Energy",
    healthNotes: "High in calories and fat due to oil/ghee. Limit consumption, especially for heart health and weight loss.",
    servingContext: "Popular breakfast or street food, eaten with beef or bhaji.",
    betterPrep: "Cooked with minimal oil.",
    worsePrep: "Layered with excess ghee and deep-fried.",
    nutrients: { calories: 350, protein: 7, carbs: 46, fat: 15, fiber: 3 },
    glycemicImpact: "high",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Khichuri",
    banglaName: "খিচুড়ি",
    banglishName: "khichuri",
    aliases: ["khichuri", "khichri", "khicuri", "খিচুড়ি", "খিচুড়ি"],
    category: "staples",
    nutritionRole: "Carbohydrates, Protein, Fiber",
    healthNotes: "A complete protein source due to rice-lentil combination. Portion control is needed as it can be calorie-dense.",
    servingContext: "Common in rainy days, festivals, or quick home meals.",
    betterPrep: "Cooked with minimal oil, loaded with vegetables (Sobji Khichuri).",
    worsePrep: "Bhuna khichuri with excess oil/ghee and heavy meat.",
    nutrients: { calories: 180, protein: 6, carbs: 32, fat: 3, fiber: 4 },
    glycemicImpact: "medium",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Biryani / Tehari / Kacchi",
    banglaName: "বিরিয়ানি",
    banglishName: "biryani",
    aliases: ["biryani", "biriyani", "tehari", "tehari", "kacchi", "polao", "pulao", "বিরিয়ানি", "তেহারি", "কাচ্চি", "পোলাও"],
    category: "staples",
    nutritionRole: "Fats, Carbohydrates, Protein",
    healthNotes: "Very rich, high in saturated fats and sodium. Limit to special occasions.",
    servingContext: "Festive meals, weddings, Eid, and weekend treats.",
    betterPrep: "Made with lean meat and reduced oil/ghee.",
    worsePrep: "Deeply oil-soaked rice with fatty mutton pieces and aloo.",
    nutrients: { calories: 220, protein: 10, carbs: 25, fat: 9, fiber: 1 },
    glycemicImpact: "high",
    studentBudgetFriendly: false,
  },

  // Proteins
  {
    canonicalName: "Dim (Egg)",
    banglaName: "ডিম",
    banglishName: "dim",
    aliases: ["dim", "egg", "boiled egg", "egg fry", "ডিম", "সেদ্ধ ডিম", "ডিম ভাজি"],
    category: "proteins",
    nutritionRole: "Complete Protein, Choline, Vitamin D",
    healthNotes: "Excellent, highly affordable source of complete protein. The yolk contains healthy fats and vitamins.",
    servingContext: "Eaten at breakfast, lunch, or dinner. Very versatile.",
    betterPrep: "Boiled or poached with minimal oil.",
    worsePrep: "Deep fried or cooked in heavy oily curries.",
    nutrients: { calories: 140, protein: 12.5, carbs: 0.6, fat: 9.5, fiber: 0 },
    glycemicImpact: "low",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Dal (Lentils)",
    banglaName: "ডাল",
    banglishName: "dal",
    aliases: ["dal", "daal", "masoor dal", "mug dal", "mung dal", "lentils", "ডাল", "মসুর ডাল", "মুগ ডাল"],
    category: "proteins",
    nutritionRole: "Plant Protein, Fiber, Iron, Folate",
    healthNotes: "Very healthy plant protein. High fiber helps manage cholesterol and blood sugar.",
    servingContext: "Eaten daily with rice or roti in almost every Bangladeshi home.",
    betterPrep: "Boiled with spices and thin tempering (patla dal).",
    worsePrep: "Thick dal cooked with excess oil or ghee tempering.",
    nutrients: { calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 8 },
    glycemicImpact: "low",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Mach (Fish)",
    banglaName: "মাছ",
    banglishName: "mach",
    aliases: ["mach", "maach", "fish", "rui", "ilish", "mola", "pabda", "katla", "koi", "pangash", "shutki", "মাছ", "রুই", "ইলিশ", "মলা", "পাঙ্গাস", "শুটকি"],
    category: "proteins",
    nutritionRole: "Protein, Omega-3 Fatty Acids, Vitamin D, Calcium",
    healthNotes: "Excellent source of lean protein. Small fish like mola are rich in Vitamin A and Calcium.",
    servingContext: "Staple protein source, eaten daily at lunch or dinner.",
    betterPrep: "Light curry (jhol) with vegetables or baked/steamed.",
    worsePrep: "Deep fried or cooked in thick oil gravies.",
    nutrients: { calories: 120, protein: 18, carbs: 0, fat: 5, fiber: 0 },
    glycemicImpact: "low",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Murgi (Chicken)",
    banglaName: "মুরগি",
    banglishName: "murgi",
    aliases: ["murgi", "chicken", "murgir mangsho", "মুরগি", "মুরগির মাংস"],
    category: "proteins",
    nutritionRole: "Lean Protein, B Vitamins",
    healthNotes: "Great lean protein source when skinless. Good for muscle gain and weight management.",
    servingContext: "Commonly cooked as curry with potatoes, or roasted.",
    betterPrep: "Skinless chicken cooked in light gravy or grilled.",
    worsePrep: "Deep fried, rich chicken roast, or cooked with excess oil and skin.",
    nutrients: { calories: 165, protein: 25, carbs: 0, fat: 7, fiber: 0 },
    glycemicImpact: "low",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Beef (Goru)",
    banglaName: "গরু",
    banglishName: "goru",
    aliases: ["goru", "beef", "gorur mangsho", "cattle meat", "গরু", "গরুর মাংস"],
    category: "proteins",
    nutritionRole: "Protein, Iron, Zinc, Vitamin B12",
    healthNotes: "Rich in iron and zinc, but high in saturated fat and cholesterol. Limit intake to 1-2 times a week.",
    servingContext: "Cooked for feasts, Eid, or special family meals.",
    betterPrep: "Lean cuts cooked with limited oil, trimming visible fat.",
    worsePrep: "Fatty cuts slow-cooked in thick oil (beef bhuna/kala bhuna).",
    nutrients: { calories: 250, protein: 22, carbs: 0, fat: 17, fiber: 0 },
    glycemicImpact: "low",
    studentBudgetFriendly: false,
  },
  {
    canonicalName: "Chola (Chickpeas)",
    banglaName: "ছোলা",
    banglishName: "chola",
    aliases: ["chola", "chana", "chickpeas", "ছোলা", "চানা"],
    category: "proteins",
    nutritionRole: "Plant Protein, Fiber, Iron",
    healthNotes: "High in fiber and plant protein. Very filling and good for blood sugar control.",
    servingContext: "Staple during Ramadan iftar, also eaten as a healthy snack.",
    betterPrep: "Boiled and tossed with onions, cucumber, and ginger.",
    worsePrep: "Deep fried or cooked with heavy oil and spices (chola bhuna).",
    nutrients: { calories: 164, protein: 9, carbs: 27, fat: 2.6, fiber: 7.6 },
    glycemicImpact: "low",
    studentBudgetFriendly: true,
  },

  // Vegetables & Shak
  {
    canonicalName: "Lal Shak (Red Amaranth)",
    banglaName: "লাল শাক",
    banglishName: "lal shak",
    aliases: ["lal shak", "lalshak", "lal sak", "red amaranth", "লাল শাক", "লালশাক"],
    category: "vegetables_shak",
    nutritionRole: "Iron, Vitamin A, Vitamin C, Folate, Fiber",
    healthNotes: "Exceptional source of iron and Vitamin A. Pair with lemon juice (Vitamin C) to boost iron absorption. Highly budget-friendly.",
    servingContext: "Eaten as a side dish with bhat at lunch.",
    betterPrep: "Lightly stir-fried with minimal oil, garlic, and onions.",
    worsePrep: "Overcooked until mushy, or cooked with excessive oil.",
    nutrients: { calories: 23, protein: 2.2, carbs: 4, fat: 0.3, fiber: 2.5, iron: 3.5 },
    glycemicImpact: "low",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Kolmi Shak (Water Spinach)",
    banglaName: "কলমি শাক",
    banglishName: "kolmi shak",
    aliases: ["kolmi shak", "kolmishak", "komi shak", "komishak", "water spinach", "kolmi sak", "komi sak", "কলমি শাক", "কলমিশাক"],
    category: "vegetables_shak",
    nutritionRole: "Vitamin A, Vitamin C, Calcium, Fiber",
    healthNotes: "Very low calorie, high fiber green. Supports digestive health and is extremely budget-friendly.",
    servingContext: "Stir-fried side dish with rice.",
    betterPrep: "Quickly sautéed with garlic and green chilies.",
    worsePrep: "Oily frying or overcooking.",
    nutrients: { calories: 19, protein: 2, carbs: 3.1, fat: 0.2, fiber: 2.1 },
    glycemicImpact: "low",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Palong Shak (Spinach)",
    banglaName: "পালং শাক",
    banglishName: "palong shak",
    aliases: ["palong shak", "palongshak", "palong sak", "spinach", "পালং শাক", "পালংশাক"],
    category: "vegetables_shak",
    nutritionRole: "Folate, Iron, Magnesium, Vitamin K, Fiber",
    healthNotes: "Nutrient dense leaf, excellent for heart health and muscle function.",
    servingContext: "Winter vegetable, cooked as bhaji or curry with potatoes/fish.",
    betterPrep: "Steamed or cooked with minimal oil.",
    worsePrep: "Cooked with heavy oil and fatty fish heads.",
    nutrients: { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2 },
    glycemicImpact: "low",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Pui Shak (Malabar Spinach)",
    banglaName: "পুঁই শাক",
    banglishName: "pui shak",
    aliases: ["pui shak", "puishak", "pui sak", "malabar spinach", "পুঁই শাক", "পুঁইশাক"],
    category: "vegetables_shak",
    nutritionRole: "Vitamin A, Vitamin C, Calcium, Iron, Fiber",
    healthNotes: "Thick mucilaginous leaves that are excellent for digestion and gut health.",
    servingContext: "Cooked with pumpkin, shrimp, or fish head curry.",
    betterPrep: "Stir-fried with mixed vegetables.",
    worsePrep: "Oily curries with high-fat ingredients.",
    nutrients: { calories: 19, protein: 1.8, carbs: 3.4, fat: 0.3, fiber: 1.5 },
    glycemicImpact: "low",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Lau Shak",
    banglaName: "লাউ শাক",
    banglishName: "lau shak",
    aliases: ["lau shak", "laushak", "lau sak", "bottle gourd leaves", "লাউ শাক", "লাউশাক"],
    category: "vegetables_shak",
    nutritionRole: "Folate, Vitamin C, Potassium, Fiber",
    healthNotes: "Cooling properties, highly folate-rich. Recommended during pregnancy.",
    servingContext: "Cooked as bhaji or thin jhol with potatoes.",
    betterPrep: "Sautéed with light spices.",
    worsePrep: "Heavy oil cooking.",
    nutrients: { calories: 20, protein: 1.9, carbs: 3.2, fat: 0.2, fiber: 1.8 },
    glycemicImpact: "low",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Data Shak",
    banglaName: "ডাঁটা শাক",
    banglishName: "data shak",
    aliases: ["data shak", "datashak", "data sak", "stem amaranth leaves", "ডাঁটা শাক", "ডাঁটাশাক"],
    category: "vegetables_shak",
    nutritionRole: "Calcium, Vitamin C, Fiber",
    healthNotes: "Crunchy stems provide excellent dietary fiber to support digestion.",
    servingContext: "Cooked with light mustard paste or potatoes.",
    betterPrep: "Cooked in light broths.",
    worsePrep: "Overcooked with large amounts of oil.",
    nutrients: { calories: 22, protein: 2, carbs: 4.1, fat: 0.2, fiber: 2.3 },
    glycemicImpact: "low",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Shobuj Shak (Mixed Greens)",
    banglaName: "সবুজ শাক",
    banglishName: "shobuj shak",
    aliases: ["mixed shak", "shobuj shak", "sobuj shak", "shobuj sak", "sobuj sak", "সবুজ শাক", "সবুজশাক", "শাক"],
    category: "vegetables_shak",
    nutritionRole: "Fiber, Micronutrients",
    healthNotes: "Generic mixed greens. High fiber and vitamins, but exact composition depends on the specific shak used.",
    servingContext: "Side dish with rice.",
    betterPrep: "Lightly stir-fried with minimal oil.",
    worsePrep: "Deep fried or heavily oiled.",
    nutrients: { calories: 20, protein: 2, carbs: 3.5, fat: 0.2, fiber: 2.2 },
    glycemicImpact: "low",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Begun (Eggplant)",
    banglaName: "বেগুন",
    banglishName: "begun",
    aliases: ["begun", "eggplant", "aubergine", "brinjal", "begun bhorta", "begun bhaji", "বেগুন", "বেগুন ভর্তা", "বেগুন ভাজি"],
    category: "vegetables_shak",
    nutritionRole: "Antioxidants (Nasunin), Fiber",
    healthNotes: "Low calorie, but sponge-like texture absorbs large amounts of oil during frying. Bhorta is much healthier than fried begun.",
    servingContext: "Fried as begun bhaji for breakfast, or roasted for bhorta.",
    betterPrep: "Roasted whole and mashed (bhorta) with onions and mustard oil.",
    worsePrep: "Deep-fried slices (begun bhaji/beguni).",
    nutrients: { calories: 25, protein: 1, carbs: 6, fat: 0.2, fiber: 3 },
    glycemicImpact: "low",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Lau (Bottle Gourd)",
    banglaName: "লাউ",
    banglishName: "lau",
    aliases: ["lau", "bottle gourd", "kaddu", "লাউ"],
    category: "vegetables_shak",
    nutritionRole: "Water, Vitamin C, Potassium, Fiber",
    healthNotes: "Extremely hydrating (over 95% water) and cooling. Excellent for digestion and weight loss.",
    servingContext: "Cooked as a light curry with shrimp, fish, or dal.",
    betterPrep: "Cooked as a light curry (Lau-Chingri or Lau-Dal) with minimal oil.",
    worsePrep: "Cooked in rich fatty meat gravies.",
    nutrients: { calories: 15, protein: 0.6, carbs: 3.4, fat: 0.1, fiber: 1.2 },
    glycemicImpact: "low",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Kumra (Pumpkin)",
    banglaName: "কুমড়া",
    banglishName: "kumra",
    aliases: ["kumra", "kumro", "pumpkin", "sweet gourd", "misti kumra", "মিষ্টি কুমড়া", "কুমড়া", "কুমড়ো"],
    category: "vegetables_shak",
    nutritionRole: "Beta-Carotene (Vitamin A), Fiber, Potassium",
    healthNotes: "Excellent for eye health and immunity. Low calorie but filling.",
    servingContext: "Stir-fried as sweet pumpkin bhaji, or in mixed vegetable curries.",
    betterPrep: "Boiled, steamed, or stir-fried with very little oil.",
    worsePrep: "Deep-fried in oil batter.",
    nutrients: { calories: 26, protein: 1, carbs: 6.5, fat: 0.1, fiber: 0.5 },
    glycemicImpact: "medium",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Potol (Pointed Gourd)",
    banglaName: "পটল",
    banglishName: "potol",
    aliases: ["potol", "pointed gourd", "parwal", "পটল"],
    category: "vegetables_shak",
    nutritionRole: "Fiber, Vitamin A, Vitamin C",
    healthNotes: "Good for digestion and stomach health. Seeds are rich in fiber.",
    servingContext: "Cooked as curry, bhaji, or stuffed potol.",
    betterPrep: "Sautéed with light spices or boiled.",
    worsePrep: "Deep fried potol bhaji.",
    nutrients: { calories: 20, protein: 1.4, carbs: 3, fat: 0.2, fiber: 1.6 },
    glycemicImpact: "low",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Beans (Borboti / Shim)",
    banglaName: "বরবটি / শিম",
    banglishName: "beans",
    aliases: ["shim", "sheem", "borboti", "barbati", "beans", "flat beans", "yardlong beans", "শিম", "বরবটি"],
    category: "vegetables_shak",
    nutritionRole: "Folate, Fiber, Vitamin C, Calcium",
    healthNotes: "High-fiber green beans, excellent for cardiovascular health.",
    servingContext: "Cooked in winter mixed curries or stir-fried.",
    betterPrep: "Lightly stir-fried or added to broths.",
    worsePrep: "Overcooked in high-oil curries.",
    nutrients: { calories: 35, protein: 2.5, carbs: 7, fat: 0.2, fiber: 3.2 },
    glycemicImpact: "low",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Shobji (Mixed Vegetables)",
    banglaName: "সবজি",
    banglishName: "shobji",
    aliases: ["shobji", "sobji", "vegetables", "vegetable", "mixed shobji", "সবজি", "সব্জি"],
    category: "vegetables_shak",
    nutritionRole: "Fiber, Multiple Vitamins & Minerals",
    healthNotes: "Great way to get diverse micronutrients. Fiber helps balance starch in bhat.",
    servingContext: "Eaten as a side dish at breakfast (with ruti) or lunch (with rice).",
    betterPrep: "Steamed or lightly sautéed with minimal oil (Deshi Niramish).",
    worsePrep: "Cooked with large amounts of oil or ghee.",
    nutrients: { calories: 40, protein: 1.5, carbs: 8, fat: 0.3, fiber: 2.8 },
    glycemicImpact: "low",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Aloo (Potato)",
    banglaName: "আলু",
    banglishName: "aloo",
    aliases: ["aloo", "alu", "potato", "আলু"],
    category: "vegetables_shak",
    nutritionRole: "Carbohydrates, Potassium, Vitamin B6",
    healthNotes: "Starchy root vegetable, high glycemic index. Should be treated as starch/staple rather than a green vegetable, especially for diabetes.",
    servingContext: "Added to almost all curries, mashed as aloo bhorta, or fried.",
    betterPrep: "Boiled and mashed (aloo bhorta) with onions, green chilies, and small mustard oil.",
    worsePrep: "Deep fried (french fries or aloo bhaji in deep oil).",
    nutrients: { calories: 87, protein: 2, carbs: 20, fat: 0.1, fiber: 1.8 },
    glycemicImpact: "high",
    studentBudgetFriendly: true,
  },

  // Snacks & Fried Food
  {
    canonicalName: "Singara",
    banglaName: "সিঙ্গারা",
    banglishName: "singara",
    aliases: ["singara", "shingara", "সিঙ্গারা", "সিঙাড়া"],
    category: "snacks_fried",
    nutritionRole: "Fats, Carbohydrates",
    healthNotes: "Deep-fried wrapper stuffed with potato. High calorie, high fat, and low protein. Eat sparingly.",
    servingContext: "Very popular afternoon snack with tea.",
    betterPrep: "Baked version (rarely available).",
    worsePrep: "Deep-fried in reused commercial oil.",
    nutrients: { calories: 250, protein: 3, carbs: 30, fat: 13, fiber: 1.5 },
    glycemicImpact: "high",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Samosa",
    banglaName: "সমোসা",
    banglishName: "samosa",
    aliases: ["samosa", "somosa", "সমোসা", "সমুচা"],
    category: "snacks_fried",
    nutritionRole: "Fats, Carbohydrates",
    healthNotes: "Deep-fried crispy triangles. High in calories and saturated fats. Low nutrition.",
    servingContext: "Afternoon street snack.",
    betterPrep: "Baked or air-fried.",
    worsePrep: "Deep-fried in heavy oil.",
    nutrients: { calories: 220, protein: 4, carbs: 22, fat: 12, fiber: 1 },
    glycemicImpact: "high",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Puri",
    banglaName: "পুরি",
    banglishName: "puri",
    aliases: ["puri", "poori", "dal puri", "aloo puri", "পুরি", "ডালপুরি", "আলুপুরি"],
    category: "snacks_fried",
    nutritionRole: "Fats, Carbohydrates",
    healthNotes: "Deep fried flatbread, absorbs massive amounts of oil. Low nutritional value and very calorie-dense.",
    servingContext: "Quick street snack.",
    betterPrep: "Avoid deep frying, dry roast instead (rarely done).",
    worsePrep: "Deep-fried in stale oil.",
    nutrients: { calories: 280, protein: 4, carbs: 32, fat: 15, fiber: 1 },
    glycemicImpact: "high",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Chop (Aloo Chop / Egg Chop)",
    banglaName: "চপ",
    banglishName: "chop",
    aliases: ["chop", "aloo chop", "dimer chop", "croquette", "চপ", "আলুর চপ", "ডিমের চপ"],
    category: "snacks_fried",
    nutritionRole: "Fats, Carbohydrates, Protein (if egg)",
    healthNotes: "Deep-fried mashed potato balls, often breaded. Egg chop provides protein but is still deep-fried.",
    servingContext: "Street food and Ramadan iftar snack.",
    betterPrep: "Baked or cooked with light pan-frying.",
    worsePrep: "Deep fried in oil.",
    nutrients: { calories: 200, protein: 3, carbs: 24, fat: 10, fiber: 1.5 },
    glycemicImpact: "high",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Jilapi (Jalebi)",
    banglaName: "জিলাপি",
    banglishName: "jilapi",
    aliases: ["jilapi", "jalebi", "jilipi", "জিলাপি"],
    category: "snacks_fried",
    nutritionRole: "Sugars, Fats, Energy",
    healthNotes: "Deep-fried batter soaked in sugar syrup. Extremely high sugar and calorie content. Avoid for diabetes and weight loss.",
    servingContext: "Eaten hot at festivals, Ramadan, or afternoon treats.",
    betterPrep: "Eat a very small portion (e.g. 1 loop).",
    worsePrep: "Deep fried and double soaked in syrup.",
    nutrients: { calories: 300, protein: 2, carbs: 55, fat: 8, fiber: 0 },
    glycemicImpact: "high",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Fuchka",
    banglaName: "ফুচকা",
    banglishName: "fuchka",
    aliases: ["fuchka", "phuchka", "panipuri", "golgappa", "ফুচকা"],
    category: "snacks_fried",
    nutritionRole: "Carbohydrates, Spices, Water",
    healthNotes: "Street delicacy. The potato stuffing is carb-heavy, and the fried shell adds fat. Eat from hygienic stalls to avoid food poisoning.",
    servingContext: "Popular street food, eaten with tangy tamarind water.",
    betterPrep: "Made with less potato stuffing, adding more chickpeas (chola) and boiled egg.",
    worsePrep: "Deep-fried shell filled with stale potato mix.",
    nutrients: { calories: 150, protein: 3, carbs: 22, fat: 5, fiber: 2 },
    glycemicImpact: "medium",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Chotpoti",
    banglaName: "চটপটি",
    banglishName: "chotpoti",
    aliases: ["chotpoti", "cotpoti", "চটপটি"],
    category: "snacks_fried",
    nutritionRole: "Plant Protein, Fiber, Carbohydrates",
    healthNotes: "Healthier than fuchka because it is centered around yellow peas (chola/dubli) which provide protein and fiber. Avoid adding too many fried fuchka shells on top.",
    servingContext: "Popular street food, served warm with tamarind sauce and boiled egg slices.",
    betterPrep: "Loaded with boiled egg, fresh onions, cucumber, cilantro, and no crushed shells.",
    worsePrep: "Topped with excessive crushed deep-fried shells and excess salt.",
    nutrients: { calories: 170, protein: 7, carbs: 28, fat: 2, fiber: 6 },
    glycemicImpact: "low",
    studentBudgetFriendly: true,
  },

  // Dairy & Sweets
  {
    canonicalName: "Mishti Doi (Sweet Yogurt)",
    banglaName: "মিষ্টি দই",
    banglishName: "mishti doi",
    aliases: ["mishti doi", "misti doi", "sweet yogurt", "মিষ্টি দই", "মিষ্টি দই"],
    category: "dairy_sweets",
    nutritionRole: "Calcium, Sugars, Protein, Probiotics",
    healthNotes: "Contains beneficial gut bacteria (probiotics), but very high in added sugar. Eat occasionally in small portions.",
    servingContext: "Traditional dessert served after heavy meals, feasts, or Eid.",
    betterPrep: "Swap for tok doi (sour curd) and add a little honey if needed.",
    worsePrep: "Cooked with caramel and high sugar syrup.",
    nutrients: { calories: 160, protein: 4, carbs: 24, fat: 5, fiber: 0 },
    glycemicImpact: "high",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Tok Doi (Sour Yogurt)",
    banglaName: "টক দই",
    banglishName: "tok doi",
    aliases: ["tok doi", "sour doi", "sour yogurt", "plain yogurt", "curd", "টক দই"],
    category: "dairy_sweets",
    nutritionRole: "Protein, Calcium, Probiotics, Healthy Fats",
    healthNotes: "Superfood. Zero added sugar, rich in calcium and probiotics. Supports digestion and blood sugar control.",
    servingContext: "Eaten as a healthy snack, or used in curries, drinks (borhani), and salad dressings.",
    betterPrep: "Eaten plain or with fresh fruits (bananas/berries).",
    worsePrep: "Sweetened heavily with white sugar.",
    nutrients: { calories: 60, protein: 4.5, carbs: 4.7, fat: 3.2, fiber: 0 },
    glycemicImpact: "low",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Milk (Dud)",
    banglaName: "দুধ",
    banglishName: "milk",
    aliases: ["milk", "dudh", "dud", "cow milk", "দুধ", "গরুর দুধ"],
    category: "dairy_sweets",
    nutritionRole: "Calcium, Protein, Vitamin D, Vitamin B12",
    healthNotes: "Excellent source of calcium for bones. Good for children and pregnant/lactating mothers.",
    servingContext: "Drunk hot at night, or used to make tea, payesh, and sweets.",
    betterPrep: "Boiled milk with no added sugar.",
    worsePrep: "Sweetened condensed milk or boiled with heavy sugar.",
    nutrients: { calories: 62, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0 },
    glycemicImpact: "low",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Sweets (Mishti)",
    banglaName: "মিষ্টি",
    banglishName: "sweets",
    aliases: ["mishti", "misti", "sweets", "sweetmeat", "chana sweets", "মিষ্টি"],
    category: "dairy_sweets",
    nutritionRole: "Sugars, Fats, Energy",
    healthNotes: "Contains high amounts of refined sugar and fat. Highly glycemic, avoid if diabetic or aiming for weight loss.",
    servingContext: "Celebratory events, sweet shops, family gatherings.",
    betterPrep: "Small portions of milk/chana sweets with reduced syrup.",
    worsePrep: "Sweets deeply fried and soaked in heavy syrup.",
    nutrients: { calories: 320, protein: 5, carbs: 58, fat: 8, fiber: 0 },
    glycemicImpact: "high",
    studentBudgetFriendly: false,
  },
  {
    canonicalName: "Roshogolla",
    banglaName: "রসগোল্লা",
    banglishName: "roshogolla",
    aliases: ["roshogolla", "rasgulla", "rosogolla", "রসগোল্লা"],
    category: "dairy_sweets",
    nutritionRole: "Sugars, Protein, Calcium",
    healthNotes: "Made from chana (milk curd), which gives protein, but heavily soaked in sugar syrup. Squeeze out syrup before eating to reduce sugar content.",
    servingContext: "Very popular Deshi sweet.",
    betterPrep: "Syrup squeezed out thoroughly before consumption.",
    worsePrep: "Eaten directly from the syrup tin.",
    nutrients: { calories: 186, protein: 4, carbs: 38, fat: 1.8, fiber: 0 },
    glycemicImpact: "high",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Chomchom",
    banglaName: "চমচম",
    banglishName: "chomchom",
    aliases: ["chomchom", "chamcham", "চমচম"],
    category: "dairy_sweets",
    nutritionRole: "Sugars, Fats, Protein",
    healthNotes: "Rich dense sweet, often coated with mawa. High calorie and saturated fats. Consume very rarely.",
    servingContext: "Special festivals and gift packs.",
    betterPrep: "Small portion size.",
    worsePrep: "Fried versions with extra sugar coating.",
    nutrients: { calories: 360, protein: 6, carbs: 50, fat: 15, fiber: 0 },
    glycemicImpact: "high",
    studentBudgetFriendly: false,
  },

  // Drinks
  {
    canonicalName: "Cha with Sugar",
    banglaName: "মিষ্টি চা",
    banglishName: "cha with sugar",
    aliases: ["cha with sugar", "misti cha", "sweet tea", "cha", "tea", "চা", "লাল চা", "রং চা"],
    category: "drinks",
    nutritionRole: "Antioxidants (Flavones), Sugars",
    healthNotes: "Black tea has antioxidants, but added sugar adds empty calories. Drinking tea immediately after meals inhibits iron absorption. Wait 1 hour after eating.",
    servingContext: "Social drink, consumed multiple times a day at tea stalls (tonger cha).",
    betterPrep: "Rang cha (black tea) or green tea with ginger, lemon, and NO sugar.",
    worsePrep: "Sweetened black tea with multiple teaspoons of sugar.",
    nutrients: { calories: 40, protein: 0.1, carbs: 10, fat: 0, fiber: 0 },
    glycemicImpact: "medium",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Milk Tea (Dud Cha)",
    banglaName: "দুধ চা",
    banglishName: "milk tea",
    aliases: ["dudh cha", "dud cha", "milk tea", "tonger dudh cha", "দুধ চা"],
    category: "drinks",
    nutritionRole: "Sugars, Fats",
    healthNotes: "Often made with condensed milk or highly boiled milk and multiple spoonfuls of sugar. Low nutrition, high calories. Drink sugar-free instead.",
    servingContext: "Tong stalls or afternoon home tea.",
    betterPrep: "Made with low-fat fresh milk and zero sugar or stevia.",
    worsePrep: "Made with thick condensed milk and extra sugar.",
    nutrients: { calories: 90, protein: 1.5, carbs: 15, fat: 2.5, fiber: 0 },
    glycemicImpact: "high",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Soft Drinks",
    banglaName: "কোমল পানীয়",
    banglishName: "soft drinks",
    aliases: ["soft drinks", "coke", "pepsi", "sprite", "soda", "cold drink", "cold drinks", "কোমল পানীয়", "কোক", "পেপসি"],
    category: "drinks",
    nutritionRole: "Sugars, Empty Calories",
    healthNotes: "Extremely high in refined sugar (approx 35g per can) and phosphoric acid. Increases risk of obesity, diabetes, and dental erosion.",
    servingContext: "Paired with biryani/polao or fast food, popular among youth.",
    betterPrep: "Swap for plain water, coconut water, or sugar-free club soda.",
    worsePrep: "Regular consumption alongside heavy meals.",
    nutrients: { calories: 140, protein: 0, carbs: 39, fat: 0, fiber: 0 },
    glycemicImpact: "high",
    studentBudgetFriendly: true,
  },
  {
    canonicalName: "Fruit Juice",
    banglaName: "ফলের রস",
    banglishName: "juice",
    aliases: ["juice", "fruit juice", "mango juice", "orange juice", "ফলের রস", "জুস"],
    category: "drinks",
    nutritionRole: "Vitamin C, Sugars",
    healthNotes: "Commercial juices have added sugar and lack fiber. Fresh homemade juice without sugar is better, but eating the whole fruit is always preferred for fiber.",
    servingContext: "Summer refreshment.",
    betterPrep: "Fresh juice blended with pulp and no added sugar.",
    worsePrep: "Packed commercial juices with high-fructose corn syrup.",
    nutrients: { calories: 50, protein: 0.5, carbs: 12, fat: 0.1, fiber: 0.2 },
    glycemicImpact: "high",
    studentBudgetFriendly: true,
  },
];

const LOCALIZED_FOOD_INFO: Record<string, {
  bangla: { healthNotes: string; nutritionRole: string };
  banglish: { healthNotes: string; nutritionRole: string };
}> = {
  "Bhat (White Rice)": {
    bangla: {
      healthNotes: "গ্লাইসেমিক ইনডেক্স বেশি হওয়ায় দ্রুত রক্তে শর্করা বাড়ে। পরিমিত খাওয়া এবং শাক-সবজি ও ডালের সাথে খাওয়া ভালো।",
      nutritionRole: "শর্করা ও শক্তি"
    },
    banglish: {
      healthNotes: "Glycemic index beshi, tai blood sugar badhte pare. Poriman moto green vegetables and dal er sathe khawa bhalo.",
      nutritionRole: "Carbohydrates, Energy"
    }
  },
  "Ruti (Roti)": {
    bangla: {
      healthNotes: "ফাইবার তুলনামূলক ভালো এবং রক্তে শর্করার চাপ কম পড়ে। ডায়াবেটিস রোগীদের জন্য অত্যন্ত উপকারী।",
      nutritionRole: "জটিল শর্করা, ফাইবার ও ভিটামিন বি"
    },
    banglish: {
      healthNotes: "Bhater cheye beshi fiber and blood sugar e bhalo. Diabetics der jonno khub recommended.",
      nutritionRole: "Complex Carbohydrates, Fiber, B Vitamins"
    }
  },
  "Paratha": {
    bangla: {
      healthNotes: "তেল বা ঘিয়ের কারণে ক্যালরি ও ফ্যাট অনেক বেশি থাকে। ওজন কমানো এবং হার্টের সুস্বাস্থ্যের জন্য কম খাওয়া উচিত।",
      nutritionRole: "ফ্যাট, শর্করা ও শক্তি"
    },
    banglish: {
      healthNotes: "Tel/ghee er jonno calorie and fat beshi. Weight loss and heart er jonno limit kora bhalo.",
      nutritionRole: "Fats, Carbohydrates, Energy"
    }
  },
  "Khichuri": {
    bangla: {
      healthNotes: "চাল ও ডালের মিশ্রণের কারণে এটি প্রোটিনের একটি সম্পূর্ণ উৎস। তবে অতিরিক্ত ক্যালরি এড়াতে পরিমাণ নিয়ন্ত্রণ করা উচিত।",
      nutritionRole: "শর্করা, প্রোটিন ও ফাইবার"
    },
    banglish: {
      healthNotes: "Rice-lentil mix er jonno complete protein source. But calorie dense hote pare, tai portion control korun.",
      nutritionRole: "Carbohydrates, Protein, Fiber"
    }
  },
  "Biryani / Tehari / Kacchi": {
    bangla: {
      healthNotes: "খুবই সমৃদ্ধ খাবার, এতে প্রচুর স্যাচুরেটেড ফ্যাট এবং সোডিয়াম থাকে। বিশেষ দিন ছাড়া এটি এড়িয়ে চলাই ভালো।",
      nutritionRole: "ফ্যাট, শর্করা ও প্রোটিন"
    },
    banglish: {
      healthNotes: "Rich food, saturated fat and sodium beshi. Special occasion chara avoid kora bhalo.",
      nutritionRole: "Fats, Carbohydrates, Protein"
    }
  },
  "Dim (Egg)": {
    bangla: {
      healthNotes: "সাশ্রয়ী দামে ভালো মানের প্রোটিন পাওয়া যায়। ডিমের কুসুমে প্রয়োজনীয় ফ্যাট ও ভিটামিন থাকে।",
      nutritionRole: "সম্পূর্ণ প্রোটিন ও ভিটামিন ডি"
    },
    banglish: {
      healthNotes: "Shasroye dame bhalo protein source. Yolk e healthy fats and vitamins thake.",
      nutritionRole: "Complete Protein, Vitamin D"
    }
  },
  "Dal (Lentils)": {
    bangla: {
      healthNotes: "চমৎকার উদ্ভিদ প্রোটিনের উৎস। উচ্চ ফাইবার কোলেস্টেরল এবং রক্তে শর্করা নিয়ন্ত্রণে সাহায্য করে।",
      nutritionRole: "উদ্ভিদ প্রোটিন, ফাইবার ও আয়রন"
    },
    banglish: {
      healthNotes: "Bhalo plant protein. High fiber blood sugar control and cholesterol management e help kore.",
      nutritionRole: "Plant Protein, Fiber, Iron"
    }
  },
  "Mach (Fish)": {
    bangla: {
      healthNotes: "সহজে হজমযোগ্য লীন প্রোটিনের উৎস। মলা বা ছোট মাছ ভিটামিন এ ও ক্যালসিয়ামে ভরপুর।",
      nutritionRole: "প্রোটিন, ওমেগা-৩ ফ্যাট ও ক্যালসিয়াম"
    },
    banglish: {
      healthNotes: "Bhalo lean protein source. Choto mach like mola, Vitamin A and Calcium rich.",
      nutritionRole: "Protein, Omega-3, Calcium"
    }
  },
  "Murgi (Chicken)": {
    bangla: {
      healthNotes: "চামড়া ছাড়া মুরগির মাংস লীন প্রোটিনের অন্যতম উৎস। পেশি গঠন ও ওজন নিয়ন্ত্রণে এটি দারুণ উপকারী।",
      nutritionRole: "লীন প্রোটিন ও ভিটামিন বি"
    },
    banglish: {
      healthNotes: "Skinless murgi lean protein er bhalo source. Muscle gain and weight control e help kore.",
      nutritionRole: "Lean Protein, B Vitamins"
    }
  },
  "Beef (Goru)": {
    bangla: {
      healthNotes: "প্রচুর আয়রন ও জিঙ্ক রয়েছে, তবে এতে স্যাচুরেটেড ফ্যাট বেশি থাকায় সপ্তাহে ১-২ বারের বেশি খাওয়া উচিত নয়।",
      nutritionRole: "প্রোটিন, আয়রন ও ভিটামিন বি১২"
    },
    banglish: {
      healthNotes: "Iron/zinc rich but saturated fat/cholesterol beshi. Soptah e 1-2 barer beshi na khawa bhalo.",
      nutritionRole: "Protein, Iron, Vitamin B12"
    }
  },
  "Chola (Chickpeas)": {
    bangla: {
      healthNotes: "ফাইবার ও প্রোটিনে ভরপুর। এটি দীর্ঘ সময় পেট ভরা রাখে এবং ডায়াবেটিস নিয়ন্ত্রণে সাহায্য করে।",
      nutritionRole: "উদ্ভিদ প্রোটিন, ফাইবার ও আয়রন"
    },
    banglish: {
      healthNotes: "Fiber and plant protein rich. Pet bhora rakhe and sugar control e help kore.",
      nutritionRole: "Plant Protein, Fiber, Iron"
    }
  },
  "Lal Shak (Red Amaranth)": {
    bangla: {
      healthNotes: "আয়রন ও ভিটামিন এ-র অন্যতম সেরা উৎস। আয়রন শোষণ বাড়াতে লেবুর রস মিশিয়ে খান। অত্যন্ত সাশ্রয়ী।",
      nutritionRole: "আয়রন, ফাইবার ও ভিটামিন এ, সি"
    },
    banglish: {
      healthNotes: "Iron and Vitamin A er khub bhalo source. Iron absorption barate lemon juice add korun.",
      nutritionRole: "Iron, Vitamin A, Vitamin C, Fiber"
    }
  },
  "Kolmi Shak (Water Spinach)": {
    bangla: {
      healthNotes: "খুবই কম ক্যালরি এবং উচ্চ ফাইবারযুক্ত সবুজ শাক। এটি হজমে সাহায্য করে এবং স্বাস্থ্যের জন্য অত্যন্ত সাশ্রয়ী।",
      nutritionRole: "ভিটামিন এ, সি, ক্যালসিয়াম ও ফাইবার"
    },
    banglish: {
      healthNotes: "Low calorie, high fiber greens. Digest e help kore and khub budget friendly.",
      nutritionRole: "Vitamin A, Vitamin C, Calcium, Fiber"
    }
  },
  "Palong Shak (Spinach)": {
    bangla: {
      healthNotes: "পুষ্টিগুণে ভরপুর শাক, যা হার্ট এবং পেশির কার্যকারিতা উন্নত করতে সহায়তা করে।",
      nutritionRole: "ফলেট, আয়রন ও ভিটামিন কে"
    },
    banglish: {
      healthNotes: "Nutrient dense greens, heart and muscle function e help kore.",
      nutritionRole: "Folate, Iron, Vitamin K"
    }
  },
  "Pui Shak (Malabar Spinach)": {
    bangla: {
      healthNotes: "পিচ্ছিল পাতাগুলো হজমশক্তি বাড়াতে এবং অন্ত্র বা পেটের স্বাস্থ্যের জন্য দারুণ উপকারী।",
      nutritionRole: "ভিটামিন এ, সি, ক্যালসিয়াম ও আয়রন"
    },
    banglish: {
      healthNotes: "Thick leaves, digestion and gut health er jonno khub bhalo.",
      nutritionRole: "Vitamin A, Vitamin C, Calcium, Iron"
    }
  },
  "Lau Shak": {
    bangla: {
      healthNotes: "শরীর ঠাণ্ডা রাখে এবং এতে প্রচুর ফলেট থাকে, যা গর্ভবতী মায়েদের জন্য বিশেষভাবে উপকারী।",
      nutritionRole: "ফলেট, ভিটামিন সি ও পটাসিয়াম"
    },
    banglish: {
      healthNotes: "Cooling property, folate-rich. Pregnancy te khub recommended.",
      nutritionRole: "Folate, Vitamin C, Potassium, Fiber"
    }
  },
  "Data Shak": {
    bangla: {
      healthNotes: "মুচমুচে ডাঁটাগুলো প্রচুর পরিমাণে ফাইবার সরবরাহ করে যা কোষ্ঠকাঠিন্য দূর করতে সাহায্য করে।",
      nutritionRole: "ক্যালসিয়াম, ভিটামিন সি ও ফাইবার"
    },
    banglish: {
      healthNotes: "Crunchy stems dietary fiber dey, digest e help kore.",
      nutritionRole: "Calcium, Vitamin C, Fiber"
    }
  },
  "Shobuj Shak (Mixed Greens)": {
    bangla: {
      healthNotes: "নানারকম সবুজ শাকের মিশ্রণ। উচ্চ ফাইবার ও ভিটামিনে সমৃদ্ধ, যা সার্বিক স্বাস্থ্য ভালো রাখে।",
      nutritionRole: "ফাইবার, ভিটামিন ও মিনারেলস"
    },
    banglish: {
      healthNotes: "Mixed green leaves. High fiber and vitamins thake.",
      nutritionRole: "Fiber, Micronutrients"
    }
  },
  "Begun (Eggplant)": {
    bangla: {
      healthNotes: "কম ক্যালরিযুক্ত, তবে ভাজার সময় এটি প্রচুর তেল শুষে নেয়। ভাজির চেয়ে বেগুন ভর্তা খাওয়া অনেক স্বাস্থ্যকর।",
      nutritionRole: "অ্যান্টিঅক্সিডেন্ট ও ফাইবার"
    },
    banglish: {
      healthNotes: "Low calorie but fry korle tel shushe ney. Fried begun er cheye begun bhorta bhalo.",
      nutritionRole: "Antioxidants, Fiber"
    }
  },
  "Lau (Bottle Gourd)": {
    bangla: {
      healthNotes: "শতকরা ৯৫ ভাগ জলীয় অংশ থাকায় শরীর হাইড্রেটেড রাখে। এটি হজম সহজ করে এবং ওজন কমাতে সাহায্য করে।",
      nutritionRole: "পানি, পটাসিয়াম ও ভিটামিন সি"
    },
    banglish: {
      healthNotes: "95% water content, highly hydrating. Digestion and weight loss e help kore.",
      nutritionRole: "Water, Vitamin C, Potassium"
    }
  },
  "Kumra (Pumpkin)": {
    bangla: {
      healthNotes: "চোখের সুরক্ষা ও রোগ প্রতিরোধ ক্ষমতা বাড়াতে সাহায্য করে। কম ক্যালরিযুক্ত কিন্তু পেট ভরা রাখে।",
      nutritionRole: "বিটা-ক্যারোটিন (ভিটামিন এ) ও পটাসিয়াম"
    },
    banglish: {
      healthNotes: "Eye health and immunity r jonno bhalo. Low calorie but filling.",
      nutritionRole: "Beta-Carotene, Fiber, Potassium"
    }
  },
  "Potol (Pointed Gourd)": {
    bangla: {
      healthNotes: "হজম ক্ষমতার উন্নতি ঘটায় এবং পাকস্থলী ঠাণ্ডা রাখে। এর বীজগুলো ফাইবারে সমৃদ্ধ।",
      nutritionRole: "ফধার, ভিটামিন এ ও সি"
    },
    banglish: {
      healthNotes: "Digestion and stomach health er jonno bhalo. Seeds fiber rich.",
      nutritionRole: "Fiber, Vitamin A, Vitamin C"
    }
  },
  "Beans (Borboti / Shim)": {
    bangla: {
      healthNotes: "উচ্চ ফাইবারযুক্ত শিম জাতীয় সবজি, যা হার্টের স্বাস্থ্য ভালো রাখতে গুরুত্বপূর্ণ ভূমিকা রাখে।",
      nutritionRole: "ফলেট, ফাইবার ও ক্যালসিয়াম"
    },
    banglish: {
      healthNotes: "High-fiber green beans, cardiovascular health er jonno bhalo.",
      nutritionRole: "Folate, Fiber, Calcium"
    }
  },
  "Shobji (Mixed Vegetables)": {
    bangla: {
      healthNotes: "নানা ধরণের ভিটামিন পাওয়ার সেরা মাধ্যম। ভাতের সাথে খেলে এটি শর্করার প্রভাব নিয়ন্ত্রণে রাখে।",
      nutritionRole: "ফাইবার ও হরেক রকম ভিটামিন"
    },
    banglish: {
      healthNotes: "Diverse vitamins paoar best medium. Rice er sugar spike control kore.",
      nutritionRole: "Fiber, Multiple Vitamins"
    }
  },
  "Aloo (Potato)": {
    bangla: {
      healthNotes: "এটি শর্করার প্রধান উৎস, তাই একে সবজির চেয়ে ভাতের সমতুল্য ভাবা উচিত, বিশেষ করে ডায়াবেটিস থাকলে।",
      nutritionRole: "শর্করা ও পটাসিয়াম"
    },
    banglish: {
      healthNotes: "Starchy root vegetable, high GI. Diet e bhater moto starch hishebe poriman control kora bhalo.",
      nutritionRole: "Carbohydrates, Potassium"
    }
  },
  "Singara": {
    bangla: {
      healthNotes: "ময়দা দিয়ে তৈরি সিঙ্গারা তেলে ভাজা ও আলুতে ভরা থাকে। এতে ক্যালরি ও ফ্যাট বেশি, পুষ্টিগুণ কম।",
      nutritionRole: "ফ্যাট ও রিফাইনড শর্করা"
    },
    banglish: {
      healthNotes: "Deep-fried wrapper with potato. High calorie/fat, low protein. Kom khawa bhalo.",
      nutritionRole: "Fats, Carbohydrates"
    }
  },
  "Samosa": {
    bangla: {
      healthNotes: "মুচমুচে ভাজা সমোসা ক্যালরি এবং ক্ষতিকর ফ্যাটে ভরা থাকে। স্বাস্থ্যকর খাবারের তালিকায় এটি বেশ অনুপোযোগী।",
      nutritionRole: "ফ্যাট ও শর্করা"
    },
    banglish: {
      healthNotes: "Deep-fried crispy triangles. High in calories and saturated fats.",
      nutritionRole: "Fats, Carbohydrates"
    }
  },
  "Puri": {
    bangla: {
      healthNotes: "ময়দা ডুবো তেলে ভাজার কারণে এটি অত্যন্ত ক্যালরি ও ফ্যাট সমৃদ্ধ হয়। এতে পুষ্টির মান নেই বললেই চলে।",
      nutritionRole: "ফ্যাট ও রিফাইনড শর্করা"
    },
    banglish: {
      healthNotes: "Deep fried bread, absorbs massive oil. Low nutrition value.",
      nutritionRole: "Fats, Carbohydrates"
    }
  },
  "Chop (Aloo Chop / Egg Chop)": {
    bangla: {
      healthNotes: "ডিম বা আলুর চপ ডুবো তেলে ভাজা হয়। ডিমের চপে কিছুটা প্রোটিন থাকলেও এটি অতিরিক্ত ফ্যাটের উৎস।",
      nutritionRole: "ফ্যাট ও শর্করা"
    },
    banglish: {
      healthNotes: "Deep-fried croquettes. Egg chop has some protein but still high fat.",
      nutritionRole: "Fats, Carbohydrates"
    }
  },
  "Jilapi (Jalebi)": {
    bangla: {
      healthNotes: "তেলে ভেজে চিনির সিরায় ডুবানো থাকে। ডায়াবেটিস এবং ওজন কমাতে ইচ্ছুকদের এটি কঠোরভাবে এড়িয়ে চলা উচিত।",
      nutritionRole: "চিনি ও ক্ষতিকর ফ্যাট"
    },
    banglish: {
      healthNotes: "Deep-fried and syrup soaked. Avoid for diabetes or weight loss.",
      nutritionRole: "Sugars, Fats"
    }
  },
  "Fuchka": {
    bangla: {
      healthNotes: "আলুর পুর ও তেলে ভাজা ফুচকার খোসা অতিরিক্ত শর্করা ও ফ্যাট দেয়। পরিচ্ছন্ন জায়গা থেকে খাওয়া উচিত।",
      nutritionRole: "শর্করা ও ফ্যাট"
    },
    banglish: {
      healthNotes: "Potato stuffing is carb-heavy. Shell is fried. Eat from hygienic places.",
      nutritionRole: "Carbohydrates, Fats"
    }
  },
  "Chotpoti": {
    bangla: {
      healthNotes: "ফুচকার চেয়ে চটপটি অনেক স্বাস্থ্যকর, কারণ এতে মটর ও ডিম থাকে যা ভালো ফাইবার ও প্রোটিন দেয়।",
      nutritionRole: "উদ্ভিদ প্রোটিন ও ফাইবার"
    },
    banglish: {
      healthNotes: "Healthier than fuchka due to yellow peas and egg (protein/fiber).",
      nutritionRole: "Plant Protein, Fiber"
    }
  },
  "Mishti Doi (Sweet Yogurt)": {
    bangla: {
      healthNotes: "হজম সহায়তাকারী ব্যাক্টেরিয়া থাকলেও এতে অতিরিক্ত চিনি যোগ করা থাকে। তাই মাঝে মাঝে পরিমিত খাওয়া উচিত।",
      nutritionRole: "ক্যালসিয়াম, চিনি ও প্রোবায়োটিক"
    },
    banglish: {
      healthNotes: "Contains probiotics but very high added sugar. Eat occasionally in small portions.",
      nutritionRole: "Calcium, Sugars, Probiotics"
    }
  },
  "Tok Doi (Sour Yogurt)": {
    bangla: {
      healthNotes: "চিনি কম, ক্যালসিয়াম ও প্রোবায়োটিকের ভালো উৎস। এটি হজমে সাহায্য করে ও সুগার নিয়ন্ত্রণ করে।",
      nutritionRole: "প্রোটিন, ক্যালসিয়াম ও প্রোবায়োটিক"
    },
    banglish: {
      healthNotes: "Zero added sugar, rich in calcium/probiotics. Supports digestion and blood sugar.",
      nutritionRole: "Protein, Calcium, Probiotics"
    }
  },
  "Milk (Dud)": {
    bangla: {
      healthNotes: "হাড় ও দাঁতের গঠনের জন্য চমৎকার ক্যালসিয়ামের উৎস। শিশু ও মায়েদের জন্য দারুণ পুষ্টিকর।",
      nutritionRole: "ক্যালসিয়াম ও ভিটামিন বি১২"
    },
    banglish: {
      healthNotes: "Excellent calcium source for bones. Recommended for pregnant mothers.",
      nutritionRole: "Calcium, Protein, Vitamin B12"
    }
  },
  "Sweets (Mishti)": {
    bangla: {
      healthNotes: "অতিরিক্ত চিনি ও ফ্যাটের উৎস। রক্তে শর্করা দ্রুত বাড়ায়, তাই ডায়াবেটিস ও ওজন কমাতে চাইলে এড়িয়ে চলুন।",
      nutritionRole: "চিনি, ক্যালরি ও ফ্যাট"
    },
    banglish: {
      healthNotes: "High refined sugar/fat. Highly glycemic, avoid for diabetes.",
      nutritionRole: "Sugars, Fats, Energy"
    }
  },
  "Roshogolla": {
    bangla: {
      healthNotes: "ছানা দিয়ে তৈরি বলে প্রোটিন থাকলেও চিনির সিরায় ডুবানো থাকে। খাওয়ার আগে সিরা চিপে ফেলে দেওয়া ভালো।",
      nutritionRole: "চিনি, প্রোটিন ও ক্যালসিয়াম"
    },
    banglish: {
      healthNotes: "Made from chana (protein) but high sugar syrup. Squeeze out syrup before eating.",
      nutritionRole: "Sugars, Protein"
    }
  },
  "Chomchom": {
    bangla: {
      healthNotes: "ক্ষীর ও মাওয়ায় তৈরি ঘন মিষ্টি। এতে ক্যালরি ও স্যাচুরেটেড ফ্যাট অনেক বেশি থাকে, পরিমিত খাওয়া উচিত।",
      nutritionRole: "চিনি ও স্যাচুরেটেড ফ্যাট"
    },
    banglish: {
      healthNotes: "Rich dense sweet, coated with mawa. High calorie and fat.",
      nutritionRole: "Sugars, Fats, Protein"
    }
  },
  "Cha with Sugar": {
    bangla: {
      healthNotes: "চা-তে অ্যান্টিঅক্সিডেন্ট থাকলেও চিনি বাড়তি ক্যালরি যোগ করে। আয়রন শোষণ ঠিক রাখতে খাওয়ার ১ ঘণ্টা পর চা খান।",
      nutritionRole: "অ্যান্টিঅক্সিডেন্ট ও চিনি"
    },
    banglish: {
      healthNotes: "Antioxidants in tea are good, but sugar adds empty calories. Wait 1 hour after meals.",
      nutritionRole: "Antioxidants, Sugars"
    }
  },
  "Milk Tea (Dud Cha)": {
    bangla: {
      healthNotes: "সাধারণত কনডেন্সড মিল্ক ও অতিরিক্ত চিনি দিয়ে তৈরি হয়। এটি ক্যালরি বেশি দেয় কিন্তু পুষ্টিগুণ কম।",
      nutritionRole: "চিনি ও ফ্যাট"
    },
    banglish: {
      healthNotes: "Made with condensed milk or high sugar. Low nutrition, high calories.",
      nutritionRole: "Sugars, Fats"
    }
  },
  "Soft Drinks": {
    bangla: {
      healthNotes: "প্রচুর চিনি ও এসিড সমৃদ্ধ। স্থূলতা, ডায়াবেটিস এবং দাঁতের ক্ষয়ের ঝুঁকি বাড়ায়। এড়িয়ে চলা উচিত।",
      nutritionRole: "চিনি ও খালি ক্যালরি"
    },
    banglish: {
      healthNotes: "Extremely high refined sugar. Increases risk of diabetes and obesity.",
      nutritionRole: "Sugars, Empty Calories"
    }
  },
  "Fruit Juice": {
    bangla: {
      healthNotes: "প্যাকেটজাত জুসে ফাইবার থাকে না এবং চিনি যোগ করা থাকে। এর চেয়ে আস্ত ফল চিবিয়ে খাওয়া বেশি উপকারি।",
      nutritionRole: "ভিটামিন সি ও চিনি"
    },
    banglish: {
      healthNotes: "Lack fiber, added sugar. Fresh homemade juice is better, whole fruit is best.",
      nutritionRole: "Vitamin C, Sugars"
    }
  }
};

export function getLocalizedHealthNotes(item: FoodEntity | FoodItem, language: "bangla_script" | "banglish" | "english" = "banglish"): string {
  const mapping = LOCALIZED_FOOD_INFO[item.canonicalName];
  if (!mapping) return item.healthNotes;
  if (language === "bangla_script") return mapping.bangla.healthNotes;
  if (language === "banglish") return mapping.banglish.healthNotes;
  return item.healthNotes;
}

export function getLocalizedNutritionRole(item: FoodEntity | FoodItem, language: "bangla_script" | "banglish" | "english" = "banglish"): string {
  const mapping = LOCALIZED_FOOD_INFO[item.canonicalName];
  if (!mapping) return item.nutritionRole;
  if (language === "bangla_script") return mapping.bangla.nutritionRole;
  if (language === "banglish") return mapping.banglish.nutritionRole;
  return item.nutritionRole;
}

export function getLocalizedFoodReason(food: FoodEntity | FoodItem, language: "bangla_script" | "banglish" | "english" = "banglish"): string {
  return getLocalizedHealthNotes(food, language);
}

export type FoodEntity = {
  canonicalName: string;
  banglaName: string;
  matchedText: string;
  category: FoodCategory;
  confidence: number;
  nutritionRole: string;
  healthNotes: string;
  servingContext: string;
  betterPrep: string;
  worsePrep: string;
  nutrients: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    iron?: number;
    sodium?: number;
  };
  glycemicImpact: "low" | "medium" | "high";
  studentBudgetFriendly: boolean;
};

// Normalize text for matching (lowercase, strip non-alphabetic/non-bangla characters, remove extra whitespace)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[?.!,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Simple Levenshtein distance
function getLevenshteinDistance(a: string, b: string): number {
  const tmp: number[][] = [];
  let i, j;
  for (i = 0; i <= a.length; i++) {
    tmp.push([i]);
  }
  for (j = 1; j <= b.length; j++) {
    tmp[0].push(j);
  }
  for (i = 1; i <= a.length; i++) {
    for (j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

// Function to extract food entities
export function extractFoodEntities(message: string, language?: "bangla_script" | "banglish" | "english"): FoodEntity[] {
  const normalizedMsg = normalizeText(message);
  const entities: FoodEntity[] = [];
  const matchedCanonicalNames = new Set<string>();

  let resolvedLang = language;
  if (!resolvedLang) {
    if (/[\u0980-\u09FF]/.test(message)) {
      resolvedLang = "bangla_script";
    } else {
      resolvedLang = "banglish";
    }
  }

  // Helper to add entity
  const addEntity = (item: FoodItem, matchedText: string, confidence: number) => {
    if (matchedCanonicalNames.has(item.canonicalName)) return;
    matchedCanonicalNames.add(item.canonicalName);
    entities.push({
      canonicalName: item.canonicalName,
      banglaName: item.banglaName,
      matchedText,
      category: item.category,
      confidence,
      nutritionRole: getLocalizedNutritionRole(item, resolvedLang!),
      healthNotes: getLocalizedHealthNotes(item, resolvedLang!),
      servingContext: item.servingContext,
      betterPrep: item.betterPrep,
      worsePrep: item.worsePrep,
      nutrients: item.nutrients,
      glycemicImpact: item.glycemicImpact,
      studentBudgetFriendly: item.studentBudgetFriendly,
    });
  };

  // 1. Direct substring checks (Confidence = 1.0)
  for (const item of BANGLADESHI_FOODS) {
    for (const alias of item.aliases) {
      const normalizedAlias = alias.toLowerCase();
      if (!normalizedAlias) continue;

      const pos = normalizedMsg.indexOf(normalizedAlias);
      if (pos !== -1) {
        // Word boundary prefix check to avoid false sub-word matches (e.g. "alu" inside "value")
        let isWordMatch = true;
        if (normalizedAlias.length <= 4) {
          const charBefore = pos > 0 ? normalizedMsg[pos - 1] : " ";
          const isAlphaNumeric = (char: string) => /[a-zA-Z0-9]/.test(char) || /[\u0980-\u09FF]/.test(char);
          if (isAlphaNumeric(charBefore)) {
            isWordMatch = false;
          }
        }
        if (isWordMatch) {
          addEntity(item, normalizedAlias, 1.0);
          break;
        }
      }
    }
  }

  // 2. Word token fuzzy match (Confidence = 0.8)
  const tokens = normalizedMsg.split(" ").filter(t => t.length > 2);
  const bigrams: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
  }

  const allCandidates = [...tokens, ...bigrams];

  for (const candidate of allCandidates) {
    const normCand = candidate.replace(/\s+/g, ""); // strip space for fuzzy compare e.g. "komishak" vs "kolmishak"
    if (normCand.length < 3) continue;

    for (const item of BANGLADESHI_FOODS) {
      if (matchedCanonicalNames.has(item.canonicalName)) continue;

      for (const alias of item.aliases) {
        const normAlias = alias.toLowerCase().replace(/\s+/g, "");
        if (normAlias.length < 3) continue;

        // Direct normalized check
        if (normCand === normAlias) {
          addEntity(item, candidate, 0.9);
          break;
        }

        // Levenshtein fuzzy match
        const dist = getLevenshteinDistance(normCand, normAlias);
        const maxLen = Math.max(normCand.length, normAlias.length);
        const similarity = 1 - dist / maxLen;

        // Elevated similarity threshold to prevent incorrect fuzzy overlaps (e.g. lalshak matching laushak)
        if (similarity >= 0.88) {
          addEntity(item, candidate, 0.85);
          break;
        }
      }
    }
  }

  // Non-maximum suppression: sort entities by matchedText length descending,
  // and discard any entity whose matched text is a strict substring/subset of a longer match.
  entities.sort((a, b) => b.matchedText.length - a.matchedText.length);

  const finalEntities: FoodEntity[] = [];
  for (const ent of entities) {
    const isSubMatch = finalEntities.some(existing => 
      existing.matchedText.toLowerCase().includes(ent.matchedText.toLowerCase())
    );
    if (!isSubMatch) {
      finalEntities.push(ent);
    }
  }

  return finalEntities;
}

// Local ranking algorithm for fallback cases
export function rankFoodsLocally(entities: FoodEntity[], userGoal?: string): FoodEntity[] {
  return [...entities].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // Glycemic impact scores
    const glycemicScores = { low: 4, medium: 2, high: 0 };
    scoreA += glycemicScores[a.glycemicImpact] || 0;
    scoreB += glycemicScores[b.glycemicImpact] || 0;

    // Diabetic / weight loss preference adjustments
    if (userGoal === "diabetes_friendly" || userGoal === "weight_loss") {
      if (a.glycemicImpact === "low") scoreA += 4;
      if (b.glycemicImpact === "low") scoreB += 4;
      if (a.glycemicImpact === "high") scoreA -= 4;
      if (b.glycemicImpact === "high") scoreB -= 4;
      
      if (a.category === "vegetables_shak") scoreA += 3;
      if (b.category === "vegetables_shak") scoreB += 3;
    }

    // Muscle gain adjustments
    if (userGoal === "muscle_gain") {
      scoreA += (a.nutrients.protein || 0) * 0.8;
      scoreB += (b.nutrients.protein || 0) * 0.8;
    }

    // Fiber and micro density indicators
    scoreA += (a.nutrients.fiber || 0) * 0.5;
    scoreB += (b.nutrients.fiber || 0) * 0.5;

    // Iron indicators (important for greens)
    if (a.nutrients.iron) scoreA += a.nutrients.iron * 0.5;
    if (b.nutrients.iron) scoreB += b.nutrients.iron * 0.5;

    // Budget friendly preference
    if (a.studentBudgetFriendly) scoreA += 2;
    if (b.studentBudgetFriendly) scoreB += 2;

    // Inherent category scores
    const categoryScores: Record<FoodCategory, number> = {
      vegetables_shak: 5,
      proteins: 4,
      staples: 2,
      dairy_sweets: 1,
      snacks_fried: -2,
      drinks: -3,
    };
    scoreA += categoryScores[a.category] || 0;
    scoreB += categoryScores[b.category] || 0;

    // High fat / calorie penalty for weight loss
    if (userGoal === "weight_loss") {
      scoreA -= (a.nutrients.fat || 0) * 0.3;
      scoreB -= (b.nutrients.fat || 0) * 0.3;
      scoreA -= (a.nutrients.calories || 0) * 0.01;
      scoreB -= (b.nutrients.calories || 0) * 0.01;
    }

    return scoreB - scoreA; // Descending (highest score first)
  });
}

export type FoodOccurrence = {
  entity: FoodEntity;
  matchedText: string;
  startIndex: number;
  endIndex: number;
};

// Find all occurrences of food items in the text without deduplicating by canonical name
export function extractFoodEntityOccurrences(message: string, language?: "bangla_script" | "banglish" | "english"): FoodOccurrence[] {
  const lowerMsg = message.toLowerCase();
  const occurrences: FoodOccurrence[] = [];

  let resolvedLang = language;
  if (!resolvedLang) {
    if (/[\u0980-\u09FF]/.test(message)) {
      resolvedLang = "bangla_script";
    } else {
      resolvedLang = "banglish";
    }
  }

  for (const item of BANGLADESHI_FOODS) {
    for (const alias of item.aliases) {
      const normalizedAlias = alias.toLowerCase();
      if (!normalizedAlias || normalizedAlias.length < 2) continue;

      let pos = lowerMsg.indexOf(normalizedAlias);
      while (pos !== -1) {
        // Double check word boundaries for short aliases to avoid partial prefix matches (e.g. "alu" in "value")
        // We only check charBefore to support Bangla/Banglish suffixes like "dimer", "bhater", "biryanir"
        let isWordMatch = true;
        if (normalizedAlias.length <= 4) {
          const charBefore = pos > 0 ? lowerMsg[pos - 1] : " ";
          const isAlphaNumeric = (char: string) => /[a-zA-Z0-9]/.test(char) || /[\u0980-\u09FF]/.test(char);
          if (isAlphaNumeric(charBefore)) {
            isWordMatch = false;
          }
        }

        if (isWordMatch) {
          occurrences.push({
            entity: {
              canonicalName: item.canonicalName,
              banglaName: item.banglaName,
              matchedText: normalizedAlias,
              category: item.category,
              confidence: 1.0,
              nutritionRole: getLocalizedNutritionRole(item, resolvedLang!),
              healthNotes: getLocalizedHealthNotes(item, resolvedLang!),
              servingContext: item.servingContext,
              betterPrep: item.betterPrep,
              worsePrep: item.worsePrep,
              nutrients: item.nutrients,
              glycemicImpact: item.glycemicImpact,
              studentBudgetFriendly: item.studentBudgetFriendly,
            },
            matchedText: normalizedAlias,
            startIndex: pos,
            endIndex: pos + normalizedAlias.length,
          });
        }
        pos = lowerMsg.indexOf(normalizedAlias, pos + 1);
      }
    }
  }

  // word token fuzzy match
  // Split lowerMsg by whitespace, then strip trailing/leading punctuation for candidate extraction
  const tokens = lowerMsg.split(/\s+/).map(t => t.replace(/^[?.!,;:।]+|[?.!,;:।]+$/g, "")).filter(t => t.length > 2);
  const bigrams: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
  }

  const allCandidates = [...tokens, ...bigrams];

  for (const candidate of allCandidates) {
    const normCand = candidate.replace(/\s+/g, "");
    if (normCand.length < 3) continue;

    for (const item of BANGLADESHI_FOODS) {
      for (const alias of item.aliases) {
        const normAlias = alias.toLowerCase().replace(/\s+/g, "");
        if (normAlias.length < 3) continue;

        let matched = false;
        let confidence = 0.85;

        if (normCand === normAlias) {
          matched = true;
          confidence = 0.9;
        } else {
          const dist = getLevenshteinDistance(normCand, normAlias);
          const maxLen = Math.max(normCand.length, normAlias.length);
          const similarity = 1 - dist / maxLen;
          if (similarity >= 0.88) {
            matched = true;
            confidence = 0.85;
          }
        }

        if (matched) {
          let pos = lowerMsg.indexOf(candidate.toLowerCase());
          while (pos !== -1) {
            occurrences.push({
              entity: {
                canonicalName: item.canonicalName,
                banglaName: item.banglaName,
                matchedText: candidate,
                category: item.category,
                confidence,
                nutritionRole: getLocalizedNutritionRole(item, resolvedLang!),
                healthNotes: getLocalizedHealthNotes(item, resolvedLang!),
                servingContext: item.servingContext,
                betterPrep: item.betterPrep,
                worsePrep: item.worsePrep,
                nutrients: item.nutrients,
                glycemicImpact: item.glycemicImpact,
                studentBudgetFriendly: item.studentBudgetFriendly,
              },
              matchedText: candidate,
              startIndex: pos,
              endIndex: pos + candidate.length,
            });
            pos = lowerMsg.indexOf(candidate.toLowerCase(), pos + 1);
          }
        }
      }
    }
  }

  // Non-maximum suppression for occurrences
  occurrences.sort((a, b) => b.matchedText.length - a.matchedText.length);

  const finalOccurrences: FoodOccurrence[] = [];
  for (const occ of occurrences) {
    const isOverlapping = finalOccurrences.some(existing => {
      const hasOverlap = Math.max(occ.startIndex, existing.startIndex) < Math.min(occ.endIndex, existing.endIndex);
      return hasOverlap;
    });

    if (!isOverlapping) {
      finalOccurrences.push(occ);
    }
  }

  finalOccurrences.sort((a, b) => a.startIndex - b.startIndex);
  return finalOccurrences;
}

// Find start and end indices of all extracted food entities in the normalized message
export function getEntitiesWithIndices(message: string, language?: "bangla_script" | "banglish" | "english"): { entity: FoodEntity; startIndex: number; endIndex: number }[] {
  return extractFoodEntityOccurrences(message, language);
}

// Group entities into separate comparison categories
export function extractComparisonGroups(message: string, language?: "bangla_script" | "banglish" | "english"): FoodEntity[][] {
  const entitiesWithIndices = getEntitiesWithIndices(message, language);
  if (entitiesWithIndices.length === 0) return [];

  const groups: FoodEntity[][] = [];
  let currentGroup: FoodEntity[] = [entitiesWithIndices[0].entity];

  const COMPARISON_CONJUNCTIONS = [
    "na", "vs", "naki", "or", "ar", "and", "sathe", "shathe", "versus",
    "নাকি", "আর", "এবং", "না", "tulanay", "compare", "chap", "sath"
  ];

  for (let i = 1; i < entitiesWithIndices.length; i++) {
    const prev = entitiesWithIndices[i - 1];
    const curr = entitiesWithIndices[i];

    // Substring between the end of the previous match and start of current match in the raw message
    const gapText = message.substring(prev.endIndex, curr.startIndex);

    // Check if we should split
    let shouldSplit = false;

    // 1. Check for punctuation in the gap text
    if (/[?.!।\n;]/.test(gapText)) {
      shouldSplit = true;
    } else {
      // 2. Check if the gap is long and doesn't contain comparison conjunctions
      const cleanGap = gapText.toLowerCase().replace(/[?.!,]/g, " ").replace(/\s+/g, " ").trim();
      if (cleanGap.length > 15) {
        const hasConjunction = COMPARISON_CONJUNCTIONS.some(conj => {
          if (/[\u0980-\u09FF]/.test(conj)) {
            return cleanGap.includes(conj);
          }
          const regex = new RegExp(`\\b${conj}\\b`, "i");
          return regex.test(cleanGap);
        });

        if (!hasConjunction) {
          shouldSplit = true;
        }
      }
    }

    if (shouldSplit) {
      groups.push(currentGroup);
      currentGroup = [curr.entity];
    } else {
      currentGroup.push(curr.entity);
    }
  }

  groups.push(currentGroup);
  return groups;
}

// Detect if a message contains multiple separate questions or food comparison groups
export function detectMultipleQuestions(message: string): boolean {
  const groups = extractComparisonGroups(message);
  if (groups.length >= 2) return true;

  const segments = extractQuestionSegments(message);
  if (segments.length >= 2) return true;

  return false;
}

// Split message into segments based on sentence separators
export function extractQuestionSegments(message: string): string[] {
  return message
    .split(/[?.!।\n;]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

// Detect requested language or script preference
export function detectLanguagePreference(message: string): "bangla_script" | "banglish" | "english" | null {
  const text = message.toLowerCase();
  
  const banglaScriptIndicators = [
    "banglay", "bangla okkhore", "bangla letters", "bangla font", "bangla horof", "bangla script",
    "বাংলায়", "বাংলায়", "বাংলা অক্ষরে", "বাংলা হরফে", "banglai", "in bangla", "bangla okkhor"
  ];
  
  const banglishIndicators = [
    "banglish", "banglish e", "banglish ey", "banglish okkhore", "banglish letters"
  ];
 
  const englishIndicators = [
    "english", "english e", "english ey", "in english", "english letters"
  ];
 
  if (banglaScriptIndicators.some(ind => text.includes(ind))) {
    return "bangla_script";
  }
  if (banglishIndicators.some(ind => text.includes(ind))) {
    return "banglish";
  }
  if (englishIndicators.some(ind => text.includes(ind))) {
    return "english";
  }
  
  return null;
}

// Detect if the user specifically asked for calorie/protein counts or per-100g breakdown
export function detectDetailedNutritionRequest(message: string): boolean {
  const text = message.toLowerCase();
  return (
    text.includes("nutrition value") ||
    text.includes("calorie koto") ||
    text.includes("protein koto") ||
    text.includes("per 100g") ||
    text.includes("macro details") ||
    text.includes("পুষ্টিগুণ") ||
    text.includes("ক্যালরি কত") ||
    text.includes("প্রোটিন কত") ||
    text.includes("১০০ গ্রাম") ||
    text.includes("100g") ||
    text.includes("macro detail") ||
    text.includes("nutrition fact")
  );
}
