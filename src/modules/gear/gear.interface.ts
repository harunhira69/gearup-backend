export interface GearFilterQuery {
  category?: string;
  price?: string;
  brand?: string;
}

export interface CreateGearPayload {
  name: string;
  description: string;
  brand: string;
  pricePerDay: number;
  stock: number;
  availableQuantity: number;
  imageUrl?: string;
  specifications?: Record<string, unknown>;
  categoryId: string;
}

export interface UpdateGearPayload {
  name?: string;
  description?: string;
  brand?: string;
  pricePerDay?: number;
  stock?: number;
  availableQuantity?: number;
  imageUrl?: string;
  specifications?: Record<string, unknown>;
  isAvailable?: boolean;
  categoryId?: string;
}