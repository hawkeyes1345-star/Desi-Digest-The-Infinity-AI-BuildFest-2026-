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
    if (rx?.error && fda?.error) return "ওষুধের তথ্য এখন পাওয়া যাচ্ছে না। দয়া করে ডাক্তার বা ফার্মাসিস্টের সাথে কথা বলুন।";
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
    lines.push("এটি ওষুধের লেবেল থেকে নেওয়া তথ্য — কোনো চিকিৎসা পরামর্শ নয়। ওষুধ পরিবর্তনের আগে ডাক্তারের সাথে পরামর্শ করুন।");
    return lines.join("\n");
  }

  if (language === "english") {
    if (rx?.error && fda?.error) return "Medicine info is currently unavailable. Please talk to a doctor or pharmacist.";
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
    lines.push("This is drug label info — not medical advice. Consult a doctor or pharmacist before changing medications.");
    return lines.join("\n");
  }

  // Default: Banglish
  if (rx?.error && fda?.error) return "Medicine info ekhon available na. Pharmacist ba doctor er shathe kotha bolun medicine niye.";
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
  lines.push("Eta drug label info — medical advice na. Doctor ba pharmacist er shathe kotha bolun medicine change korar age.");
  return lines.join("\n");
}

export function conditionTemplate(
  result: ConditionLookupResult,
  language: "bangla_script" | "banglish" | "english" = "banglish"
) {
  if (language === "bangla_script") {
    if (result.error || !result.matches.length) {
      return "এই রোগের তথ্য এখন পাওয়া যাচ্ছে না। সাধারণ পুষ্টিকর খাবার নিয়ে সাহায্য করতে পারি — তবে রোগ নিশ্চিত হতে ডাক্তারের পরামর্শ নিন।";
    }
    const top = result.matches[0];
    return [
      result.query + "-এর স্বাস্থ্য নির্দেশিকা (health reference):",
      top.title + (top.code ? " (" + top.code + ")" : "") + "।",
      "রোগের ওপর ভিত্তি করে ডায়েট ঠিক করতে ডাক্তারের পরামর্শ মেনে চলুন।",
    ].join("\n");
  }

  if (language === "english") {
    if (result.error || !result.matches.length) {
      return "Info for this condition is currently unavailable. I can help with general healthy eating, but please consult a doctor for diagnosis.";
    }
    const top = result.matches[0];
    return [
      result.query + " health reference:",
      top.title + (top.code ? " (" + top.code + ")" : "") + ".",
      "Please follow a doctor's advice for condition-based diets.",
    ].join("\n");
  }

  // Default: Banglish
  if (result.error || !result.matches.length) return "Ei condition er info ekhon dhora jacche na. General healthy eating niye help korte pari — but doctor er shathe confirm korun diagnosis er jonno.";
  const top = result.matches[0];
  return [
    result.query + " er health reference:",
    top.title + (top.code ? " (" + top.code + ")" : "") + ".",
    "Condition-based diet er jonno doctor er poramorsho follow korun.",
  ].join("\n");
}

export function healthSafeFoodRecommendationTemplate(
  message: string,
  language: "bangla_script" | "banglish" | "english" = "banglish"
) {
  const text = message.toLowerCase();

  if (language === "bangla_script") {
    let advice = "বুঝলাম — আপনি স্বাস্থ্যকর এবং সাশ্রয়ী অপশন খুঁজছেন। ";
    if (text.includes("mangsho") || text.includes("meat")) {
      advice += "মাংস খেতে চাইলে চামড়া ছাড়া মুরগি বা লোকাল মাছ সবচেয়ে ভালো। হার্ট বা কোলেস্টেরলের সমস্যা থাকলে গরুর/খাসির মাংস কম খাওয়া ভালো। প্রসেসড মাংস এড়িয়ে চলুন।";
    } else {
      advice += "ডিম, ডাল বা লোকাল মাছ — বাজেটের মধ্যে সবচেয়ে ভালো প্রোটিনের উৎস।";
    }
    advice += "\n\nটিপস:\n- কম তেল ও কম লবণে রান্না করুন।\n- খাবারের পরিমাণ নিয়ন্ত্রণ করা স্বাস্থ্যের জন্য জরুরি।\n- প্রসেসড খাবার এড়িয়ে চলুন।";
    advice += "\n\n_সাধারণ পরামর্শ — কোনো গুরুতর সমস্যা থাকলে ডাক্তার বা ডায়েটিশিয়ানের পরামর্শ নিন।_";
    return advice;
  }

  if (language === "english") {
    let advice = "I understand — you are looking for healthy and budget-friendly options. ";
    if (text.includes("mangsho") || text.includes("meat")) {
      advice += "For meat, skinless chicken or local fish is the best choice. Beef or mutton is better restricted, especially if you have heart or cholesterol concerns. Avoid processed meat.";
    } else {
      advice += "Eggs, lentils (dal), or local fish are the best protein options on a budget.";
    }
    advice += "\n\nTips:\n- Cook with less oil and less salt.\n- Portion control is important for health.\n- Avoid processed foods.";
    advice += "\n\n_General guidance — consult a doctor or dietitian for serious concerns._";
    return advice;
  }

  // Default: Banglish
  let advice = "Bujhlam — apni healthy and budget-friendly option khujchen. ";
  if (text.includes("mangsho") || text.includes("meat")) {
    advice += "Mangsho khete chaile skinless chicken ba local fish best choice. Beef/mutton kom khawa better, especially heart ba cholesterol concern thakle. Processed meat avoid korun.";
  } else {
    advice += "Dim (egg), dal, ba local fish — budget er moddhe best protein options.";
  }
  advice += "\n\nTips:\n- Kom tel, kom lobon diye ranna korun.\n- Portion control — diabetes ba heart er jonno important.\n- Processed food avoid korun.";
  advice += "\n\n_General guidance — doctor er shathe kotha bolun serious concern thakle._";
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
      return "জি, শুনছি! দেশি খাবার, ডায়েট বা স্বাস্থ্য নিয়ে কোনো পরামর্শ দরকার?";
    }
    if (/breakfast/i.test(message)) {
      return "সহজ দেশি সকালের নাস্তার জন্য লাল আটার রুটি বা আধা কাপ ভাতের সাথে ডিম, ডাল বা ছোলা ট্রাই করতে পারেন। ফল থাকলে যুক্ত করুন। ব্যালেন্স: কার্ব + প্রোটিন + ফাইবার।";
    }
    return "আমি দেশি খাবারের পুষ্টিগুণ, ওষুধের রেফারেন্স, শারীরিক সমস্যা বা স্বাস্থ্যকর খাবারের আইডিয়া নিয়ে সাহায্য করতে পারি। কী জানতে চান বলুন!";
  }

  if (language === "english") {
    if (/^(hi|hello|hey|salam|assalamu|assalamu alaikum|hola|namaste)$/.test(text)) {
      return "Hello! I am Nanumoni 🌿 If you want to know about Deshi food, nutrition, or health, just ask — I'm here to help!";
    }
    if (/nanu/i.test(text) && text.length < 10) {
      return "Yes, I'm here! Do you need any advice on Deshi food, diet, or health?";
    }
    if (/breakfast/i.test(message)) {
      return "For a simple Deshi breakfast, try whole wheat roti or half cup rice with egg, lentils, or chickpeas. Add fruit if available. Balance: carb + protein + fiber.";
    }
    return "I can help with Deshi food nutrition, medicine reference, health conditions, or healthy meal ideas. Tell me what you'd like to know!";
  }

  // Default: Banglish
  if (/^(hi|hello|hey|salam|assalamu|assalamu alaikum|hola|namaste)$/.test(text)) {
    return "Assalamu Alaikum, shona! Ami Nanumoni 🌿 Deshi khabar, nutrition, ba health niye kichu jante chaile bolun — ami achi!";
  }
  if (/nanu/i.test(text) && text.length < 10) {
    return "Ji, shunchi! Deshi khabar, diet ba health niye kono poramorsho dorkar?";
  }
  if (/breakfast/i.test(message)) {
    return "Simple Deshi breakfast er jonno atta ruti ba half cup bhat er shathe dim, dal, ba chola try korun. Fruit thakle add korun. Balance: carb + protein + fiber.";
  }
  return "Ami Deshi khabar, nutrition facts, medicine reference, ba condition-aware meal ideas niye help korte pari. Ki jante chan bolun!";
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
      const comparedNames = group.map(f => language === "bangla_script" ? f.banglaName : f.canonicalName).join(" vs ");
      if (language === "bangla_script") {
        text += `**${comparedNames}**-এর মধ্যে **${best.banglaName}** ভালো পছন্দ হবে। কারণ: ${best.healthNotes}\n`;
        if (showMacros) {
          for (const f of ranked) {
            text += `  - ${f.banglaName}: প্রতি ১০০ গ্রামে প্রায় ${f.nutrients.calories} ক্যালরি, ${f.nutrients.protein}g প্রোটিন, ${f.nutrients.carbs}g কার্বস।\n`;
          }
        }
      } else if (language === "english") {
        text += `Between **${comparedNames}**, **${best.canonicalName}** is the better choice. Reason: ${best.healthNotes}\n`;
        if (showMacros) {
          for (const f of ranked) {
            text += `  - ${f.canonicalName}: ~${f.nutrients.calories} kcal, ${f.nutrients.protein}g protein, ${f.nutrients.carbs}g carbs.\n`;
          }
        }
      } else {
        text += `**${comparedNames}** er moddhe **${best.canonicalName}** bhalo choice hobe. Reason: ${best.healthNotes}\n`;
        if (showMacros) {
          for (const f of ranked) {
            text += `  - ${f.canonicalName}: ~${f.nutrients.calories} kcal, ${f.nutrients.protein}g protein, ${f.nutrients.carbs}g carbs.\n`;
          }
        }
      }
    } else {
      // Single item in this group
      const f = group[0];
      if (language === "bangla_script") {
        text += `**${f.banglaName}** সম্পর্কে: ${f.healthNotes}\n`;
        if (showMacros) {
          text += `  - প্রতি ১০০ গ্রামে প্রায় ${f.nutrients.calories} ক্যালরি, ${f.nutrients.protein}g প্রোটিন, ${f.nutrients.carbs}g কার্বস।\n`;
        }
      } else if (language === "english") {
        text += `About **${f.canonicalName}**: ${f.healthNotes}\n`;
        if (showMacros) {
          text += `  - ~${f.nutrients.calories} kcal, ${f.nutrients.protein}g protein, ${f.nutrients.carbs}g carbs.\n`;
        }
      } else {
        text += `**${f.canonicalName}** somporke: ${f.healthNotes}\n`;
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
  return "Nanumoni";
}
