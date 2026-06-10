import { type MealLog } from "./meals.functions";
import { type HabitState } from "./smart-health-nudge";
import { reviewRecentMealPatternSafety, normalizeHealthConcerns, sanitizeClinicalSafetyText } from "./clinical-nutrition-safety";

export type CareCompanionDataSource =
  | "real_meal_logs"
  | "plate_analysis"
  | "dashboard_summary"
  | "smart_nudge"
  | "nudge_feedback"
  | "demo_fallback"
  | "empty_state";

export type CareCompanionConfidence = "low" | "medium" | "high";

export type CareCompanionQuestion = {
  id: string;
  question: string;
  category:
    | "carb_portion"
    | "fiber"
    | "protein"
    | "fried_oily"
    | "sodium"
    | "hydration"
    | "budget"
    | "meal_timing"
    | "heart_health"
    | "weight_goal"
    | "general";
  whyThisMatters: string;
  basedOn: string[];
  safeAnswer: string;
  bangladeshiFoodExamples: string[];
  whatToTrackNext: string[];
  doctorDiscussionPrompt: string;
  confidence: "low" | "medium" | "high";
};

export type CareCompanionSummary = {
  periodLabel: string;
  dataSourcesUsed: CareCompanionDataSource[];
  confidence: CareCompanionConfidence;
  mealPatternNotes: string[];
  nutritionDiscussionPoints: string[];
  questionsToAsk: CareCompanionQuestion[];
  suggestedNextSteps: string[];
  trackingSuggestions: string[];
  redFlagReminder: string;
  shareText: string;
  disclaimer: string;
  isDemo?: boolean;
};

// ─── Question Templates ───────────────────────────────────────────────────────

const QUESTION_TEMPLATES: Record<string, Omit<CareCompanionQuestion, "confidence">> = {
  carb_heavy: {
    id: "carb_portion",
    question: "What rice or carbohydrate portion is suitable for my routine and goals?",
    category: "carb_portion",
    whyThisMatters: "Carbohydrates (especially refined grains like white rice) are the primary energy source in Bangladeshi diets, but excessive portions can affect blood sugar management and weight goals.",
    basedOn: ["Carbohydrate heavy flag", "Recent high-carb meal logs"],
    safeAnswer: "Based on available meal logs, rice or carbohydrate portions may be worth discussing. Individual needs vary based on activity level. It is recommended to consult a doctor or dietitian for a personalized portion target rather than cutting them out completely.",
    bangladeshiFoodExamples: ["White rice (bhat)", "Roti/Lal atta roti", "Khichuri", "Puffed rice (muri)", "Flatbreads"],
    whatToTrackNext: ["Portion size of rice or flatbreads (e.g. cups or count)", "Blood sugar readings if recommended by a doctor"],
    doctorDiscussionPrompt: "What is a reasonable portion size of white rice or roti for my daily meals, and how should I balance it with protein and vegetables?"
  },
  fried_oily: {
    id: "fried_oily",
    question: "How can I balance fried foods or use lower-oil cooking methods?",
    category: "fried_oily",
    whyThisMatters: "Oils (like soybean or mustard oil) are common in South Asian cooking. Excessive fried/oily foods can increase calorie density and affect heart health or digestion.",
    basedOn: ["Fried/oily safety flag", "Oily/fried meal entries in logs"],
    safeAnswer: "Frequent oily or fried foods may raise calorie and fat intake. It may be worth discussing lower-oil cooking methods or portion balance. Foods do not need to be labeled 'forbidden' entirely; instead, focus on moderation and switching to lower-oil preparation where feasible.",
    bangladeshiFoodExamples: ["Baked or grilled fish", "Boiled egg instead of fried egg", "Bhuna cooked with less oil", "Air-fried or lightly roasted snacks instead of deep-fried singara/puri"],
    whatToTrackNext: ["Frequency of deep-fried foods", "Tablespoons of oil used in home cooking"],
    doctorDiscussionPrompt: "What are some heart-healthy cooking oils and methods I can use at home, and how often can I safely include traditional fried dishes?"
  },
  sodium_heavy: {
    id: "sodium",
    question: "Should I monitor my sodium intake closely?",
    category: "sodium",
    whyThisMatters: "Excess sodium is a key contributor to elevated blood pressure. Traditional foods like pickles (achar), dried fish (shutki), and salty snacks can contain high levels of sodium.",
    basedOn: ["Sodium/salty safety flag", "Processed/salty items in recent meals"],
    safeAnswer: "Based on available meal logs, sodium intake may be worth discussing if blood pressure or heart health is a concern. Discuss options to lower salt while retaining flavor.",
    bangladeshiFoodExamples: ["Fresh lemon juice (lebu)", "Herbs like coriander (dhone pata)", "Spices like cumin and turmeric instead of table salt", "Reducing shutki and commercial pickles (achar)"],
    whatToTrackNext: ["Use of added salt at the table", "Consumption of processed snacks (chanachur, chips)"],
    doctorDiscussionPrompt: "What is a safe daily sodium target for me, and should I avoid certain high-sodium traditional foods like shutki or achar?"
  },
  low_fiber: {
    id: "fiber",
    question: "How can I increase fiber using local foods like dal, shak, or seasonal vegetables?",
    category: "fiber",
    whyThisMatters: "Fiber is crucial for digestive health, blood sugar stability, and heart health. Traditional diets can sometimes be low in fiber if white rice is consumed without enough lentils or greens.",
    basedOn: ["Low fiber safety flag", "Lack of vegetable or whole-grain logs"],
    safeAnswer: "Fiber appears low in available logs. Discuss adding high-fiber local foods gradually. Do not make sudden drastic changes without consulting a professional, especially if you have sensitive digestion.",
    bangladeshiFoodExamples: ["Lal shak", "Palong shak", "Pui shak", "Mixed vegetables (sobhji)", "Dal (lentils)", "Chola (chickpeas)", "Guava (peyara)"],
    whatToTrackNext: ["Servings of green leafy vegetables (shak) per day", "Lentil (dal) intake"],
    doctorDiscussionPrompt: "How many servings of vegetables and lentils should I aim for daily, and are there any high-fiber foods I should avoid?"
  },
  low_protein: {
    id: "protein",
    question: "How often should I include dal, fish, egg, chicken, or chola?",
    category: "protein",
    whyThisMatters: "Protein is essential for muscle maintenance, immune function, and satiety. Some traditional meals might focus heavily on starches and overlook adequate protein sources.",
    basedOn: ["Low protein safety flag", "Low estimated protein in logs"],
    safeAnswer: "Protein may be low in some logs. It may be worth discussing affordable and accessible protein sources that fit your budget and preference.",
    bangladeshiFoodExamples: ["Eggs (dim)", "Small fish (mola, kachki)", "Rui or Katla fish", "Chicken (murgi)", "Lentils (dal)", "Chickpeas (chola)", "Yogurt (tok doi)"],
    whatToTrackNext: ["Portions of protein sources per meal", "Daily egg or fish consumption"],
    doctorDiscussionPrompt: "Am I getting enough protein daily? What are the best local, affordable protein sources for my health needs?"
  },
  gastric_concern: {
    id: "gastric_concern",
    question: "Are there specific spices or cooking methods I should avoid for gastric comfort?",
    category: "general",
    whyThisMatters: "Spicy, highly acidic, or deep-fried foods can trigger acid reflux, bloating, or gastric discomfort in sensitive individuals.",
    basedOn: ["Gastric concern safety flag", "Spicy or oily meals logged with gastric concerns"],
    safeAnswer: "Based on available meal logs, certain spicy or oily foods may be worth discussing for gastric comfort. Milder preparation methods can support comfort without sacrificing traditional tastes.",
    bangladeshiFoodExamples: ["Soft rice or khichuri", "Boiled egg", "Mildly spiced vegetable curries", "Stewed papaya (pepe) or bottle gourd (lau)"],
    whatToTrackNext: ["Occurrences of heartburn or bloating after meals", "Intake of raw green chilies or extra spices"],
    doctorDiscussionPrompt: "Are there specific spices or cooking styles I should avoid to minimize gastric irritation, and what are safe alternative foods?"
  },
  kidney_concern: {
    id: "kidney_concern",
    question: "What specific limits on protein, sodium, or potassium should I follow?",
    category: "general",
    whyThisMatters: "Kidney health requires precise management of minerals and protein to prevent putting extra strain on the kidneys.",
    basedOn: ["Kidney concern safety flag", "Kidney concern noted in user profile"],
    safeAnswer: "Kidney-related nutrition needs vary significantly. Please discuss protein, sodium, potassium, and fluid choices with a qualified clinician. Do not follow generic online diets.",
    bangladeshiFoodExamples: ["Portion-controlled local fish", "Low-potassium vegetables like bottle gourd (lau) or green papaya (pepe) if recommended by doctor"],
    whatToTrackNext: ["Exact protein portions", "Fluid intake if restricted"],
    doctorDiscussionPrompt: "What are my specific daily limits for protein, sodium, potassium, and fluids based on my latest lab results?"
  },
  pregnancy_concern: {
    id: "pregnancy_concern",
    question: "Are there any specific local foods or supplements I should prioritize or avoid right now?",
    category: "general",
    whyThisMatters: "Nutrient requirements (like iron, folate, calcium) increase during pregnancy, and certain food safety protocols are essential.",
    basedOn: ["Pregnancy concern safety flag", "Pregnancy noted in user profile"],
    safeAnswer: "During pregnancy, food safety and prenatal nutrient needs are critical. Discuss appropriate local foods and supplements with a doctor or midwife.",
    bangladeshiFoodExamples: ["Fully cooked eggs and fish", "Pasteurized milk and yogurt", "Iron-rich foods like spinach and lean meat", "Folate-rich lentils (dal)"],
    whatToTrackNext: ["Compliance with iron/folic acid supplements", "Servings of fully cooked proteins"],
    doctorDiscussionPrompt: "Which local foods are best for iron and folate, and are there any traditional food restrictions I should ignore or follow?"
  },
  weight_loss_density: {
    id: "weight_loss_density",
    question: "What portion sizes are recommended for my weight goals?",
    category: "weight_goal",
    whyThisMatters: "Sustained weight management relies on energy balance and nutrient-dense, filling foods that prevent overeating.",
    basedOn: ["Weight loss density safety flag", "Calorie-dense meals logged with weight loss goals"],
    safeAnswer: "Some meals may be calorie-dense based on available estimates. It may be worth discussing portion control and cooking styles to support energy balance without feeling hungry.",
    bangladeshiFoodExamples: ["Increased portion of vegetables/shak", "Replacing fried snacks with fresh fruits or cucumbers", "Smaller rice portions balanced with high-volume low-calorie foods like gourd (lau)"],
    whatToTrackNext: ["Daily physical activity or step count", "Vegetable-to-carb ratio on your plate"],
    doctorDiscussionPrompt: "What is a safe and sustainable rate of weight change for me, and how can I adjust my traditional meals to support this?"
  },
  heart_health: {
    id: "heart_health",
    question: "Are there heart-healthy swaps for my favorite deshi meals?",
    category: "heart_health",
    whyThisMatters: "Cardiovascular wellness is heavily influenced by fat quality, sodium intake, and fiber. Swapping saturated fats for unsaturated fats and increasing fiber can support heart health.",
    basedOn: ["Heart health safety flag", "Heart concern or high-fat/sodium meal patterns"],
    safeAnswer: "Meals higher in sodium or fat may impact heart health goals. Discuss heart-friendly traditional deshi recipes and swaps with your care team.",
    bangladeshiFoodExamples: ["Using mustard oil or canola oil in small amounts instead of ghee or palm oil", "Choosing skinless chicken or fish over fatty beef/mutton", "Adding oats or whole wheat flatbreads"],
    whatToTrackNext: ["Frequency of beef, mutton, or ghee consumption", "Daily vegetable and fruit servings"],
    doctorDiscussionPrompt: "What blood lipid parameters should I monitor, and what are the most effective dietary swaps for my heart health?"
  },
  allergy_match: {
    id: "allergy_match",
    question: "How can I safely substitute ingredients I am allergic or sensitive to?",
    category: "general",
    whyThisMatters: "Managing food allergies or avoidances in Bangladeshi meals requires careful identification of hidden ingredients in common recipes.",
    basedOn: ["Allergy/avoid flags matched in your meal logs"],
    safeAnswer: "A potential allergy or avoid item was matched in available logs. Discuss safe alternatives and cross-contamination protocols with a professional.",
    bangladeshiFoodExamples: ["Using coconut milk instead of dairy", "Substituting mustard oil for soybean oil", "Gluten-free grains like rice"],
    whatToTrackNext: ["Check ingredient labels on packaged foods", "Symptoms following meal consumption"],
    doctorDiscussionPrompt: "I have identified potential allergy matches in my diet. What are safe substitute options and what tests should I take to confirm my allergies?"
  }
};

const HABIT_QUESTION: Omit<CareCompanionQuestion, "confidence"> = {
  id: "habit_tracking",
  question: "How are my small habit changes affecting my routine?",
  category: "general",
  whyThisMatters: "Small, consistent habit changes are often more sustainable and impactful than drastic dietary restrictions.",
  basedOn: ["Habit feedback logs", "Smart health nudge activity"],
  safeAnswer: "Based on recorded habit feedback, small lifestyle changes can build long-term consistency. Discuss how these adjustments feel and if they are sustainable for you.",
  bangladeshiFoodExamples: ["Drinking water from a designated bottle", "Having a piece of seasonal fruit as a snack", "Walking after meals"],
  whatToTrackNext: ["Daily habit checkmarks in the app", "Energy levels or mood associated with habits"],
  doctorDiscussionPrompt: "I am working on small habits like tracking meals and increasing water intake. How do these fit into my overall health plan?"
};

const DEFAULT_QUESTIONS: Omit<CareCompanionQuestion, "confidence">[] = [
  {
    id: "default_tracking",
    question: "Should I track weight, waist, blood sugar, or blood pressure with a professional?",
    category: "general",
    whyThisMatters: "Monitoring health metrics provides objective data to help you and your doctor evaluate the effectiveness of dietary and lifestyle changes.",
    basedOn: ["General health guidelines"],
    safeAnswer: "Tracking key physical metrics can be valuable, but it should be done under clinical guidance to ensure correct measurement techniques and safe ranges.",
    bangladeshiFoodExamples: ["N/A - General health tracking focus"],
    whatToTrackNext: ["Blood pressure or blood sugar logs if requested by doctor"],
    doctorDiscussionPrompt: "Which home health metrics (like blood pressure or weight) should I track, how often, and at what values should I contact you?"
  },
  {
    id: "default_limiting",
    question: "Are any of my usual foods worth limiting based on my personal health history?",
    category: "general",
    whyThisMatters: "Some foods that are generally healthy might not align with specific medical conditions or medication interactions.",
    basedOn: ["General medical history"],
    safeAnswer: "Dietary limits are highly personal. Discussing your typical meal patterns with a doctor or dietitian can reveal unexpected interactions or simple optimizations.",
    bangladeshiFoodExamples: ["Commercial pickles", "Salty bakery items", "Frequent sweets", "High-fat dairy or meats"],
    whatToTrackNext: ["List of top 5 most frequently eaten traditional meals"],
    doctorDiscussionPrompt: "Here is a summary of what I typically eat. Are there any specific items that I should restrict or substitute due to my health history?"
  }
];

// ─── Main Function ───────────────────────────────────────────────────────────

export function generateCareCompanionSummary(
  profile: any,
  meals: MealLog[],
  habitState: HabitState | null,
  isDemo: boolean
): CareCompanionSummary {
  const dataSources: CareCompanionDataSource[] = [];
  if (isDemo) dataSources.push("demo_fallback");
  if (meals.length > 0) {
    dataSources.push("real_meal_logs");
    if (meals.some(m => m.source === "photo")) dataSources.push("plate_analysis");
  }
  if (habitState && habitState.days.length > 0) dataSources.push("nudge_feedback");
  if (dataSources.length === 0) dataSources.push("empty_state");

  let confidence: CareCompanionConfidence = "low";
  if (meals.length >= 7) confidence = "high";
  else if (meals.length >= 3) confidence = "medium";

  const mealPatternNotes: string[] = [];
  const nutritionDiscussionPoints: string[] = [];
  const questionsToAsk: CareCompanionQuestion[] = [];
  const suggestedNextSteps: string[] = [];
  const trackingSuggestions: string[] = [];

  // Call Safety Engine
  const safetyReview = reviewRecentMealPatternSafety({
    recentMeals: meals.map(m => ({
      name: m.name,
      mealText: m.notes || "",
      ingredients: [],
      nutrition: {
        calories: m.calories ?? 0,
        protein_g: m.protein_g ?? 0,
        fat_g: m.fat_g ?? 0,
        carbs_g: m.carbs_g ?? 0,
        fiber_g: m.fiber_g ?? 0,
        sugar_g: m.sugar_g ?? 0,
        sodium_mg: m.sodium_mg ?? 0,
      }
    })),
    healthConcerns: normalizeHealthConcerns(profile),
    isDemo
  });

  safetyReview.flags.forEach(f => {
    mealPatternNotes.push(sanitizeClinicalSafetyText(f.message));
    nutritionDiscussionPoints.push(sanitizeClinicalSafetyText(`${f.title}: ${f.reason}`));
    
    const template = QUESTION_TEMPLATES[f.id];
    if (template) {
      questionsToAsk.push({
        ...template,
        confidence: safetyReview.confidence
      });
    } else if (f.doctorDiscussionQuestion) {
      questionsToAsk.push({
        id: f.id,
        question: sanitizeClinicalSafetyText(f.doctorDiscussionQuestion),
        category: "general",
        whyThisMatters: sanitizeClinicalSafetyText(f.message),
        basedOn: [f.reason],
        safeAnswer: sanitizeClinicalSafetyText(f.message),
        bangladeshiFoodExamples: [],
        whatToTrackNext: [],
        doctorDiscussionPrompt: sanitizeClinicalSafetyText(f.doctorDiscussionQuestion),
        confidence: safetyReview.confidence
      });
    }
  });

  // Habit/Nudge Feedback
  if (habitState && habitState.days.length > 0) {
    const completedHabits = habitState.days.filter(d => d.answer === "yes" || d.answer === "partly").length;
    mealPatternNotes.push(`Tried habit tracking for ${habitState.days.length} day(s), with ${completedHabits} success(es).`);
    nutritionDiscussionPoints.push("Active participation in habit nudges. Discuss how these small changes are impacting your routine.");
    
    questionsToAsk.push({
      ...HABIT_QUESTION,
      confidence: "high"
    });
  }

  // Default general questions
  DEFAULT_QUESTIONS.forEach(q => {
    questionsToAsk.push({
      ...q,
      confidence: "medium"
    });
  });

  // Deduplicate questions by ID
  const uniqueQuestions: CareCompanionQuestion[] = [];
  const seenIds = new Set<string>();
  for (const q of questionsToAsk) {
    if (!seenIds.has(q.id)) {
      seenIds.add(q.id);
      uniqueQuestions.push(q);
    }
  }

  // Suggested Next Steps
  suggestedNextSteps.push("Bring this summary to your next appointment with a doctor or dietitian.");
  if (meals.length < 7) {
    suggestedNextSteps.push(`Track ${7 - meals.length > 0 ? 7 - meals.length : 3} more days of meals for a clearer pattern.`);
  }
  suggestedNextSteps.push("Add portion notes (e.g., '1 cup rice', '2 pieces chicken') when logging.");

  // Tracking Suggestions
  trackingSuggestions.push("Continue using the Plate Analyzer for automated portion estimation.");
  trackingSuggestions.push("Record your energy levels or symptoms in the 'Notes' section of your meal logs.");

  // Safety Disclaimer
  const disclaimer = "This summary is for nutritional discussion guidance only and is NOT a medical diagnosis, prescription, or treatment plan. Always consult a healthcare professional for medical advice.";
  const redFlagReminder = "Seek professional medical advice promptly if you have severe symptoms, sudden weight loss, fainting, chest pain, severe abdominal pain, repeated vomiting, blood in stool, very high/low blood sugar readings, or any urgent concern.";

  // Build Share Text
  const userName = profile?.full_name || profile?.display_name || "User";
  const shareText = `Desi Digest — Care Companion Summary
${isDemo ? "(Sample demo data only)" : ""}

User: ${userName}
Confidence: ${confidence.toUpperCase()}
Data used: ${dataSources.join(", ")}

Meal Pattern Notes:
${mealPatternNotes.map((n, i) => `${i + 1}. ${n}`).join("\n")}

Nutrition Discussion Points:
${nutritionDiscussionPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Questions for Doctor/Dietitian:
${uniqueQuestions.map((q, i) => `${i + 1}. ${q.question}`).join("\n")}

General nutrition guidance — not medical advice.`;

  return {
    periodLabel: "Last 7-14 days",
    dataSourcesUsed: dataSources,
    confidence,
    mealPatternNotes: mealPatternNotes.length > 0 ? mealPatternNotes : ["No specific patterns detected yet."],
    nutritionDiscussionPoints: nutritionDiscussionPoints.length > 0 ? nutritionDiscussionPoints : ["Discuss your general eating habits with your doctor."],
    questionsToAsk: uniqueQuestions.slice(0, 8),
    suggestedNextSteps,
    trackingSuggestions,
    redFlagReminder,
    shareText,
    disclaimer,
    isDemo
  };
}
