import type { MessageIntent } from "@/lib/intent-classifier";
import type { NutritionSearchResult } from "@/lib/nutrition-data.server";
import { FoodEntity, rankFoodsLocally, detectDetailedNutritionRequest } from "./bangladeshi-food-knowledge";

export type MedicineLookupResult = {
  query: string;
  rxcui?: string;
  name?: string;
  candidates: Array<{ rxcui: string; name: string }>;
  sourceLabel: string;
  error?: string;
};

export type OpenFdaLookupResult = {
  query: string;
  brandNames: string[];
  genericNames: string[];
  purposes: string[];
  indications: string[];
  warnings: string[];
  dosage: string[];
  sourceLabel: string;
  error?: string;
};

export type ConditionLookupResult = {
  query: string;
  matches: Array<{ title: string; code?: string; uri?: string }>;
  sourceLabel: string;
  error?: string;
};

function round(value: number | undefined, digits = 0) {
  if (!Number.isFinite(value)) return "0";
  return Number(value).toFixed(digits).replace(/\.0+$/, "");
}

export function nutritionTemplate(
  result: NutritionSearchResult,
  language: "bangla_script" | "banglish" | "english" = "banglish"
) {
  const n = result.nutrition;
  const cVal = round(n.calories);
  const pGrams = round(result.portion_grams);
  const pName = result.portion;
  const protein = round(n.protein_g, 1);
  const carbs = round(n.carbs_g, 1);
  const fat = round(n.fat_g, 1);
  const fiber = round(n.fiber_g, 1);
  const iron = round(n.iron_mg, 1);
  const sodium = round(n.sodium_mg);

  if (language === "bangla_script") {
    return [
      result.name + "-এর পুষ্টির তথ্য (nutrition facts):",
      "ক্যালরি: " + cVal + " কিলোক্যালরি (প্রায় " + pGrams + " গ্রাম, " + pName + ")।",
      "ম্যাক্রোস: " + protein + " গ্রাম প্রোটিন, " + carbs + " গ্রাম কার্বস, " + fat + " গ্রাম ফ্যাট, " + fiber + " গ্রাম ফাইবার।",
      "প্রধান খনিজ: " + iron + " মিলিগ্রাম আয়রন, " + sodium + " মিলিগ্রাম সোডিয়াম।",
    ].filter(Boolean).join("\n");
  }

  if (language === "english") {
    return [
      result.name + " nutrition facts:",
      "Calories: " + cVal + " kcal (about " + pGrams + "g, " + pName + ").",
      "Macros: " + protein + "g protein, " + carbs + "g carbs, " + fat + "g fat, " + fiber + "g fiber.",
      "Key minerals: " + iron + "mg iron, " + sodium + "mg sodium.",
    ].filter(Boolean).join("\n");
  }

  // Default: Banglish
  return [
    result.name + " er nutrition facts:",
    "Calories: " + cVal + " kcal (about " + pGrams + "g, " + pName + ").",
    "Macros: " + protein + "g protein, " + carbs + "g carbs, " + fat + "g fat, " + fiber + "g fiber.",
    "Key minerals: " + iron + "mg iron, " + sodium + "mg sodium.",
  ].filter(Boolean).join("\n");
}

export function medicineTemplate(
  rx?: MedicineLookupResult,
  fda?: OpenFdaLookupResult,
  language: "bangla_script" | "banglish" | "english" = "banglish"
) {
  if (language === "bangla_script") {
    if (rx?.error && fda?.error) return "ওষুধের তথ্য এখন পাওয়া যাচ্ছে না। General nutrition guidance — not medical advice.";
    const lines = ["ওষুধের তথ্যসূত্র (Medicine reference info):"];
    if (rx && !rx.error) {
      lines.push("নাম: " + (rx.name || rx.query) + "।");
    }
    if (fda && !fda.error) {
      if (fda.genericNames.length) lines.push("জেনেরিক নাম: " + fda.genericNames.slice(0, 3).join(", ") + "।");
      if (fda.brandNames.length) lines.push("ব্র্যান্ডের নাম: " + fda.brandNames.slice(0, 3).join(", ") + "।");
      if (fda.warnings.length) lines.push("সতর্কবার্তা: " + fda.warnings[0]);
      if (fda.dosage.length) lines.push("ডোজের নিয়ম: " + fda.dosage[0]);
    }
    lines.push("General nutrition guidance — not medical advice.");
    return lines.join("\n");
  }

  if (language === "english") {
    if (rx?.error && fda?.error) return "Medicine info is currently unavailable. General nutrition guidance — not medical advice.";
    const lines = ["Medicine reference info:"];
    if (rx && !rx.error) {
      lines.push("Name: " + (rx.name || rx.query) + ".");
    }
    if (fda && !fda.error) {
      if (fda.genericNames.length) lines.push("Generic name: " + fda.genericNames.slice(0, 3).join(", ") + ".");
      if (fda.brandNames.length) lines.push("Brand names: " + fda.brandNames.slice(0, 3).join(", ") + ".");
      if (fda.warnings.length) lines.push("Warning: " + fda.warnings[0]);
      if (fda.dosage.length) lines.push("Dosage note: " + fda.dosage[0]);
    }
    lines.push("General nutrition guidance — not medical advice.");
    return lines.join("\n");
  }

  // Default: Banglish
  if (rx?.error && fda?.error) return "Medicine info ekhon available na. General nutrition guidance — not medical advice.";
  const lines = ["Medicine reference info:"];
  if (rx && !rx.error) {
    lines.push("Name: " + (rx.name || rx.query) + ".");
  }
  if (fda && !fda.error) {
    if (fda.genericNames.length) lines.push("Generic name: " + fda.genericNames.slice(0, 3).join(", ") + ".");
    if (fda.brandNames.length) lines.push("Brand names: " + fda.brandNames.slice(0, 3).join(", ") + ".");
    if (fda.warnings.length) lines.push("Warning: " + fda.warnings[0]);
    if (fda.dosage.length) lines.push("Dosage note: " + fda.dosage[0]);
  }
  lines.push("General nutrition guidance — not medical advice.");
  return lines.join("\n");
}

export function conditionTemplate(
  result: ConditionLookupResult,
  language: "bangla_script" | "banglish" | "english" = "banglish"
) {
  if (language === "bangla_script") {
    if (result.error || !result.matches.length) {
      return "এই রোগের তথ্য এখন পাওয়া যাচ্ছে না। General nutrition guidance — not medical advice.";
    }
    const top = result.matches[0];
    return [
      result.query + "-এর স্বাস্থ্য নির্দেশিকা (health reference):",
      top.title + (top.code ? " (" + top.code + ")" : "") + "।",
      "General nutrition guidance — not medical advice.",
    ].join("\n");
  }

  if (language === "english") {
    if (result.error || !result.matches.length) {
      return "Info for this condition is currently unavailable. General nutrition guidance — not medical advice.";
    }
    const top = result.matches[0];
    return [
      result.query + " health reference:",
      top.title + (top.code ? " (" + top.code + ")" : "") + ".",
      "General nutrition guidance — not medical advice.",
    ].join("\n");
  }

  // Default: Banglish
  if (result.error || !result.matches.length) return "Ei condition er info ekhon dhora jacche na. General nutrition guidance — not medical advice.";
  const top = result.matches[0];
  return [
    result.query + " er health reference:",
    top.title + (top.code ? " (" + top.code + ")" : "") + ".",
    "General nutrition guidance — not medical advice.",
  ].join("\n");
}

export function healthSafeFoodRecommendationTemplate(
  message: string,
  language: "bangla_script" | "banglish" | "english" = "banglish"
) {
  const text = message.toLowerCase();
  
  if (language === "bangla_script") {
    let advice = "স্বাস্থ্যের জন্য সাধারণ গাইডলাইন: ";
    if (text.includes("mangsho") || text.includes("meat")) {
      advice += "মাংসের ক্ষেত্রে চামড়া ছাড়া মুরগি বা লোকাল মাছ ভালো। গরু/খাসি এবং প্রসেসড মাংস এড়িয়ে চলুন।";
    } else {
      advice += "ডিম, ডাল বা লোকাল মাছ সাশ্রয়ী প্রোটিনের ভালো উৎস।";
    }
    return advice;
  }

  if (language === "english") {
    let advice = "General health guideline: ";
    if (text.includes("mangsho") || text.includes("meat")) {
      advice += "For meat, prefer skinless chicken or local fish. Avoid beef/mutton and processed meat if cholesterol is a concern.";
    } else {
      advice += "Eggs, lentils (dal), or local fish are great budget-friendly protein sources.";
    }
    return advice;
  }

  // Default: Banglish
  let advice = "General health guideline: ";
  if (text.includes("mangsho") || text.includes("meat")) {
    advice += "Mangsho hole skinless chicken ba local fish better. Beef/mutton ar processed meat avoid kora bhalo.";
  } else {
    advice += "Dim, dal, ba local fish — budget er moddhe bhalo protein options.";
  }
  return advice;
}

export function generalChatTemplate(
  message: string,
  language: "bangla_script" | "banglish" | "english" = "banglish"
) {
  const text = message.toLowerCase().trim();

  if (language === "bangla_script") {
    if (/^(hi|hello|hey|salam|assalamu|assalamu alaikum|hola|namaste)$/.test(text)) {
      return "আসসালামু আলাইকুম! আমি নানুমণি 🌿 দেশি খাবার, পুষ্টি বা স্বাস্থ্য নিয়ে কিছু জানতে চাইলে বলুন — আমি আছি!";
    }
    if (/nanu/i.test(text) && text.length < 10) {
      return "জি, শুনছি! দেশি খাবার বা স্বাস্থ্য নিয়ে কোনো পরামর্শ দরকার?";
    }
    return "আমি দেশি খাবারের পুষ্টিগুণ নিয়ে সাহায্য করতে পারি। কী জানতে চান বলুন!";
  }

  if (language === "english") {
    if (/^(hi|hello|hey|salam|assalamu|assalamu alaikum|hola|namaste)$/.test(text)) {
      return "Hello! I am Nanumoni 🌿 If you want to know about Deshi food or health, just ask — I'm here to help!";
    }
    if (/nanu/i.test(text) && text.length < 10) {
      return "Yes, I'm here! Do you need any advice on Deshi food or health?";
    }
    return "I can help with Deshi food nutrition or healthy meal ideas. Tell me what you'd like to know!";
  }

  // Default: Banglish
  if (/^(hi|hello|hey|salam|assalamu|assalamu alaikum|hola|namaste)$/.test(text)) {
    return "Assalamu Alaikum, shona! Ami Nanumoni 🌿 Deshi khabar ba health niye kichu jante chaile bolun — ami achi!";
  }
  if (/nanu/i.test(text) && text.length < 10) {
    return "Ji, shunchi! Deshi khabar ba health niye kono poramorsho dorkar?";
  }
  return "Ami Deshi khabar, nutrition facts ba condition-aware meal ideas niye help korte pari. Ki jante chan bolun!";
}

export function unknownTemplate(language: "bangla_script" | "banglish" | "english" = "banglish") {
  if (language === "bangla_script") {
    return "হুম, এটা নিয়ে নিশ্চিত নই — তবে দেশি পুষ্টি বা খাবারের আইডিয়া নিয়ে সাহায্য করতে পারি! আপনি কী জানতে চান একটু স্পষ্ট করে বলবেন কি?";
  }
  if (language === "english") {
    return "Hmm, I'm not sure about that — but I can help with Deshi nutrition or meal ideas! Could you clarify what you'd like to know?";
  }
  return "Hmm, eta niye sure na — but Deshi nutrition ba meal ideas niye help korte pari! Ektu clear kore bolben ki jante chan?";
}

export function foodComparisonTemplate(
  entities: FoodEntity[],
  userGoal?: string,
  language: "bangla_script" | "banglish" | "english" = "banglish",
  groups?: FoodEntity[][],
  rawMessage?: string
): string {
  if (entities.length === 0) {
    if (language === "bangla_script") {
      return "আপনি কোন খাবারগুলোর তুলনা করতে চান? দয়া করে নামগুলো বলুন।";
    }
    if (language === "english") {
      return "Which foods would you like to compare? Please tell me their names.";
    }
    return "Apni kon khabar gulor tulona korte chan? Doya kore nam gulo bolun.";
  }

  const actualGroups = groups || [entities];
  const showMacros = rawMessage ? detectDetailedNutritionRequest(rawMessage) : false;

  let text = "";
  if (actualGroups.length >= 2) {
    if (language === "bangla_script") {
      text += "একসাথে কয়েকটা প্রশ্ন করেছেন, তাই ছোট করে বলছি—\n\n";
    } else if (language === "english") {
      text += "You asked a few things together, so I'll keep it short—\n\n";
    } else {
      text += "Ek sathe koyekta question korechen, tai short kore bolchi—\n\n";
    }
  }

  for (let i = 0; i < actualGroups.length; i++) {
    const group = actualGroups[i];
    if (group.length === 0) continue;

    // Only compare up to 5 groups in the fallback to keep it brief
    if (i >= 5) {
      if (language === "bangla_script") {
        text += "\nঅন্য প্রশ্নগুলোর জন্য দয়া করে আলাদাভাবে জিজ্ঞেস করুন।";
      } else if (language === "english") {
        text += "\nPlease ask separately for the remaining questions.";
      } else {
        text += "\nOnno question gulor jonno doya kore alada vabe jiggesh korun.";
      }
      break;
    }

    const ranked = rankFoodsLocally(group, userGoal);
    const best = ranked[0];

    // If it's a comparison group with multiple items
    if (group.length >= 2) {
      const worst = ranked[ranked.length - 1];
      
      if (language === "bangla_script") {
        text += `**${best.banglaName}** ভালো পছন্দ হবে।\n\n`;
        text += `কারণ: ${best.healthNotes}\n\n`;
        text += `${worst.banglaName} খাওয়া যাবে, তবে ${worst.worsePrep} এড়িয়ে চলা ভালো।\n\n`;
        text += `পরামর্শ: ${best.servingContext}\n\n`;
        
        if (showMacros) {
          for (const f of ranked) {
            text += `  - ${f.banglaName}: প্রতি ১০০ গ্রামে প্রায় ${f.nutrients.calories} ক্যালরি, ${f.nutrients.protein}g প্রোটিন, ${f.nutrients.carbs}g কার্বস।\n`;
          }
          text += "\n";
        }
      } else if (language === "english") {
        text += `**${best.canonicalName}** is the better choice.\n\n`;
        text += `Reason: ${best.healthNotes}\n\n`;
        text += `${worst.canonicalName} is okay, but avoid ${worst.worsePrep.toLowerCase()}.\n\n`;
        text += `Tip: ${best.servingContext}\n\n`;
        
        if (showMacros) {
          for (const f of ranked) {
            text += `  - ${f.canonicalName}: ~${f.nutrients.calories} kcal, ${f.nutrients.protein}g protein, ${f.nutrients.carbs}g carbs.\n`;
          }
          text += "\n";
        }
      } else {
        text += `**${best.canonicalName}** bhalo choice hobe.\n\n`;
        text += `Reason: ${best.healthNotes}\n\n`;
        text += `${worst.canonicalName} khawa jabe, but ${worst.worsePrep.toLowerCase()} avoid kora bhalo.\n\n`;
        text += `Tip: ${best.servingContext}\n\n`;
        
        if (showMacros) {
          for (const f of ranked) {
            text += `  - ${f.canonicalName}: ~${f.nutrients.calories} kcal, ${f.nutrients.protein}g protein, ${f.nutrients.carbs}g carbs.\n`;
          }
          text += "\n";
        }
      }
    } else {
      // Single item in this group
      const f = group[0];
      if (language === "bangla_script") {
        text += `**${f.banglaName}** সম্পর্কে:\nকারণ: ${f.healthNotes}\nপরামর্শ: ${f.servingContext}\n\n`;
        if (showMacros) {
          text += `  - প্রতি ১০০ গ্রামে প্রায় ${f.nutrients.calories} ক্যালরি, ${f.nutrients.protein}g প্রোটিন, ${f.nutrients.carbs}g কার্বস।\n`;
        }
      } else if (language === "english") {
        text += `About **${f.canonicalName}**:\nReason: ${f.healthNotes}\nTip: ${f.servingContext}\n\n`;
        if (showMacros) {
          text += `  - ~${f.nutrients.calories} kcal, ${f.nutrients.protein}g protein, ${f.nutrients.carbs}g carbs.\n`;
        }
      } else {
        text += `**${f.canonicalName}** somporke:\nReason: ${f.healthNotes}\nTip: ${f.servingContext}\n\n`;
        if (showMacros) {
          text += `  - ~${f.nutrients.calories} kcal, ${f.nutrients.protein}g protein, ${f.nutrients.carbs}g carbs.\n`;
        }
      }
    }
  }

  return text.trim();
}

export function sourceLabelForIntent(intent: MessageIntent) {
  if (intent === "nutrition") return "Nutrition reference";
  if (intent === "medicine") return "Medicine reference";
  if (intent === "condition") return "Health reference";
  if (intent === "health_safe_food_recommendation") return "Health guidelines";
  if (intent === "food_comparison") return "Nutrition reference";
  if (intent === "milk_dairy") return "Nutrition reference";
  if (intent === "rice_comparison") return "Nutrition reference";
  if (intent === "meat_comparison") return "Nutrition reference";
  if (intent === "budget_protein") return "Nutrition reference";
  if (intent === "fish_roe") return "Nutrition reference";
  if (intent === "fruit_comparison") return "Nutrition reference";
  return "Nanumoni";
}

export function milkDairyTemplate(
  language: "bangla_script" | "banglish" | "english" = "banglish",
  message: string = ""
) {
  const text = message.toLowerCase();
  
  // Specific query handling: rate anarosh ar dudh eksathe khele issue hobe
  const hasAnarosh = /(anarosh|anaras|pineapple|আনারস)/i.test(text);

  if (language === "bangla_script") {
    if (hasAnarosh) {
      return [
        "আনারস এবং দুধ একসাথে খেলে বিষক্রিয়া হয়—এই ধারণাটি একটি প্রচলিত ভুল ধারণা (myth)। তবে আনারসের অ্যাসিড এবং দুধ একসাথে মিললে পেট খারাপ, গ্যাস বা বদহজম হতে পারে। তাই সতর্কতার জন্য দুটি একসাথে না খেয়ে কিছু সময় বিরতি দিয়ে খাওয়া ভালো।",
        "গরুর দুধে প্রোটিন, ক্যালসিয়াম, ভিটামিন বি১২ এবং ফসফরাস থাকে। রেগুলার এটি খেতে পারেন, তবে ডায়াবেটিস বা ওজন কমানোর সমস্যা থাকলে চিনি ছাড়া লো-ফ্যাট দুধ খাওয়া ভালো। কনডেন্সড মিল্ক বা মিষ্টি দেওয়া দুধ এড়িয়ে চলুন।",
        "General nutrition guidance — not medical advice."
      ].join("\n\n");
    }

    return [
      "গরুর দুধে প্রোটিন, ক্যালসিয়াম, ভিটামিন বি১২ এবং ফসফরাস থাকে যা হাড় ও দাঁতের গঠনের জন্য অত্যন্ত উপকারী। রেগুলার এটি খেতে পারেন, তবে ডায়াবেটিস বা ওজন কমানোর সমস্যা থাকলে চিনি ছাড়া লো-ফ্যাট দুধ খাওয়া ভালো।",
      "কনডেন্সড মিল্ক বা চিনি-মিশানো দুধ এড়িয়ে চলা উচিত, কারণ এগুলো রক্তে শর্করা দ্রুত বাড়ায়।",
      "General nutrition guidance — not medical advice."
    ].join("\n\n");
  }

  if (language === "english") {
    if (hasAnarosh) {
      return [
        "Eating pineapple (anarosh) and milk together causing poison is a common myth. However, the bromelain and acid in pineapple can curdle the milk in your stomach, which may cause mild indigestion, bloating, or stomach upset.",
        "Gorur dudh contains protein, calcium, vitamin B12, and phosphorus. You can consume it regularly, but if you have diabetes or weight loss goals, sugar-free low-fat milk is better. Avoid condensed milk or heavily sweetened milk.",
        "General nutrition guidance — not medical advice."
      ].join("\n\n");
    }

    return [
      "Gorur dudh contains protein, calcium, vitamin B12, and phosphorus which are essential for bone and muscle health. You can consume it regularly.",
      "If you have diabetes or weight loss goals, sugar-free low-fat milk is better. Avoid condensed milk or sweetened milk options.",
      "General nutrition guidance — not medical advice."
    ].join("\n\n");
  }

  // Default: Banglish
  if (hasAnarosh) {
    return [
      "Anarosh (pineapple) ar dudh eksathe khele bishkriya ba poison hoy—eta ekta bhalo myth ba vul dharona. Tobe anarosh er acid and bromelain enzyme dudh ke curdled kore fele, ja khavar por pet kharap, gas, ba badhojom (indigestion) korte pare. So safety er jonno eksathe na kheye ektu gap diye khawa better.",
      "Gorur dudh e protein, calcium, vitamin B12, phosphorus thake. Regular khete paren, but diabetes/weight loss thakle chini chara low-fat dudh bhalo. Condensed milk ba chini-mishano dudh avoid kora better.",
      "General nutrition guidance — not medical advice."
    ].join("\n\n");
  }

  return [
    "Gorur dudh e protein, calcium, vitamin B12, phosphorus thake. Regular khete paren, but diabetes/weight loss thakle chini chara low-fat dudh bhalo. Condensed milk ba chini-mishano dudh avoid kora better.",
    "Bachar bone health and protein intake er jonno dudh khub e bhalo option, tobe poriman moto khawa bhalo.",
    "General nutrition guidance — not medical advice."
  ].join("\n\n");
}

export function riceComparisonTemplate(
  language: "bangla_script" | "banglish" | "english" = "banglish",
  message: string = ""
) {
  if (language === "bangla_script") {
    return [
      "রেগুলার খাওয়ার জন্য মিনিকেট, নাজিরশাইল বা ২৮ চাল চিনিগুঁড়ার চেয়ে ভালো। কারণ চিনিগুঁড়া সুগন্ধি চাল যা মূলত পোলাও বা বিরিয়ানির মতো বিশেষ খাবার তৈরির জন্য ব্যবহৃত হয় এবং এটি রেগুলার খাওয়া উচিত নয়।",
      "মিনিকেট, নাজিরশাইল বা ২৮ চাল আপনার বাজেট ও হজম ক্ষমতা অনুযায়ী রেগুলার খাওয়ার জন্য ভালো অপশন। তবে ডায়াবেটিস বা ওজন কমানোর সমস্যা থাকলে পরিমাণ নিয়ন্ত্রণ করা অত্যন্ত জরুরি: ১ কাপ রান্না করা ভাতের (cooked rice) বেশি না খেয়ে সাথে পর্যাপ্ত ডাল, ডিম/মাছ এবং শাকসবজি খাওয়া উচিত।",
      "সব ধরণের সাদা ভাতই রক্তে শর্করা (blood sugar) বাড়াতে পারে, তাই ভাতের সাথে পর্যাপ্ত প্রোটিন ও ফাইবার (শাকসবজি) রাখা প্রয়োজন।",
      "General nutrition guidance — not medical advice."
    ].join("\n\n");
  }

  if (language === "english") {
    return [
      "For regular consumption, Miniket, Nazirshail, or 28 rice are usually better options than Chinigura. Chinigura is an aromatic rice mostly used for special dishes like pulao or biryani, making it less suitable for daily meals.",
      "Miniket, Nazirshail, or 28 rice are good choices depending on your budget and digestion. If you have diabetes or are aiming for weight loss, portion control is very important: keep it to 1 cup of cooked rice per meal, paired with dal, fish/egg, and vegetables.",
      "Since all white rice can raise blood sugar, balancing it with protein and fiber is key to a healthy diet.",
      "General nutrition guidance — not medical advice."
    ].join("\n\n");
  }

  // Default: Banglish
  return [
    "Regular khawar jonno Miniket/Nazirshail/28 rice usually better than Chinigura, because Chinigura aromatic rice mostly special dishes like pulao/biryani er jonno. Chinigura special/occasional khawa bhalo, tobe regular khawar jonno Miniket/Nazirshail/28 budget ar digestion er opor vitti kore choose korte paren.",
    "Diabetes/weight loss thakle portion control important: 1 cup cooked rice er beshi na, sathe dal, fish/egg, shak-sobji khawa bhalo.",
    "All white rice e blood sugar badhte pare, tai portion check kora and protein + fiber active rakha dorkar.",
    "General nutrition guidance — not medical advice."
  ].join("\n\n");
}

export function budgetProteinTemplate(
  language: "bangla_script" | "banglish" | "english" = "banglish",
  message: string = ""
) {
  const text = message.toLowerCase();
  const hasUlcer = /(ulcer|gastric|gastrick|পেট\s*ব্যথা|আলসার)/i.test(text);

  if (language === "bangla_script") {
    if (hasUlcer) {
      return [
        "কম বাজেটের মধ্যে প্রোটিন পেতে চাইলে ডিম, মসুর ডাল এবং লোকাল ছোট মাছ (যেমন রুই, মলা, পুঁটি) সবচেয়ে ভালো অপশন। এগুলো সহজে হজম হয় এবং পুষ্টিগুণে ভরপুর।",
        "যেহেতু আপনার আলসারের সমস্যা রয়েছে, তাই অতিরিক্ত তেল, ঝাল, ও মসলা দিয়ে রান্না করা খাবার এড়িয়ে চলুন। সিঙ্গারা, পুরি বা ডুবো তেলে ভাজা খাবার একদম খাওয়া যাবে না। ডাল বা মাছ পাতলা ঝোল করে রান্না করে খাওয়া ভালো।",
        "General nutrition guidance — not medical advice."
      ].join("\n\n");
    }

    return [
      "সাশ্রয়ী বাজেটের মধ্যে প্রোটিনের জন্য ডিম ও মসুর ডাল সবচেয়ে সেরা অপশন। এছাড়া লোকাল মাছ যেমন রুই, পাঙ্গাস বা মলা মাছও বাজেটের মধ্যে ভালো প্রোটিন সরবরাহ করে।",
      "পেশি গঠন বা শক্তির জন্য এগুলো রেগুলার ডায়েটে রাখতে পারেন। ডুবো তেলে ভাজার চেয়ে সেদ্ধ ডিম বা হালকা ঝোল করে রান্না করা মাছ বেশি স্বাস্থ্যকর।",
      "General nutrition guidance — not medical advice."
    ].join("\n\n");
  }

  if (language === "english") {
    if (hasUlcer) {
      return [
        "For budget-friendly protein sources, eggs, red lentils (dal), and local fish (like rui, mola, or puti) are excellent choices. They are highly nutritious and affordable.",
        "Since you have an ulcer, please avoid heavy oil, chili, and spices. Do not eat deep-fried street food like singara or puri. Lightly cooked fish curries (jhol) or boiled eggs are much safer and easier to digest.",
        "General nutrition guidance — not medical advice."
      ].join("\n\n");
    }

    return [
      "For a tight budget, eggs and red lentils (dal) are the most cost-effective protein sources. Local fish like rui or mola are also affordable options.",
      "Cooking eggs boiled or poached and fish as light curries is healthier than deep-frying them.",
      "General nutrition guidance — not medical advice."
    ].join("\n\n");
  }

  // Default: Banglish
  if (hasUlcer) {
    return [
      "Kom budget er moddhe protein source bolte dim, dal, ar local fish (rui, mola, puti) khub e bhalo choice. 150 tk budget er moddhe egulo khub sahajei paoya jay.",
      "Apnar ulcer thakle beshi jhal, tel-mosla chara halka ranna kora khabar khete hobe. Fried food (singara, puri) or oily curry bilkul avoid korun. Sheddho dim ba macher patla jhol peter jonno safe.",
      "General nutrition guidance — not medical advice."
    ].join("\n\n");
  }

  return [
    "Kom budget er moddhe protein source bolte dim, dal, ar local fish (rui, mola, puti) best option. Egulo protein and nutrition er bhalo utsho.",
    "Daily diet e sheddho dim ba patla dal rakhte paren, ja body er energy requirement pura korbe.",
    "General nutrition guidance — not medical advice."
  ].join("\n\n");
}

export function fishRoeTemplate(
  language: "bangla_script" | "banglish" | "english" = "banglish",
  message: string = ""
) {
  if (language === "bangla_script") {
    return [
      "কম খরচে মাছের ডিমের মধ্যে ইলিশ মাছের ডিম অত্যন্ত সুস্বাদু এবং ওমেগা-৩ ফ্যাটি অ্যাসিড সমৃদ্ধ, তবে এতে ফ্যাট ও ক্যালরি তুলনামূলক বেশি হতে পারে। রুই মাছের ডিম সাধারণত কিছুটা হালকা এবং নিয়মিত খাওয়ার জন্য একটি নিরাপদ ও সাশ্রয়ী অপশন।",
      "ডায়াবেটিস, ওজন কমানো বা হার্টের সমস্যা থাকলে ডুবো তেলে ভাজা মাছের ডিম এড়িয়ে চলা উচিত; এর বদলে কম তেলে রান্না করে খাওয়া ভালো। তবে নিয়মিত প্রোটিনের চাহিদা মেটাতে মাছের ডিমের চেয়ে আস্ত মাছের মাংস, সাধারণ ডিম বা ডাল বেশি সুষম ও স্বাস্থ্যকর পছন্দ।",
      "General nutrition guidance — not medical advice."
    ].join("\n\n");
  }

  if (language === "english") {
    return [
      "Ilish fish roe (macher dim) is tasty and rich in omega-3 fatty acids, but it can be higher in fat and calories. Rui fish roe is usually lighter and slightly safer/more affordable for regular eating.",
      "If you have diabetes, weight loss, or heart health goals, avoid deep-fried fish roe; lightly cooked options are better. For daily protein requirements, whole fish meat, normal eggs, or lentils (dal) are more balanced choices.",
      "General nutrition guidance — not medical advice."
    ].join("\n\n");
  }

  // Default: Banglish
  return [
    "Ilish macher dim tasty and omega-fat rich, but fat/calorie beshi hote pare. Rui macher dim usually lighter and regular eating er jonno slightly safer/affordable option.",
    "Diabetes/weight loss/heart health thakle deep fried macher dim avoid kore kom tel e ranna better. Regular protein er jonno fish meat, dim, dal/lentils beshi balanced choice.",
    "General nutrition guidance — not medical advice."
  ].join("\n\n");
}

export function fruitComparisonTemplate(
  language: "bangla_script" | "banglish" | "english" = "banglish",
  message: string = ""
) {
  if (language === "bangla_script") {
    return [
      "আপনি যদি ক্যাকটাস ফল বা ড্রাগন ফল বুঝিয়ে থাকেন, তবে ডায়াবেটিস বা ওজন কমানোর জন্য ড্রাগন ফল সাধারণত আমের চেয়ে বেশি উপকারী। কারণ ড্রাগন ফলে সুগার বা মিষ্টির পরিমাণ কম এবং ফাইবার বা আঁশ বেশি থাকে।",
      "আমও পুষ্টিকর ফল এবং খাওয়া যাবে, তবে রক্তে শর্করা নিয়ন্ত্রণ এবং ওজন ঠিক রাখতে আমের অংশ বা পরিমাণ ছোট রাখা উচিত (portion control)।",
      "General nutrition guidance — not medical advice."
    ].join("\n\n");
  }

  if (language === "english") {
    return [
      "If you mean cactus fruit or dragon fruit, dragon fruit is usually better than mango for diabetes or weight loss because it is lower in sugar and higher in fiber.",
      "Mangoes are highly nutritious and can be eaten, but portion control is essential: keep the portion size small to manage blood sugar.",
      "General nutrition guidance — not medical advice."
    ].join("\n\n");
  }

  // Default: Banglish
  return [
    "Apni jodi cactus fruit/dragon fruit bujhan, tahole diabetes/weight loss er jonno dragon fruit usually mango er cheye better because sugar kom and fiber beshi. Mango khawa jabe, but portion choto.",
    "Bachar protein or raw fiber components er sathe fruit balance kora safe diet er key feature.",
    "General nutrition guidance — not medical advice."
  ].join("\n\n");
}
