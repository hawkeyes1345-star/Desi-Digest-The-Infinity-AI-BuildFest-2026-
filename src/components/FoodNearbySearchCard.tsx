"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Store, Leaf, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  buildGoogleMapsSearchUrl,
  buildSupermarketSearchUrl,
  buildHealthyStoreSearchUrl,
} from "@/lib/food-location-intent";

interface FoodNearbySearchCardProps {
  searchTerm: string;
  className?: string;
}

export function FoodNearbySearchCard({ searchTerm, className }: FoodNearbySearchCardProps) {
  const [isLocating, setIsLocating] = useState(false);

  const handleSearch = (type: "maps" | "supermarket" | "healthy") => {
    setIsLocating(true);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          openMaps(type, coords);
        },
        (error) => {
          console.warn("Geolocation blocked or failed:", error);
          toast.info("Location permission denied or unavailable. Opening general Maps search.");
          openMaps(type);
        },
        { timeout: 5000 }
      );
    } else {
      toast.info("Geolocation not supported by browser. Opening general Maps search.");
      openMaps(type);
    }
  };

  const openMaps = (type: "maps" | "supermarket" | "healthy", coords?: { latitude: number; longitude: number }) => {
    setIsLocating(false);
    let url = "";

    switch (type) {
      case "maps":
        url = buildGoogleMapsSearchUrl(searchTerm, coords);
        break;
      case "supermarket":
        url = buildSupermarketSearchUrl(searchTerm, coords);
        break;
      case "healthy":
        url = buildHealthyStoreSearchUrl(searchTerm, coords);
        break;
    }

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className={cn("mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm", className)}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MapPin className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="font-display text-sm font-semibold text-foreground">
            Find nearby shops
          </h4>
          <p className="text-xs text-muted-foreground">
            Ei item ta ({searchTerm}) nearby dokan/supermarket e khujte paren. Maps search can help you find nearby shops.
          </p>
          
          <div className="mt-3 flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="default" 
              className="shadow-sm" 
              onClick={() => handleSearch("maps")}
              disabled={isLocating}
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              {isLocating ? "Locating..." : "Open Google Maps"}
            </Button>
            
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={() => handleSearch("supermarket")}
              disabled={isLocating}
            >
              <Store className="mr-1.5 h-3.5 w-3.5" />
              Search supermarkets
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleSearch("healthy")}
              disabled={isLocating}
            >
              <Leaf className="mr-1.5 h-3.5 w-3.5 text-sage" />
              Healthy stores
            </Button>
          </div>
          
          <p className="mt-2 text-[10px] text-muted-foreground/70 italic">
            Availability may vary. Please call/check the shop before going. This is a search helper, not live inventory.
          </p>
        </div>
      </div>
    </div>
  );
}