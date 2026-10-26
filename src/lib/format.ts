export type ListingDTO = {
  id: string;
  title: string;
  make: string;
  model: string;
  year_of_manufacture: number;
  body_type: string;
  transmission: string;
  fuel_type: string;
  mileage_km: number;
  price_kes: number;
  location: string;
  description: string;
  photos: string[];
  status: string;
  created_at: string;
  seller_name: string | null;
  seller_phone: string | null;
};

export type ListingFilters = {
  q?: string;
  make?: string;
  bodyType?: string;
  maxPrice?: number;
  location?: string;
  sort?: "newest" | "price-asc" | "price-desc";
};

export type InquiryDTO = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  created_at: string;
  listing_id: string;
};

const kes = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});

export function formatKes(value: number): string {
  return kes.format(value);
}

export function formatMileage(km: number): string {
  return `${new Intl.NumberFormat("en-KE").format(km)} km`;
}

/** Photos are stored either as app paths (/images/...) or storage paths prefixed listing-photos/ */
export function photoUrl(photo: string): string {
  const prefix = "listing-photos/";
  return photo.startsWith(prefix)
    ? `/api/public/photos/${photo.slice(prefix.length)}`
    : photo;
}

export const KENYAN_COUNTIES = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Uasin Gishu (Eldoret)",
  "Kiambu",
  "Machakos",
  "Kajiado",
  "Nyeri",
  "Kakamega",
];

export const CAR_MAKES = [
  "Toyota",
  "Nissan",
  "Mazda",
  "Subaru",
  "Mitsubishi",
  "Honda",
  "Volkswagen",
  "Mercedes-Benz",
  "BMW",
  "Isuzu",
  "Suzuki",
  "Ford",
];

export const BODY_TYPES = ["SUV", "Sedan", "Hatchback", "Pickup", "Station Wagon", "Coupe", "Van"];
