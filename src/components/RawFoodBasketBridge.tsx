"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingBag, MapPin, Clipboard, MessageCircle, ExternalLink, Leaf, ShieldCheck } from "lucide-react";
import { getBasketById, type RawFoodBasket } from "@/lib/raw-food-basket";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RawFoodBasketBridgeProps {
  basketId?: string;
  className?: string;
  isDemo?: boolean;
}

export function RawFoodBasketBridge({ basketId = "balanced-deshi", className, isDemo }: RawFoodBasketBridgeProps) {
  const [isLocating, setIsLocating] = useState(false);
  const basket = getBasketById(basketId);

  const handleCopy = () => {
    const text = `Desi Digest Shopping List: ${basket.title}\n\n` + 
                 basket.ingredients.map(i => `- ${i.nameEn} (${i.nameBn}) [${i.unitHint}]`).join("\n") +
                 `\n\nDesi Digest helps you find ingredients. Purchases happen externally.`;
    navigator.clipboard.writeText(text);
    toast.success("Shopping list copied to clipboard!");
  };

  const handleWhatsAppShare = () => {
    const text = `*Desi Digest Shopping List: ${basket.title}*\n\n` + 
                 basket.ingredients.map(i => `• ${i.nameEn} (${i.nameBn}) - ${i.unitHint}`).join("\n") +
                 `\n\n_Find these at your local market or nearby grocery store._`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSearchNearby = (category: string) => {
    setIsLocating(true);
    let searchType = "grocery shop";
    if (category === "vegetable") searchType = "vegetable shop";
    if (category === "fish") searchType = "fish market";
    if (category === "fruit") searchType = "fruit shop";
    if (category === "dairy") searchType = "dairy shop";

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          const url = `https://www.google.com/maps/search/${encodeURIComponent(searchType)}+near+${position.coords.latitude},${position.coords.longitude}`;
          window.open(url, "_blank", "noopener,noreferrer");
        },
        (error) => {
          setIsLocating(false);
          console.warn("Geolocation blocked:", error);
          toast.info("Location permission wasn't allowed. Opening manual search.");
          const url = `https://www.google.com/maps/search/${encodeURIComponent(searchType)}+near+me`;
          window.open(url, "_blank", "noopener,noreferrer");
        },
        { timeout: 5000 }
      );
    } else {
      setIsLocating(false);
      const url = `https://www.google.com/maps/search/${encodeURIComponent(searchType)}+near+me`;
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleExternalSearch = () => {
    // We do not hardcode a specific competitor, we just do a generic google search that user can pick from
    const query = encodeURIComponent(`buy fresh groceries online delivery Bangladesh`);
    window.open(`https://www.google.com/search?q=${query}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={cn("w-full overflow-hidden rounded-3xl border border-border bg-card shadow-warm", className)}>
      <div className="bg-primary/5 p-5 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-primary">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            {isDemo && (
              <span className="inline-block mb-1 text-[10px] font-bold tracking-widest text-spice uppercase bg-spice/10 px-2 py-0.5 rounded">
                Sample Demo Basket
              </span>
            )}
            <h2 className="font-display text-xl font-bold text-foreground">Buy raw ingredients</h2>
            <p className="text-sm text-muted-foreground">{basket.title} — Turn your meal plan into a shopping list.</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6">
        <p className="text-sm text-foreground/80 leading-relaxed font-medium">
          {basket.reason}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {basket.ingredients.map((ing) => (
            <div key={ing.id} className="flex items-start gap-3 rounded-2xl border border-border/50 bg-secondary/20 p-3">
               <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm border border-border/30">
                 <Leaf className="h-5 w-5 text-sage" />
               </div>
               <div className="flex-1">
                 <p className="text-sm font-bold leading-tight">{ing.nameEn}</p>
                 <p className="text-xs text-muted-foreground mb-1">{ing.nameBn}</p>
                 <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">{ing.unitHint}</p>
               </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
          <Button onClick={() => handleSearchNearby("grocery")} disabled={isLocating} className="shadow-soft flex-1 sm:flex-none">
            <MapPin className="mr-2 h-4 w-4" />
            {isLocating ? "Locating..." : "Find nearby shops"}
          </Button>
          
          <Button variant="secondary" onClick={handleExternalSearch} className="flex-1 sm:flex-none">
            <ExternalLink className="mr-2 h-4 w-4" />
            Search grocery platform
          </Button>
          
          <Button variant="outline" size="icon" onClick={handleCopy} title="Copy List">
            <Clipboard className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="icon" onClick={handleWhatsAppShare} title="Share on WhatsApp">
            <MessageCircle className="h-4 w-4 text-[#25D366]" />
          </Button>
        </div>

        <div className="flex flex-col gap-2 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-primary/60 shrink-0" />
            <p>Desi Digest helps you find ingredients. Purchases happen on external platforms or local shops. Availability and price may vary.</p>
          </div>
          <div className="flex items-center gap-1.5">
             <Leaf className="h-4 w-4 text-sage shrink-0" />
             <p>General nutrition guidance — not medical advice.</p>
          </div>
        </div>
      </div>
    </div>
  );
}