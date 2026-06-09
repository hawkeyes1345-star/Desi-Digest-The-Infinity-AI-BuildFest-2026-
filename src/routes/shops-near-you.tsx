import { createFileRoute, redirect, useRouter, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isDemoSession } from "@/lib/demo-session";
import { NEARBY_SHOPS, type NearbyShop } from "@/lib/shops-near-you";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowLeft, Filter, AlertTriangle, ShieldCheck, ShoppingBag, Sprout, Loader2 } from "lucide-react";
import { ShopsNearYouCard } from "@/components/ShopsNearYouCard";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import logoMark from "@/assets/logo-mark.png";
import { RawFoodBasketBridge } from "@/components/RawFoodBasketBridge";

export const Route = createFileRoute("/shops-near-you")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    if (isDemoSession()) return;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data?.session) {
        throw redirect({ to: "/login" });
      }
    } catch (err) {
      if (err && typeof err === "object" && "to" in err) throw err;
      throw redirect({ to: "/login" });
    }
  },
  component: ShopsNearYouPage,
});

// Haversine formula to calculate distance between two coordinates
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
}

function ShopsNearYouPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("All");
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const filters = [
    "All", "Near me", "Home made", "Farmer sourced", "Public markets", 
    "Arot / wholesale", "Grocery / raw ingredients", "Fish", "Fruits", 
    "Vegetables", "Matches my diet", "Sample partners", "Search helpers"
  ];

  const handleLocate = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLoc({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setActiveFilter("Near me");
          setIsLocating(false);
          toast.success("Location found. Sorting shops by distance.");
        },
        (error) => {
          console.warn("Geolocation blocked:", error);
          toast.info("Location permission wasn't allowed. Showing default Dhaka discovery options.");
          setIsLocating(false);
        },
        { timeout: 5000 }
      );
    } else {
      toast.error("Geolocation is not supported by your browser.");
      setIsLocating(false);
    }
  };

  const sortedAndFilteredShops = useMemo(() => {
    let result = [...NEARBY_SHOPS];

    // Calculate distances if we have user location
    if (userLoc) {
      result = result.map(shop => {
        if (shop.lat && shop.lng) {
          return { ...shop, distanceKm: getDistanceKm(userLoc.lat, userLoc.lng, shop.lat, shop.lng) };
        }
        return shop;
      });
    }

    // Apply Filter
    if (activeFilter !== "All") {
      result = result.filter(shop => {
        switch(activeFilter) {
          case "Near me": 
            return shop.distanceKm !== undefined || shop.sourceType === "google_maps_search";
          case "Home made": 
            return shop.type === "home_made";
          case "Farmer sourced": 
            return shop.type === "farmer_sourced" || shop.sourcing === "direct_farmer";
          case "Public markets": 
            return shop.sourcing === "public_market" || shop.type === "kacha_bazar";
          case "Arot / wholesale": 
            return shop.type === "wholesale_arot";
          case "Grocery / raw ingredients": 
            return shop.type === "supermarket" || shop.type === "grocery";
          case "Fish": 
            return shop.imageKind === "fish" || shop.type === "fish_market";
          case "Fruits": 
            return shop.imageKind === "fruit" || shop.type === "fruit_shop";
          case "Vegetables": 
            return shop.imageKind === "vegetables" || shop.type === "vegetable_market";
          case "Matches my diet": 
            return shop.dietMatch;
          case "Sample partners": 
            return shop.isPartnerDemo;
          case "Search helpers": 
            return shop.sourceType === "google_maps_search";
          default: 
            return true;
        }
      });
    }

    // Sort by distance if near me is active and distances exist
    if (activeFilter === "Near me" && userLoc) {
      result.sort((a, b) => {
        if (a.distanceKm !== undefined && b.distanceKm !== undefined) return a.distanceKm - b.distanceKm;
        if (a.distanceKm !== undefined) return -1;
        if (b.distanceKm !== undefined) return 1;
        return 0;
      });
    }

    return result;
  }, [activeFilter, userLoc]);

  return (
    <div className="min-h-screen bg-warm-gradient pb-20">
      <header className="glass-nav sticky top-0 z-40 border-b border-border shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full shadow-soft ring-1 ring-primary/20">
              <img src={logoMark} alt="Logo" width={36} height={36} className="h-full w-full object-cover" />
            </span>
            <span className="font-display text-base font-semibold hidden sm:inline-block">Deshi Digest</span>
          </Link>
          <div className="flex items-center gap-2">
             <Button variant="ghost" size="sm" onClick={() => router.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
             </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 mt-8 space-y-8">
        
        {/* Header Section */}
        <section className="text-center max-w-2xl mx-auto">
           <h1 className="font-display text-3xl font-bold md:text-4xl text-foreground">
             Local Discovery
           </h1>
           <p className="mt-3 text-sm text-muted-foreground sm:text-base leading-relaxed">
             Find nutrition-friendly local food options, markets, and ingredient sources near you. This is a discovery bridge — not an official marketplace.
           </p>
           
           <div className="mt-6 flex flex-wrap justify-center gap-3">
             <Button 
                onClick={handleLocate} 
                disabled={isLocating}
                className="shadow-warm rounded-full"
             >
               {isLocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
               Use my location
             </Button>
           </div>
           {userLoc && (
              <p className="mt-3 text-[10px] text-muted-foreground/70 flex items-center justify-center gap-1">
                 <ShieldCheck className="h-3 w-3" /> Location is used only in your browser to sort options. We do not store it.
              </p>
           )}
        </section>

        {/* Filters */}
        <section>
          <div className="flex overflow-x-auto pb-2 custom-scrollbar gap-2 snap-x">
             {filters.map(f => (
               <button
                 key={f}
                 onClick={() => setActiveFilter(f)}
                 className={cn(
                   "whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all border snap-start",
                   activeFilter === f 
                    ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                    : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                 )}
               >
                 {f}
               </button>
             ))}
          </div>
        </section>

        {/* Grid */}
        <section>
           {sortedAndFilteredShops.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-3xl border border-dashed border-border">
               <AlertTriangle className="h-10 w-10 text-muted-foreground mb-3" />
               <h3 className="font-display text-lg font-semibold">No options match this filter.</h3>
               <p className="text-sm text-muted-foreground">Try selecting "All" or adjusting your criteria.</p>
               <Button variant="outline" className="mt-4" onClick={() => setActiveFilter("All")}>Clear Filters</Button>
             </div>
           ) : (
             <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {sortedAndFilteredShops.map(shop => (
                   <ShopsNearYouCard key={shop.id} shop={shop} />
                ))}
             </div>
           )}
        </section>

        {/* Bottom CTA to Raw Food Basket */}
        <section className="pt-8 border-t border-border/50">
           <div className="max-w-2xl mx-auto space-y-4">
              <h3 className="font-display text-xl font-semibold text-center flex items-center justify-center gap-2">
                 <ShoppingBag className="h-5 w-5 text-primary" /> Need raw ingredients?
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                 Turn your nutrition advice into a shopping list for your local kacha bazar.
              </p>
              <RawFoodBasketBridge basketId="balanced-deshi" isDemo={isDemoSession()} />
           </div>
        </section>

        <footer className="pt-10 pb-6 text-center">
           <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground/70">
              <div className="flex items-center gap-1.5 bg-muted/30 px-3 py-1.5 rounded-full border border-border/30">
                 <ShieldCheck className="h-3.5 w-3.5" />
                 <span>General nutrition guidance — not medical advice.</span>
              </div>
              <p className="max-w-md mt-2">
                 Desi Digest helps you discover local options. We are not affiliated with these public locations unless explicitly labeled. Availability and prices depend on the vendor.
              </p>
           </div>
        </footer>

      </main>
    </div>
  );
}