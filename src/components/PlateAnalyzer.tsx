"use client";

import { useRef, useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { analyzePlate, type PlateAnalysis } from "@/lib/analyze-plate.functions";
import { ALLOWED_IMAGE_MIME_TYPES, getImageMimeType, parseImageDataUrl } from "@/lib/image-mime";
import { NutritionLabel } from "@/components/NutritionLabel";
import { logMeal } from "@/lib/meals.functions";
import { isDemoSession, addDemoMeal, getDemoPlateAnalysis } from "@/lib/demo-session";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Camera,
  Upload,
  Sparkles,
  Loader2,
  Heart,
  Leaf,
  Flame,
  X,
  ImagePlus,
  AlertTriangle,
  RefreshCw,
  Wand2,
  Bookmark,
  Wallet,
  ArrowRight,
  UserCog,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import nanumoniAvatar from "@/assets/nanumoni-avatar.jpg";
import { fileToDownscaledDataUrl, MAX_BYTES } from "@/lib/plate/image-utils";
import { uploadPlatePhotoToSupabase } from "@/lib/plate/plate-upload";
import { PlateAnalysisResult } from "@/components/plate/PlateAnalysisResult";
import { NanumoniTroubleCard } from "@/components/plate/NanumoniTroubleCard";


type Props = {
  trigger?: React.ReactNode;
  userContext?: string;
};

const LOADING_STEPS = [
  "Preparing your Desi Digest nutrition summary…",
  "Using Desi Digest local nutrition intelligence…",
  "Scanning visible food items...",
  "Estimating portions...",
  "Cross-checking nutrition...",
  "Preparing safety review..."
];

function ScanningProgress() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/[0.02] p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="font-display text-sm font-bold text-foreground">
          {LOADING_STEPS[currentStep]}
        </span>
      </div>
      
      <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground px-2 pt-2 border-t border-border/40">
        <span className={cn(currentStep >= 0 ? "text-sage font-bold" : "text-muted-foreground")}>1. Scan</span>
        <ArrowRight className="h-3 w-3" />
        <span className={cn(currentStep >= 1 ? "text-sage font-bold" : "text-muted-foreground")}>2. Identify</span>
        <ArrowRight className="h-3 w-3" />
        <span className={cn(currentStep >= 2 ? "text-sage font-bold" : "text-muted-foreground")}>3. Estimate</span>
        <ArrowRight className="h-3 w-3" />
        <span className={cn(currentStep >= 3 ? "text-sage font-bold" : "text-muted-foreground")}>4. Review</span>
      </div>
    </div>
  );
}

function StatusSteps({ status }: { status: "idle" | "complete" }) {
  const currentStep = status === "idle" ? 1 : 4;
  return (
    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary/30 px-3.5 py-2 rounded-lg border border-border/40">
      <span className={cn("flex items-center gap-1", currentStep >= 1 && "text-sage font-black")}>
        <span>✓</span> Scan
      </span>
      <ArrowRight className="h-3 w-3" />
      <span className={cn("flex items-center gap-1", currentStep >= 2 ? "text-sage font-black" : "text-muted-foreground/60")}>
        <span>✓</span> Identify
      </span>
      <ArrowRight className="h-3 w-3" />
      <span className={cn("flex items-center gap-1", currentStep >= 3 ? "text-sage font-black" : "text-muted-foreground/60")}>
        <span>✓</span> Estimate
      </span>
      <ArrowRight className="h-3 w-3" />
      <span className={cn("flex items-center gap-1", currentStep >= 4 ? "text-sage font-black" : "text-muted-foreground/60")}>
        <span>✓</span> Review
      </span>
    </div>
  );
}


const analysisCache = new Map<string, PlateAnalysis>();

export function PlateAnalyzer({ trigger, userContext }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<PlateAnalysis | null>(null);
  const [confirmedItems, setConfirmedItems] = useState(false);
  const [itemsText, setItemsText] = useState("");

  useEffect(() => {
    if (analysis && !confirmedItems) {
      setItemsText(analysis.dishes.map(d => d.name).join(", "));
    }
  }, [analysis, confirmedItems]);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const analyze = useServerFn(analyzePlate);
  const log = useServerFn(logMeal);
  const demo = isDemoSession();

  const mutation = useMutation({
    mutationFn: async (payload: { dataUrl?: string; typedMeal?: string; demoSample?: string }) => {
      if (demo) {
        const sample = payload.demoSample || payload.typedMeal || "Rice, dal, fish";
        const result = getDemoPlateAnalysis(sample);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return result;
      }
      if (payload.dataUrl) {
        if (analysisCache.has(payload.dataUrl)) return analysisCache.get(payload.dataUrl)!;
        const parsed = parseImageDataUrl(payload.dataUrl);
        if (!parsed) throw new Error("Image upload failed. Please reupload the photo.");
        const res = await analyze({ data: { ...parsed, userContext } });
        if (res.detected && !res.detectionUnavailable && !res.blurry) {
          analysisCache.set(payload.dataUrl, res);
        }
        return res;
      }
      if (payload.typedMeal) return analyze({ data: { typedMeal: payload.typedMeal, userContext } });
      if (payload.demoSample) return analyze({ data: { demoSample: payload.demoSample, userContext } });
      throw new Error("No input provided");
    },
    onSuccess: (res) => setAnalysis(res),
    onError: (e) => toast.error(getPlateAnalysisErrorMessage(e)),
  });

  const logMut = useMutation({
    mutationFn: async () => {
      if (!analysis || !analysis.detected) return;
      const n = analysis.nutrition;
      const name = analysis.dishes.map((d) => d.name).join(" + ") || "Plate";
      const hour = new Date().getHours();
      const meal_type =
        hour < 11 ? "breakfast" : hour < 16 ? "lunch" : hour < 20 ? "dinner" : "snack";

      if (demo) {
        addDemoMeal({
          meal_type,
          name,
          calories: n?.calories ?? 0,
          protein_g: n?.protein_g ?? 0,
          fat_g: n?.fat_g ?? 0,
          carbs_g: n?.carbs_g ?? 0,
          fiber_g: n?.fiber_g ?? 0,
          sodium_mg: n?.sodium_mg ?? 0,
          health_score: analysis.healthScore,
          source: "photo",
          image_url: imageDataUrl || "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=600&q=80",
          analysis: analysis as any,
          water_ml: 0,
          sugar_g: 0,
        });
        return Promise.resolve();
      }

      let image_url: string | null = null;
      if (imageDataUrl) {
        image_url = await uploadPlatePhotoToSupabase(imageDataUrl);
      }

      await log({
        data: {
          meal_type,
          name,
          calories: n?.calories ?? 0,
          protein_g: n?.protein_g ?? 0,
          fat_g: n?.fat_g ?? 0,
          carbs_g: n?.carbs_g ?? 0,
          fiber_g: n?.fiber_g ?? 0,
          sodium_mg: n?.sodium_mg ?? 0,
          health_score: analysis.healthScore,
          source: "photo",
          image_url,
          analysis: analysis as unknown as Record<string, unknown>,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meals"] });
      qc.invalidateQueries({ queryKey: ["plate-history"] });
      toast.success("Saved to your plate history");
      setOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't log"),
  });

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    const mimeType = getImageMimeType(file);
    if (!mimeType || !ALLOWED_IMAGE_MIME_TYPES.includes(mimeType)) {
      toast.error("Please upload a PNG, JPG, JPEG, or WEBP image.");
      return;
    }

    if (file.size > MAX_BYTES * 4) {
      toast.error("Photo too large. Please pick a smaller one.");
      return;
    }
    try {
      const dataUrl = await fileToDownscaledDataUrl(file, mimeType);
      setImageDataUrl(dataUrl);
      setAnalysis(null);
      mutation.mutate({ dataUrl });
    } catch {
      toast.error("Image upload failed. Please reupload the photo.");
    }
  }

  function getPlateAnalysisErrorMessage(error: unknown) {
    const message = error instanceof Error ? error.message : String(error || "");
    
    if (/Unsupported image MIME type/i.test(message)) {
      return "Please upload a PNG, JPG, JPEG, or WEBP image.";
    }
    if (/Invalid or empty image payload|Image payload is required/i.test(message)) {
      return "Image upload failed. Please reupload the photo.";
    }
    if (/couldn't identify food|no food/i.test(message)) {
      return "I couldn't identify food in this image. Try a clearer food photo.";
    }
    return "Nanumoni is using local nutrition guidance right now. We need one quick confirmation to make your report more accurate.";
  }

  function reset() {
    setImageDataUrl(null);
    setAnalysis(null);
    setConfirmedItems(false);
    mutation.reset();
  }

  function retake() {
    reset();
    // Defer to next tick so the input is mounted/ready
    setTimeout(() => cameraRef.current?.click(), 0);
  }

  function reupload() {
    reset();
    setTimeout(() => fileRef.current?.click(), 0);
  }

  function retryAnalysis() {
    if (!imageDataUrl) return;
    setAnalysis(null);
    mutation.reset();
    mutation.mutate({ dataUrl: imageDataUrl });
  }

  function close(o: boolean) {
    setOpen(o);
    if (!o) reset();
  }

  // Derive a "needs retake" signal from the analysis
  const lowQuality =
    analysis &&
    (!analysis.detected ||
      analysis.blurry ||
      analysis.dishes.length === 0);


  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="lg" className="shadow-warm">
            <Camera className="h-4 w-4" /> 📸 Analyze My Plate
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-2xl overflow-y-auto p-0 sm:w-full">
        <DialogHeader className="glass-nav px-5 py-4">
          <div className="flex items-center gap-3">
            <img
              src={nanumoniAvatar}
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-full ring-2 ring-primary/30"
            />
            <div className="min-w-0">
              <DialogTitle className="font-display text-lg">
                Nutrition Intelligence Summary
              </DialogTitle>
              <DialogDescription className="text-xs">
                Clinical-style nutrition estimate based on visible food items, portion cues, and nutrition database cross-checks.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 p-5">
          {/* Always-mounted file inputs so retake/reupload work from any state */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {!mutation.isPending && (
            <StatusSteps status={analysis ? "complete" : "idle"} />
          )}

          {!imageDataUrl && (
            <div className="rounded-2xl border-2 border-dashed border-border bg-secondary/40 p-6 text-center">
              <ImagePlus className="mx-auto h-10 w-10 text-primary" />
              <p className="mt-3 font-display text-lg">Show Nanumoni your khabar</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Take a clear, top-down photo of your plate. Better light = better answer.
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <Button onClick={() => cameraRef.current?.click()} className="shadow-warm" disabled={mutation.isPending}>
                  <Camera className="h-4 w-4" /> Take photo
                </Button>
                <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={mutation.isPending}>
                  <Upload className="h-4 w-4" /> Upload from gallery
                </Button>
              </div>
            </div>
          )}

          {imageDataUrl && (!analysis || lowQuality) && (
            <div className="relative overflow-hidden rounded-2xl ring-1 ring-border">
              <img
                src={imageDataUrl}
                alt="Your plate"
                className="aspect-video w-full object-cover"
              />
              <button
                onClick={reset}
                className="absolute right-2 top-2 rounded-full glass-soft p-1.5 transition hover:bg-background"
                aria-label="Remove"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {mutation.isPending && (
            <ScanningProgress />
          )}

          {/* AI request failed entirely (network, gateway, rate limit, etc.) */}
          {mutation.isError && !mutation.isPending && (
            <NanumoniTroubleCard
              title="Analysis did not complete"
              message={getPlateAnalysisErrorMessage(mutation.error)}
              onRetake={retake}
              onReupload={reupload}
              onRetry={imageDataUrl ? retryAnalysis : undefined}
              onManualSubmit={(typedMeal) => {
                setAnalysis(null);
                mutation.reset();
                mutation.mutate({ typedMeal });
              }}
              onDemoSubmit={(demoSample) => {
                setAnalysis(null);
                mutation.reset();
                mutation.mutate({ demoSample });
              }}
            />
          )}

          {/* Analysis returned but image was blurry / nothing recognized */}
          {analysis && lowQuality && !mutation.isPending && (
            <NanumoniTroubleCard
              title={analysis.detectionUnavailable ? "Analysis did not complete" : "I can't see the food clearly"}
              message={analysis.nanumoniMessage}
              tips={analysis.detectionUnavailable ? undefined : [
                "Hold the phone right over the plate (top-down)",
                "Move near a window or turn on a bright light",
                "Wipe the camera lens — phone lenses get smudgy",
                "Fit the full plate in frame, no fingers on top",
              ]}
              onRetake={retake}
              onReupload={reupload}
              onManualSubmit={(typedMeal) => {
                setAnalysis(null);
                mutation.reset();
                mutation.mutate({ typedMeal });
              }}
              onDemoSubmit={(demoSample) => {
                setAnalysis(null);
                mutation.reset();
                mutation.mutate({ demoSample });
              }}
            />
          )}

          {/* Confirmation step */}
          {analysis && !lowQuality && !confirmedItems && (
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <div>
                <h3 className="font-display text-lg">Confirm what's on your plate</h3>
                {analysis.dishes.some(d => d.confidence === "low") ? (
                  <p className="text-xs font-semibold text-spice mt-1">
                    Vision estimate may be incomplete. Confirm items for better accuracy.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Verify the detected items below.
                  </p>
                )}
              </div>
              <input
                value={itemsText}
                onChange={(e) => setItemsText(e.target.value)}
                placeholder="e.g., Rice, dal, chicken curry"
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <Button onClick={() => setConfirmedItems(true)} className="w-full shadow-warm" size="lg">
                Confirm & View Summary
              </Button>
            </div>
          )}

          {/* Good analysis */}
          {analysis && !lowQuality && confirmedItems && (
            <div>
              <PlateAnalysisResult
                analysis={analysis}
                imageDataUrl={imageDataUrl}
                isRecentCached={Boolean(imageDataUrl && analysisCache.has(imageDataUrl) && analysisCache.get(imageDataUrl) === analysis)}
                onRetake={retake}
                onReupload={reupload}
              />
            </div>
          )}

          {analysis && imageDataUrl && analysis.detected && !lowQuality && confirmedItems && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                onClick={() => logMut.mutate()}
                disabled={logMut.isPending}
                className="shadow-warm"
              >
                <Heart className="h-4 w-4" /> Add to today's log
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const el = document.getElementById("nanumoni-healthier-tips");
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                    el.classList.add("bg-sage/25", "ring-2", "ring-sage");
                    setTimeout(() => {
                      el.classList.remove("bg-sage/25", "ring-2", "ring-sage");
                    }, 2000);
                  }
                }}
              >
                <Wand2 className="h-4 w-4" /> View healthier plan
              </Button>
              <Button variant="outline" onClick={() => logMut.mutate()} disabled={logMut.isPending}>
                <Bookmark className="h-4 w-4" /> Save this plate
              </Button>
              <Button variant="ghost" onClick={reset}>
                <Camera className="h-4 w-4" /> Analyze another
              </Button>
            </div>
          )}

        </div>
      </DialogContent>

    </Dialog>
  );
}
