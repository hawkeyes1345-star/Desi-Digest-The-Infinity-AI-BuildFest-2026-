"use client";

import React, { useState } from "react";
import { type NearbyShop } from "@/lib/shops-near-you";
import { Button } from "@/components/ui/button";
import { MapPin, ChefHat, ExternalLink, ShieldCheck, Leaf, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { getClientFallbackImage } from "@/lib/client-image-fallback";
import { NanumoniShopRecipePanel } from "./NanumoniShopRecipePanel";

export function ShopsNearYouCard({ shop }: { shop: NearbyShop }) {
  const [recipeOpen, setRecipeOpen] = useState(false);
  const fallbackInfo = getClientFallbackImage(shop.imageKind);

  const handleOpenMaps = () => {
    let url = "";
    if (shop.lat && shop.lng) {
      // If we have precise coordinates and a known public/partner place
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.name)}+near+${shop.lat},${shop.lng}`;
    } else {
      // If it's a dynamic search or we don't have exact coordinates
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.mapQuery)}`;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <div className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-all hover:shadow-warm">
        {/* Image Header */}
        <div className="relative h-40 w-full bg-muted">
          <img 
            src={fallbackInfo.url} 
            alt={shop.name}
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
            {shop.sourceType === "sample_partner" && (
              <span className="rounded-full bg-spice/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md">
                Sample Partner
              </span>
            )}
            {shop.sourceType === "public_map_seed" && (
              <span className="rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Public Seed
              </span>
            )}
            {shop.sourceType === "google_maps_search" && (
               <span className="rounded-full bg-blue-600/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md flex items-center gap-1">
               <ExternalLink className="h-3 w-3" /> Search Helper
             </span>
            )}
          </div>

          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="font-display text-lg font-semibold leading-tight text-white drop-shadow-md">
              {shop.name}
            </h3>
            <p className="flex items-center gap-1 text-xs font-medium text-white/90 drop-shadow-md mt-0.5">
              <MapPin className="h-3.5 w-3.5" />
              {shop.area}, {shop.city}
              {shop.distanceKm !== undefined && (
                <span className="ml-1 opacity-80">({shop.distanceKm.toFixed(1)} km)</span>
              )}
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 flex-col p-4">
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed h-10 mb-3">
            {shop.description}
          </p>

          {/* Sourcing Trust Note */}
          {shop.sourcing === "direct_farmer" && (
            <div className="mb-3 flex items-start gap-1.5 rounded-lg bg-sage/10 p-2 text-[10px] text-sage">
              <Leaf className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <p>Sample sourcing note: direct farmer sourcing can support fresher produce and fairer prices. Demo data only unless verified.</p>
            </div>
          )}
          
          {shop.type === "wholesale_arot" && (
            <div className="mb-3 flex items-start gap-1.5 rounded-lg bg-amber-500/10 p-2 text-[10px] text-amber-600">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <p>Wholesale/market discovery. Please check price and availability before going.</p>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4 mt-auto">
             {shop.dietMatch && (
               <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
                 <ShieldCheck className="h-3 w-3" /> Diet Match
               </span>
             )}
             {shop.popularItems.slice(0, 3).map((item, idx) => (
               <span key={idx} className="rounded-md bg-secondary px-2 py-1 text-[10px] font-medium text-muted-foreground">
                 {item}
               </span>
             ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3 border-t border-border/50">
             <Button variant="default" size="sm" onClick={handleOpenMaps} className="flex-1 shadow-soft">
               <MapPin className="mr-1.5 h-3.5 w-3.5" /> Maps
             </Button>
             <Button variant="outline" size="sm" onClick={() => setRecipeOpen(true)} className="flex-1">
               <ChefHat className="mr-1.5 h-3.5 w-3.5" /> Recipe Idea
             </Button>
          </div>
          <p className="mt-2 text-center text-[9px] text-muted-foreground/60 italic">
            Availability may vary. Please call/check before going.
          </p>
        </div>
      </div>

      <NanumoniShopRecipePanel 
        shop={shop} 
        open={recipeOpen} 
        onOpenChange={setRecipeOpen} 
      />
    </>
  );
}