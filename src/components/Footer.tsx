import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import logoMark from "@/assets/logo-mark.png";

export function Footer() {
  return (
    <footer className="mt-16 glass-nav border-t-0">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Brand and Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src={logoMark} alt="Deshi Digest logo" className="h-8 w-8 rounded-full shadow-soft" />
              <span className="font-display text-xl font-bold tracking-tight">Deshi Digest</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/75">
              AI-powered Bangladeshi meal guidance, plate analysis, and culturally aware nutrition support through Nanumoni.
            </p>
            <p className="text-xs text-foreground/60 italic">
              Built for the Google Gemini API BuildFest 2026 using Gemini, Supabase, embeddings, and RAG.
            </p>
          </div>

          {/* Useful Links */}
          <div className="space-y-4 lg:ml-auto">
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-primary">Useful Links</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-foreground/75 transition-colors hover:text-primary">
                Home
              </Link>
              <Link to="/docs" className="text-sm text-foreground/75 transition-colors hover:text-primary">
                Docs
              </Link>
              <Link to="/docs" hash="team" className="text-sm text-foreground/75 transition-colors hover:text-primary">
                Team Contributions
              </Link>
              <Link to="/docs" hash="tech-stack" className="text-sm text-foreground/75 transition-colors hover:text-primary">
                Tech Stack
              </Link>
            </nav>
          </div>

          {/* Social/GitHub */}
          <div className="space-y-4 lg:ml-auto">
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-primary">Source Code</h4>
            <a
              href="https://github.com/muhammadTasin/Desi-Diet-The-Infinity-AI-BuildFest-2026-"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg glass px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
            >
              <ExternalLink className="h-4 w-4" />
              GitHub
            </a>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="mt-12 border-t border-foreground/5 pt-8 text-center sm:flex sm:items-center sm:justify-between sm:text-left">
          <p className="text-xs text-foreground/60">
            © {new Date().getFullYear()} Deshi Digest.
          </p>
          <p className="mt-2 text-xs text-foreground/60 sm:mt-0 italic">
            For educational and wellness guidance only; not a medical diagnosis tool.
          </p>
        </div>
      </div>
    </footer>
  );
}
