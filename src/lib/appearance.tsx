import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const THEMES = [
  { id: "classic-deshi", label: "Classic Deshi", hint: "Warm terracotta & cream" },
  { id: "modern-green", label: "Modern Green", hint: "Fresh sage & emerald" },
  { id: "festival-gold", label: "Festival Gold", hint: "Eid & Boishakh glow" },
  { id: "dark-midnight", label: "Dark Midnight", hint: "Deep, focused, calm" },
  { id: "light-minimal", label: "Light Minimal", hint: "Crisp white & ink" },
] as const;
export type ThemeId = (typeof THEMES)[number]["id"];

export type Language = "en" | "bn";

type Appearance = {
  theme: ThemeId;
  language: Language;
  animations: boolean;
  setTheme: (t: ThemeId) => void;
  setLanguage: (l: Language) => void;
  setAnimations: (v: boolean) => void;
};

const Ctx = createContext<Appearance | null>(null);

const KEY = "deshi.appearance.v1";

function readStored(): Pick<Appearance, "theme" | "language" | "animations"> {
  if (typeof window === "undefined") {
    return { theme: "classic-deshi", language: "en", animations: true };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        theme: (p.theme as ThemeId) ?? "classic-deshi",
        language: (p.language as Language) ?? "en",
        animations: typeof p.animations === "boolean" ? p.animations : true,
      };
    }
  } catch {}
  return { theme: "classic-deshi", language: "en", animations: true };
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => readStored());

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", state.theme);
    root.setAttribute("data-animations", state.animations ? "on" : "off");
    root.setAttribute("lang", state.language);
    // dark color-scheme for dark-midnight
    if (state.theme === "dark-midnight") root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const value: Appearance = {
    ...state,
    setTheme: (theme) => setState((s) => ({ ...s, theme })),
    setLanguage: (language) => setState((s) => ({ ...s, language })),
    setAnimations: (animations) => setState((s) => ({ ...s, animations })),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppearance() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppearance must be used inside AppearanceProvider");
  return v;
}

// Minimal i18n surface — enough to demonstrate the toggle on shared UI.
const DICT: Record<Language, Record<string, string>> = {
  en: {
    back: "Back",
    appearance: "Appearance",
    theme: "Theme",
    language: "Language",
    reduce_motion: "Reduce motion",
    reduce_motion_hint: "Pauses background videos and disables animations for a calmer experience.",
    save: "Save profile",
    english: "English",
    bangla: "বাংলা",
    your_profile: "Your profile",
  },
  bn: {
    back: "ফিরে যান",
    appearance: "চেহারা",
    theme: "থিম",
    language: "ভাষা",
    reduce_motion: "অ্যানিমেশন কমান",
    reduce_motion_hint: "পেছনের ভিডিও বন্ধ এবং অ্যানিমেশন কমিয়ে শান্ত অভিজ্ঞতা দিন।",
    save: "প্রোফাইল সেভ করুন",
    english: "English",
    bangla: "বাংলা",
    your_profile: "আপনার প্রোফাইল",
  },
};

export function useT() {
  const { language } = useAppearance();
  return (key: keyof (typeof DICT)["en"]) => DICT[language][key] ?? DICT.en[key] ?? key;
}
