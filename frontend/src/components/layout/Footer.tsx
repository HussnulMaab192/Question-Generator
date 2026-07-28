import { env } from "@/config/env";

export default function Footer() {
  return (
    <footer className="border-t py-4">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-1 px-4 text-center text-xs text-muted-foreground sm:flex-row sm:gap-2 sm:px-6 lg:px-8">
        <span>© {new Date().getFullYear()} Quran Competition Question Generator</span>
        <span className="hidden sm:inline" aria-hidden="true">
          ·
        </span>
        <span>v{env.appVersion}</span>
      </div>
    </footer>
  );
}
