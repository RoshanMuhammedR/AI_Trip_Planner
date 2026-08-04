import Link from 'next/link';
import { ArrowRight, CalendarDays, MapPinned, Share2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Written for your trip',
    body: 'Say where you are going, for how long, on what budget and with whom. You get an itinerary shaped around those answers, not a generic top-ten list.',
  },
  {
    icon: CalendarDays,
    title: 'Planned day by day',
    body: 'Each day is grouped around one area with three to five stops in a sensible order, plus travel time between them and the best hour to arrive.',
  },
  {
    icon: MapPinned,
    title: 'Plotted on a map',
    body: 'Every stop is pinned and colour-coded by day, so you can see the shape of each day before you commit to walking it.',
  },
  {
    icon: Share2,
    title: 'Private until you share',
    body: 'Trips are visible only to you. Turn sharing on and you get a single unguessable link to send to whoever you are travelling with.',
  },
] as const;

const STEPS = [
  { n: '01', title: 'Pick a destination', body: 'Search any city or region.' },
  { n: '02', title: 'Set the details', body: 'Days, budget and who is coming.' },
  { n: '03', title: 'Watch it build', body: 'Days appear as they are written.' },
] as const;

export default function HomePage() {
  return (
    <main id="main">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-70 [background:radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent)]"
        />

        <div className="mx-auto max-w-4xl px-4 pt-20 pb-16 text-center sm:px-6 sm:pt-28">
          <Badge variant="primary" className="animate-fade-up mb-6">
            <Sparkles className="size-3" aria-hidden="true" />
            Powered by Gemini
          </Badge>

          <h1 className="animate-fade-up text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            Your next trip, planned in <span className="text-primary">about a minute</span>
          </h1>

          <p className="text-muted-foreground animate-fade-up mx-auto mt-6 max-w-2xl text-lg text-pretty">
            Tell Wayfare where you want to go and how you like to travel. It writes a day-by-day
            itinerary with real places, honest prices and a map you can actually follow.
          </p>

          <div className="animate-fade-up mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/plan">
                Plan a trip <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/trips">View my trips</Link>
            </Button>
          </div>

          <p className="text-muted-foreground mt-4 text-xs">
            Free to use · Sign in with Google · No card required
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6" aria-labelledby="how-heading">
        <h2 id="how-heading" className="sr-only">
          How it works
        </h2>

        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.n} className="bg-card rounded-xl border p-5">
              <span className="text-primary font-mono text-xs font-semibold">{step.n}</span>
              <h3 className="mt-2 font-semibold">{step.title}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6" aria-labelledby="features-heading">
        <h2 id="features-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
          What you get
        </h2>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-card rounded-xl border p-6">
              <span className="bg-primary/10 text-primary mb-4 inline-flex size-10 items-center justify-center rounded-lg">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing call to action */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="bg-primary text-primary-foreground rounded-2xl px-6 py-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
            Where are you going next?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm opacity-90">
            Pick a place and Wayfare will have an itinerary ready before you finish your coffee.
          </p>
          <Button asChild size="lg" variant="accent" className="mt-7">
            <Link href="/plan">
              Start planning <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
