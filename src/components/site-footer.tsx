import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          Built by{' '}
          <a
            href="https://github.com/RoshanMuhammedR"
            className="hover:text-foreground underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            Roshan Muhammed R
          </a>
        </p>

        {/* Required attribution for the free, keyless data sources. */}
        <p className="text-xs">
          Places from{' '}
          <a
            href="https://www.openstreetmap.org/copyright"
            className="hover:text-foreground underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenStreetMap
          </a>
          {' · '}
          Images from{' '}
          <a
            href="https://commons.wikimedia.org"
            className="hover:text-foreground underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            Wikimedia Commons
          </a>
          {' · '}
          <Link href="/plan" className="hover:text-foreground underline underline-offset-4">
            Plan a trip
          </Link>
        </p>
      </div>
    </footer>
  );
}
