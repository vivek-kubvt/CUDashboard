export function Footer() {
  return (
    <footer className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground sm:flex-row">
      <p>© {new Date().getFullYear()} Cursor Usage Dashboard</p>
      <p>
        Auto refresh every 5 minutes · Built with Next.js 15, Tailwind, Recharts
      </p>
    </footer>
  );
}
