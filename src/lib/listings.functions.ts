import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { ListingDTO, ListingFilters } from "@/lib/format";

type DbListing = {
  id: string;
  title: string;
  make: string;
  model: string;
  year_of_manufacture: number;
  body_type: string;
  transmission: string;
  fuel_type: string;
  mileage_km: number;
  price_kes: string | number;
  location: string;
  description: string;
  photos: string[] | null;
  status: string;
  created_at: string;
  profiles: { full_name: string | null; phone_number: string | null } | null;
};

function toDto(row: DbListing): ListingDTO {
  return {
    id: row.id,
    title: row.title,
    make: row.make,
    model: row.model,
    year_of_manufacture: row.year_of_manufacture,
    body_type: row.body_type,
    transmission: row.transmission,
    fuel_type: row.fuel_type,
    mileage_km: row.mileage_km,
    price_kes: Number(row.price_kes),
    location: row.location,
    description: row.description,
    photos: Array.isArray(row.photos) ? row.photos : [],
    status: row.status,
    created_at: row.created_at,
    seller_name: row.profiles?.full_name ?? null,
    seller_phone: row.profiles?.phone_number ?? null,
  };
}

function createPublicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    // Opaque sb_ keys are not JWTs; send only apikey, never a Bearer token.
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getPublicListings = createServerFn({ method: "GET" })
  .inputValidator((data: ListingFilters) => data ?? {})
  .handler(async ({ data }): Promise<ListingDTO[]> => {
    const supabase = createPublicClient();
    let query = supabase
      .from("listings")
      .select("*, profiles(full_name, phone_number)")
      .eq("status", "active");

    if (data.q) {
      const term = `%${data.q}%`;
      query = query.or(`title.ilike.${term},make.ilike.${term},model.ilike.${term}`);
    }
    if (data.make) query = query.eq("make", data.make);
    if (data.bodyType) query = query.eq("body_type", data.bodyType);
    if (data.maxPrice) query = query.lte("price_kes", data.maxPrice);
    if (data.location) query = query.ilike("location", `%${data.location}%`);

    if (data.sort === "price-asc") query = query.order("price_kes", { ascending: true });
    else if (data.sort === "price-desc") query = query.order("price_kes", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const { data: rows, error } = await query.limit(60);
    if (error) {
      console.error("[getPublicListings]", error.message);
      return [];
    }
    return (rows ?? []).map((r) => toDto(r as unknown as DbListing));
  });

export const getPublicListing = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<ListingDTO | null> => {
    const supabase = createPublicClient();
    const { data: row, error } = await supabase
      .from("listings")
      .select("*, profiles(full_name, phone_number)")
      .eq("id", data.id)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      console.error("[getPublicListing]", error.message);
      return null;
    }
    return row ? toDto(row as unknown as DbListing) : null;
  });
