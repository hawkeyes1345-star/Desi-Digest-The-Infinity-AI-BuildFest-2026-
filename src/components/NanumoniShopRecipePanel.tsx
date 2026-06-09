"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { type NearbyShop } from "@/lib/shops-near-you";
import { Button } from "@/components/ui/button";
import { ChefHat, Clipboard, LogOut, Check, Leaf, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { RawFoodBasketBridge } from "./RawFoodBasketBridge";

interface NanumoniShopRecipePanelProps {
  shop: NearbyShop;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NanumoniShopRecipePanel({ shop, open, onOpenChange }: NanumoniShopRecipePanelProps) {
  const [copied, setCopied] = useState(false);

  // Generate a deterministic local recipe idea based on the first popular item
  const focusItem = shop.popularItems[0] || "Fresh Ingredients";
  
  const getRecipeDetails = () => {
    const item = focusItem.toLowerCase();
    
    if (item.includes("fish")) {
      return {
        title: `Light ${focusItem} Curry (Machher Jhol)`,
        steps: [
          "Lightly coat fish with turmeric and salt, then pan-sear with minimal oil (1-2 tsp).",
          "In the same pan, sauté onions, ginger-garlic paste, and cumin until fragrant.",
          "Add cubed potatoes, green papaya, or lau (bottle gourd) and simmer with water.",
          "Add the fish back in, cover, and cook until vegetables are tender. Finish with fresh coriander."
        ],
        basketId: "budget-protein",
        nutrition: "Approx 200-250 kcal | High Protein | Low Saturated Fat"
      };
    }
    
    if (item.includes("veg") || item.includes("shak")) {
      return {
        title: `Healthy Mixed ${focusItem} Bhaji`,
        steps: [
          "Wash and chop all vegetables evenly to ensure consistent cooking.",
          "Heat 1 tsp of mustard oil, add kalo-zira (nigella seeds) and sliced green chilies.",
          "Add the vegetables, a pinch of turmeric, and cover. Let them cook in their own moisture.",
          "Avoid overcooking to retain crunch and vitamins. Serve with brown rice or red flour roti."
        ],
        basketId: "balanced-deshi",
        nutrition: "Approx 80-120 kcal | High Fiber | Low Calorie"
      };
    }
    
    if (item.includes("fruit")) {
      return {
        title: `Fresh ${focusItem} Bowl`,
        steps: [
          "Wash the fruits thoroughly under running water.",
          "Chop into bite-sized pieces.",
          "Sprinkle a tiny pinch of rock salt or chaat masala for taste.",
          "Serve as a mid-morning or afternoon snack to manage energy levels."
        ],
        basketId: "high-fiber",
        nutrition: "Approx 100-150 kcal | High Vitamin C | Natural Sugars"
      };
    }

    if (item.includes("tiffin") || item.includes("lunch")) {
      return {
        title: "Balanced Deshi Tiffin Plate",
        steps: [
          "Fill half the box with colorful vegetables (bhaji or salad).",
          "Add one portion (1 cup) of red or brown rice.",
          "Include one portion of lean protein (chicken, egg, or fish).",
          "Keep a small container of tok-doi (plain yogurt) for digestion."
        ],
        basketId: "balanced-deshi",
        nutrition: "Approx 450-550 kcal | Balanced Macros | Portion Conscious"
      };
    }

    // Generic fallback
    return {
      title: `Wholesome ${focusItem} Meal`,
      steps: [
        `Select the freshest ${focusItem} available from the market.`,
        "Wash thoroughly and prep with minimal oil and salt.",
        "Pair with complex carbohydrates like brown rice or whole-wheat roti.",
        "Ensure half your plate consists of vegetables for a balanced diet."
      ],
      basketId: "balanced-deshi",
      nutrition: "Nutrition varies based on exact ingredients and portions."
    };
  };

  const recipe = getRecipeDetails();

  const handleCopy = () => {
    const text = `*Nanumoni Recipe Idea: ${recipe.title}*\n\n` +
                 recipe.steps.map((s, i) => `${i + 1}. ${s}`).join("\n") +
                 `\n\n_${recipe.nutrition}_\n_General nutrition guidance only._`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Recipe copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogMeal = () => {
    toast.info("You can quickly log this meal from the Dashboard via the '+' button.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-[2rem] border-none bg-card shadow-2xl">
        <div className="bg-sage/10 p-5 border-b border-sage/20">
           <div className="flex items-center gap-3">
             <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage/20 text-sage">
               <ChefHat className="h-5 w-5" />
             </div>
             <div>
               <h2 className="font-display text-lg font-bold text-foreground leading-tight">Nanumoni Recipe Idea</h2>
               <p className="text-xs text-muted-foreground mt-0.5">Based on {shop.name}'s {focusItem}</p>
             </div>
           </div>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
           
           <div className="space-y-4">
              <h3 className="font-display text-xl font-semibold text-primary">{recipe.title}</h3>
              
              <div className="space-y-3">
                 {recipe.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-3">
                       <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">
                         {idx + 1}
                       </span>
                       <p className="text-sm text-foreground/90 leading-relaxed mt-0.5">{step}</p>
                    </div>
                 ))}
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground border border-border/30">
                 <Leaf className="h-4 w-4 shrink-0 text-sage" />
                 <p className="font-medium">{recipe.nutrition}</p>
              </div>
           </div>

           <div className="flex gap-2 pt-4 border-t border-border/50">
              <Button onClick={handleCopy} className="flex-1 shadow-soft group">
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Clipboard className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />}
                {copied ? "Copied!" : "Copy Recipe"}
              </Button>
              <Button variant="outline" onClick={handleLogMeal} className="flex-1">
                 Log this meal
              </Button>
           </div>

           <div className="pt-2">
             <RawFoodBasketBridge basketId={recipe.basketId} isDemo={shop.isPartnerDemo} className="border-border/60 shadow-none" />
           </div>

           <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/70 bg-secondary/50 py-2 rounded-lg">
              <ShieldCheck className="h-3 w-3 text-primary/50" />
              General nutrition guidance only — not medical advice.
           </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}