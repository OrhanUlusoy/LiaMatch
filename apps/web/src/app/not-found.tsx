import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="gradient-text text-7xl font-bold">404</h1>
      <p className="mt-4 text-xl text-muted-foreground">Sidan kunde inte hittas.</p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Tillbaka till startsidan
      </Link>
    </div>
  );
}
