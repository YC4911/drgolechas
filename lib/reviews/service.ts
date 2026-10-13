import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { ReviewModel } from "@/models/review";

export interface PublicReview {
  id: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
  reviewer: string;
}

export interface ReviewSummary {
  averageRating: number;
  reviewCount: number;
  distribution: Record<number, number>;
  reviews: PublicReview[];
}

const emptyDistribution = (): Record<number, number> => ({
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
});

export async function getPublicReviewSummary(
  productId: string,
): Promise<ReviewSummary> {
  if (!Types.ObjectId.isValid(productId)) {
    return {
      averageRating: 0,
      reviewCount: 0,
      distribution: emptyDistribution(),
      reviews: [],
    };
  }
  await connectToDatabase();
  const objectId = new Types.ObjectId(productId);
  const [distributionRows, reviews] = await Promise.all([
    ReviewModel.aggregate<{
      _id: number;
      count: number;
      averageRating: number;
      reviewCount: number;
    }>([
      { $match: { product: objectId, approved: true } },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]).exec(),
    ReviewModel.find({ product: objectId, approved: true })
      .select("rating title comment verifiedPurchase createdAt user")
      .sort({ createdAt: -1 })
      .limit(30)
      .populate({ path: "user", select: "name" })
      .lean()
      .exec(),
  ]);
  const distribution = emptyDistribution();
  let reviewCount = 0;
  let ratingTotal = 0;
  for (const row of distributionRows) {
    distribution[row._id] = row.count;
    reviewCount += row.count;
    ratingTotal += row._id * row.count;
  }
  return {
    averageRating: reviewCount ? ratingTotal / reviewCount : 0,
    reviewCount,
    distribution,
    reviews: reviews.map((review) => {
      const user =
        review.user && typeof review.user === "object"
          ? (review.user as { name?: string })
          : null;
      return {
        id: review._id.toString(),
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        verifiedPurchase: review.verifiedPurchase,
        createdAt: review.createdAt?.toISOString() ?? "",
        reviewer: user?.name || "Customer",
      };
    }),
  };
}
