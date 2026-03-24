import { ReviewService } from "@/server/packs/review.service";
import { handleRouteError, jsonResponse } from "@/server/shared/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const reviewService = new ReviewService();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ draftToken: string }> },
) {
  try {
    const { draftToken } = await params;
    const review = await reviewService.getReview(draftToken);
    return jsonResponse({ review });
  } catch (error) {
    return handleRouteError(error);
  }
}
