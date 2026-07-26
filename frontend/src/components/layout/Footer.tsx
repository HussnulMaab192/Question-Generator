export default function Footer() {
  return (
    <footer className="border-t py-4">
      <div className="mx-auto max-w-7xl px-4 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
        © {new Date().getFullYear()} Quran Competition Question Generator
      </div>
    </footer>
  );
}
