import { z } from "zod";

export const AiPlateAnalysisSchema = z.object({
  healthExplanation: z.string().describe("A professional HealthTech nutrition scan report summary. You must produce exactly 5 sentences: 1-2 sentences of Executive Summary on meal balance, 1 sentence on Main Nutrition Concern, 1 sentence on Best Improvement, 1 sentence on a Local Healthier Swap, and 1 sentence of Confidence/Accuracy Note. Specific to the detected foods and user goals. Avoid generic advice like 'eat more vegetables' unless tied directly to the plate."),
  hygieneNotes: z.string().describe("General notes on visual freshness or common hygiene tips for these foods. Keep it safe and generic."),
  idealPlateComparison: z.string().describe("How this plate compares to an ideal balanced Deshi plate (e.g., half veggies, quarter carbs, quarter protein)."),
  idealPlateBreakdown: z.object({
    shak_shobji_pct: z.number().describe("Estimated percentage of the plate that is vegetables/greens (0-100)."),
    bhat_carbs_pct: z.number().describe("Estimated percentage of the plate that is carbs like rice/roti (0-100)."),
    dal_protein_pct: z.number().describe("Estimated percentage of the plate that is protein like dal/fish/meat/egg (0-100)."),
    notes: z.string().describe("A short note on the visual proportions."),
  }),
  goalAlignment: z.array(
    z.object({
      goal: z.string(),
      verdict: z.enum(["great", "okay", "risky"]),
      reason: z.string().describe("Why this plate aligns or doesn't align with the user's specific health goal."),
    })
  ).describe("How this plate aligns with the user's health goals (e.g., diabetes_friendly, weight_loss). Leave empty if no goals are provided."),
  personalizedSuggestions: z.array(z.string()).describe("1-3 personalized suggestions based on their profile and this specific plate."),
  makeItHealthierTips: z.array(z.string()).describe("1-3 actionable tips to make this exact meal healthier next time (e.g., 'Add a side of shak')."),
  substitutions: z.array(
    z.object({
      from: z.string().describe("The less healthy ingredient currently on the plate."),
      to: z.string().describe("A healthier Deshi alternative."),
      why: z.string().describe("Why this substitution is better."),
    })
  ).describe("Suggested ingredient swaps. Keep it culturally relevant to Bangladesh."),
  portionAdjustment: z.string().describe("Advice on portion sizes for this specific meal."),
  budgetAlternatives: z.array(z.string()).describe("Cheaper alternatives if the user is on a budget. Leave empty if budget is not a concern."),
});

export type AiPlateAnalysisData = z.infer<typeof AiPlateAnalysisSchema>;

export const defaultAiPlateAnalysis: AiPlateAnalysisData = {
  healthExplanation: "Nutrition was calculated from local Desi food data or USDA. AI insights are temporarily unavailable.",
  hygieneNotes: "Always ensure food is cooked thoroughly and served fresh.",
  idealPlateComparison: "A balanced Deshi plate usually has half shak-shobji, one quarter bhat/ruti, and one quarter dal/fish/meat/egg.",
  idealPlateBreakdown: { shak_shobji_pct: 0, bhat_carbs_pct: 0, dal_protein_pct: 0, notes: "AI plate proportion estimation is unavailable." },
  goalAlignment: [],
  personalizedSuggestions: ["Use the source labels below to judge confidence.", "For better nutrition estimates, type the dish name if the image result looks wrong."],
  makeItHealthierTips: ["Add dal, egg, fish, or chicken if protein is low.", "Add shak or vegetables to improve fiber and micronutrients."],
  substitutions: [],
  portionAdjustment: "Portions are estimated because image APIs do not reliably measure grams. Confirm by typing the food and portion for a tighter estimate.",
  budgetAlternatives: [],
};
