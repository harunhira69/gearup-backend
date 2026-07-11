export interface CreateReviewPayload {
  rentalOrderId: string;
  gearItemId: string;
  rating: number;
  comment: string;
}