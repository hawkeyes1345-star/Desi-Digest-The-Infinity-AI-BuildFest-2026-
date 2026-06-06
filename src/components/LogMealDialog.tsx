import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { logMeal, type MealLog } from "@/lib/meals.functions";
import { addDemoMeal } from "@/lib/demo-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

/** Form state type — values are strings because they come from <input>s */
interface LogMealForm {
  meal_type: MealLog["meal_type"];
  name: string;
  calories: string;
  protein_g: string;
  fat_g: string;
  carbs_g: string;
  fiber_g: string;
  water_ml: string;
}

const INITIAL_FORM: LogMealForm = {
  meal_type: "lunch",
  name: "",
  calories: "",
  protein_g: "",
  fat_g: "",
  carbs_g: "",
  fiber_g: "",
  water_ml: "",
};

const NUMERIC_FIELDS = ["calories", "protein_g", "carbs_g", "fat_g", "fiber_g", "water_ml"] as const;

function fieldLabel(k: string): string {
  if (k === "water_ml") return "Water (ml)";
  return k.replace("_g", " (g)").replace("calories", "Calories");
}

export interface LogMealDialogProps {
  demo?: boolean;
  onDemoMealLogged?: (meal: MealLog) => void;
}

export function LogMealDialog({ demo = false, onDemoMealLogged }: LogMealDialogProps) {
  const qc = useQueryClient();
  const log = useServerFn(logMeal);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<LogMealForm>(INITIAL_FORM);

  const mut = useMutation({
    mutationFn: async () => {
      const meal = {
        meal_type: form.meal_type,
        name: form.name.trim() || "Meal",
        calories: Number(form.calories) || 0,
        protein_g: Number(form.protein_g) || 0,
        fat_g: Number(form.fat_g) || 0,
        carbs_g: Number(form.carbs_g) || 0,
        fiber_g: Number(form.fiber_g) || 0,
        water_ml: Number(form.water_ml) || 0,
        source: "manual" as const,
      };

      if (demo) return addDemoMeal(meal);
      return log({ data: meal });
    },
    onSuccess: (meal) => {
      if (demo) onDemoMealLogged?.(meal);
      else qc.invalidateQueries({ queryKey: ["meals"] });
      toast.success("Logged ✓");
      setOpen(false);
      setForm(INITIAL_FORM);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't log"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4" /> Log meal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a meal</DialogTitle>
          <DialogDescription>Quick entry — you can always edit later.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate();
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Meal</Label>
              <select
                value={form.meal_type}
                onChange={(e) =>
                  setForm({ ...form, meal_type: e.target.value as MealLog["meal_type"] })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Bhat + dal + pui shak"
              />
            </div>
            {NUMERIC_FIELDS.map((k) => (
              <div key={k}>
                <Label className="text-xs">{fieldLabel(k)}</Label>
                <Input
                  type="number"
                  min={0}
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mut.isPending}>
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
