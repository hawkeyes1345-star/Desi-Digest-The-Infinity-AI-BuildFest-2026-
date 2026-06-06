import { AlertTriangle, Camera, Upload, RefreshCw, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function NanumoniTroubleCard({
  title,
  message,
  tips,
  onRetake,
  onReupload,
  onRetry,
  onManualSubmit,
  onDemoSubmit,
}: {
  title: string;
  message: string;
  tips?: string[];
  onRetake: () => void;
  onReupload: () => void;
  onRetry?: () => void;
  onManualSubmit?: (typedMeal: string) => void;
  onDemoSubmit?: (demoSample: string) => void;
}) {
  const [typedMeal, setTypedMeal] = useState("");

  return (
    <div className="overflow-hidden rounded-2xl border border-spice/40 bg-spice/5">
      <div className="flex items-start gap-3 border-b border-spice/30 bg-spice/10 px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-spice/20 text-spice">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-base leading-snug">{title}</p>
          <p className="mt-0.5 text-sm text-foreground/85">{message}</p>
        </div>
      </div>
      {tips && tips.length > 0 && (
        <ul className="space-y-1.5 px-4 py-3 text-sm">
          {tips.map((t, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-spice">•</span>
              <span className="text-foreground/85">{t}</span>
            </li>
          ))}
        </ul>
      )}

      {onManualSubmit && (
        <div className="border-t border-spice/30 px-4 py-3">
          <p className="mb-2 text-sm font-medium text-foreground/80">Or tell Nanumoni what you ate:</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. rice, dal, chicken curry"
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              value={typedMeal}
              onChange={(e) => setTypedMeal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && typedMeal && onManualSubmit(typedMeal)}
            />
            <Button disabled={!typedMeal} onClick={() => onManualSubmit(typedMeal)} className="shrink-0 shadow-warm">
              <Send className="mr-1 h-4 w-4" /> Analyze
            </Button>
          </div>
          {onDemoSubmit && (
            <div className="mt-3 space-y-2">
              <span className="text-xs text-muted-foreground font-semibold">Or use a demo sample:</span>
              <div className="flex flex-wrap gap-1.5 pb-1">
                <Button variant="outline" size="sm" onClick={() => onDemoSubmit("Kacchi Biryani")} className="h-7 text-xs font-medium">
                  <Sparkles className="mr-1 h-3 w-3 text-primary" /> Kacchi Biryani
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDemoSubmit("Rice, dal, fish")} className="h-7 text-xs font-medium">
                  <Sparkles className="mr-1 h-3 w-3 text-primary" /> Rice, dal, fish
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDemoSubmit("Paratha and egg")} className="h-7 text-xs font-medium">
                  <Sparkles className="mr-1 h-3 w-3 text-primary" /> Paratha and egg
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDemoSubmit("Mishti doi")} className="h-7 text-xs font-medium">
                  <Sparkles className="mr-1 h-3 w-3 text-primary" /> Mishti doi
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDemoSubmit("Rice, dal, chicken curry")} className="h-7 text-xs font-medium">
                  <Sparkles className="mr-1 h-3 w-3 text-primary" /> Rice, dal, chicken curry
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-border/60 px-4 py-3 glass-soft">
        <Button onClick={onRetake} variant={onManualSubmit ? "outline" : "default"} className={onManualSubmit ? "" : "shadow-warm"}>
          <Camera className="h-4 w-4" /> Retake photo
        </Button>
        <Button variant="outline" onClick={onReupload}>
          <Upload className="h-4 w-4" /> Reupload
        </Button>
        {onRetry && (
          <Button variant="ghost" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" /> Try again
          </Button>
        )}
      </div>
    </div>
  );
}
