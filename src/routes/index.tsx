import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Car, Fuel, Gauge, MapPin, Search, Settings2 } from "lucide-react";
import { getPublicListings } from "@/lib/listings.functions";
import { formatKes, formatMileage, photoUrl, CAR_MAKES, BODY_TYPES, KENYAN_COUNTIES } from "@/lib/format";
import type { ListingDTO } from "@/lib/format";

type SearchParams = {
  q?: string;
  make?: string;
  bodyType?: string;
  maxPrice?: number;
  location?: string;
  sort?: "newest" | "price-asc" | "price-desc";
};

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search.q === "string" && search.q ? search.q : undefined,
    make: typeof search.make === "string" && search.make ? search.make : undefined,
    bodyType: typeof search.bodyType === "string" && search.bodyType ? search.bodyType : undefined,
    maxPrice: search.maxPrice ? Number(search.maxPrice) || undefined : undefined,
    location: typeof search.location === "string" && search.location ? search.location : undefined,
    sort: (["newest", "price-asc", "price-desc"] as const).find((s) => s === search.sort),
  }),
  loader: ({ deps }): Promise<ListingDTO[]> => getPublicListings({ data: deps }),
  head: () => ({
    meta: [
      { title: "Browse Cars for Sale in Kenya | GariSoko" },
      {
        name: "description",
        content:
          "Browse cars for sale across Kenya — Toyota, Nissan, Mazda and more. Prices in Kenyan Shillings, contact sellers directly.",
      },
      { property: "og:title", content: "Browse Cars for Sale in Kenya | GariSoko" },
      {
        property: "og:description",
        content: "Verified car listings across Kenya with prices in KES.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function ListingCard({ listing }: { listing: ListingDTO }) {
  const photo = listing.photos[0] ? photoUrl(listing.photos[0]) : null;
  return (
    <Link
      to="/listings/$listingId"
      params={{ listingId: listing.id }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-transform hover:-translate-y-0.5"
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        {photo ? (
          <img
            src={photo}
            alt={listing.title}
            loading="lazy"
            width={1024}
            height={768}
            className="size-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <Car className="size-10" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="font-display text-lg font-bold text-foreground">
          {formatKes(listing.price_kes)}
        </p>
        <p className="line-clamp-1 font-medium text-foreground">{listing.title}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Gauge className="size-3.5" /> {formatMileage(listing.mileage_km)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Settings2 className="size-3.5" /> {listing.transmission}
          </span>
          <span className="inline-flex items-center gap-1">
            <Fuel className="size-3.5" /> {listing.fuel_type}
          </span>
        </div>
        <div className="mt-auto flex items-center gap-1 pt-1 text-xs text-muted-foreground">
          <MapPin className="size-3.5" /> {listing.location}
        </div>
      </div>
    </Link>
  );
}

function Index() {
  const listings = Route.useLoaderData() as ListingDTO[];
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [q, setQ] = useState(search.q ?? "");

  const setFilter = (patch: Partial<SearchParams>) => {
    navigate({
      to: "/",
      search: (prev: SearchParams) => ({ ...prev, ...patch }),
    });
  };

  const hasFilters = useMemo(
    () => Boolean(search.q || search.make || search.bodyType || search.maxPrice || search.location),
    [search],
  );

  return (
    <div>
      <section className="hero-surface px-4 py-16 text-center sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white/80">
            Kenya's car marketplace · prices in KES
          </p>
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl">
            Find your next car, right here in Kenya
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/75">
            Browse cars from sellers across the country, compare prices in Kenyan Shillings and
            reach out directly — no middlemen.
          </p>
          <form
            className="mx-auto mt-8 flex max-w-xl gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setFilter({ q: q.trim() || undefined });
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search make or model, e.g. Toyota Prado"
                className="h-12 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm text-foreground outline-none ring-ring/40 focus:ring-2"
              />
            </div>
            <button
              type="submit"
              className="h-12 rounded-xl bg-accent px-6 font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Make
            <select
              value={search.make ?? ""}
              onChange={(e) => setFilter({ make: e.target.value || undefined })}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="">Any make</option>
              {CAR_MAKES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Body type
            <select
              value={search.bodyType ?? ""}
              onChange={(e) => setFilter({ bodyType: e.target.value || undefined })}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="">Any body</option>
              {BODY_TYPES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Location
            <select
              value={search.location ?? ""}
              onChange={(e) => setFilter({ location: e.target.value || undefined })}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="">Anywhere in Kenya</option>
              {KENYAN_COUNTIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Max price (KES)
            <input
              type="number"
              min={0}
              step={100000}
              value={search.maxPrice ?? ""}
              onChange={(e) =>
                setFilter({ maxPrice: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="Any price"
              className="h-10 w-36 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Sort by
            <select
              value={search.sort ?? "newest"}
              onChange={(e) => setFilter({ sort: e.target.value as SearchParams["sort"] })}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="newest">Newest first</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </label>
          {hasFilters && (
            <button
              onClick={() => navigate({ to: "/", search: {} })}
              className="h-10 rounded-lg border border-border px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Clear filters
            </button>
          )}
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          {listings.length} {listings.length === 1 ? "car" : "cars"} available
        </p>

        {listings.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <Car className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-3 font-medium text-foreground">No cars match your search</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try clearing some filters or checking back later.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
