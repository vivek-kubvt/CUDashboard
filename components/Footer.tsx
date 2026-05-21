export function Footer() {
  return (
    <footer className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground sm:flex-row">
      <p>© {new Date().getFullYear()} Cursor Usage Dashboard</p>
      <p>
        Live Cursor API data · auto refresh every 5 minutes
      </p>
    </footer>
  );
}
