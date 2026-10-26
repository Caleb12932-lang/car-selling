import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import { getPublicListing } from "@/lib/listings.functions";
import { formatKes, formatMileage, photoUrl } from "@/lib/format";
import type { ListingDTO } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/listings/$listingId")({
  loader: async ({ params }): Promise<ListingDTO> => {
    const listing = await getPublicListing({ data: { id: params.listingId } });
    if (!listing) throw notFound();
    return listing;
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.title} — ${formatKes(loaderData.price_kes)} | GariSoko`
          : "Car listing | GariSoko",
      },
      {
        name: "description",
        content: loaderData
          ? `${loaderData.title} for sale in ${loaderData.location} at ${formatKes(loaderData.price_kes)}. Contact the seller on GariSoko.`
          : "Car listing for sale in Kenya.",
      },
      {
        property: "og:title",
        content: loaderData ? `${loaderData.title} — ${formatKes(loaderData.price_kes)}` : "Car listing | GariSoko",
      },
      {
        property: "og:description",
        content: loaderData ? `For sale in ${loaderData.location} · ${formatMileage(loaderData.mileage_km)}` : "Car listing in Kenya",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ListingDetail,
});

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium text-foreground">{value}</p>
    </div>
  );
}

function ListingDetail() {
  const listing = Route.useLoaderData() as ListingDTO;
  const [photoIdx, setPhotoIdx] = useState(0);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });

  const photos = listing.photos.map(photoUrl);

  const sendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const { error } = await supabase.from("inquiries").insert({
      listing_id: listing.id,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      message: form.message.trim(),
    });
    setSending(false);
    if (error) {
      toast.error("Could not send your message. Please try again.");
      return;
    }
    setSent(true);
    toast.success("Message sent! The seller will get back to you.");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            {photos[photoIdx] ? (
              <img
                src={photos[photoIdx]}
                alt={listing.title}
                width={1024}
                height={768}
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center bg-muted text-muted-foreground">
                No photo
              </div>
            )}
          </div>
          {photos.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {photos.map((p, i) => (
                <button
                  key={p}
                  onClick={() => setPhotoIdx(i)}
                  className={`h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                    i === photoIdx ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={p} alt="" loading="lazy" width={224} height={160} className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <h1 className="mt-6 text-3xl font-bold text-foreground">{listing.title}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            Listed in {listing.location}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Spec label="Price" value={formatKes(listing.price_kes)} />
            <Spec label="Year" value={String(listing.year_of_manufacture)} />
            <Spec label="Mileage" value={formatMileage(listing.mileage_km)} />
            <Spec label="Transmission" value={listing.transmission} />
            <Spec label="Fuel" value={listing.fuel_type} />
            <Spec label="Body type" value={listing.body_type} />
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-display text-lg font-semibold text-foreground">Description</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
              {listing.description}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <p className="font-display text-2xl font-bold text-foreground">
              {formatKes(listing.price_kes)}
            </p>
            <div className="mt-4 rounded-xl bg-muted p-4">
              <p className="text-xs text-muted-foreground">Sold by</p>
              <p className="mt-0.5 font-semibold text-foreground">{listing.seller_name ?? "Private seller"}</p>
              {listing.seller_phone && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="size-3.5" /> {listing.seller_phone}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-display text-lg font-semibold text-foreground">Contact the seller</h2>
            {sent ? (
              <p className="mt-3 rounded-xl bg-muted p-4 text-sm text-foreground">
                Your message has been sent. The seller will contact you on the phone number you provided.
              </p>
            ) : (
              <form className="mt-3 space-y-3" onSubmit={sendInquiry}>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none ring-ring/40 focus:ring-2"
                />
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Phone number, e.g. 0712 345 678"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none ring-ring/40 focus:ring-2"
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Email (optional)"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none ring-ring/40 focus:ring-2"
                />
                <textarea
                  required
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Hi, is this car still available? I'd like to arrange a viewing."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring/40 focus:ring-2"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  <Send className="size-4" />
                  {sending ? "Sending..." : "Send message"}
                </button>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="size-3.5" />
                  Never pay a deposit before viewing the car in person.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
