import { createServerFn } from "@tanstack/react-start";
import { generatePersonalizedNudge } from "./smart-health-nudge-ai.server";
import { type MealLog } from "./meals.functions";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getSmartHealthNudgeFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => 
    z.object({
      profile: z.any(),
      recentMeals: z.any(),
      isDemo: z.boolean().default(false),
      chatKeywords: z.array(z.string()).default([])
    }).parse(input)
  )
  .handler(async ({ data }) => {
    return await generatePersonalizedNudge(
      data.profile, 
      data.recentMeals as MealLog[], 
      data.isDemo, 
      data.chatKeywords
    );
  });
