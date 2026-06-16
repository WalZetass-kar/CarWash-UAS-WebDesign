import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { aiReviewAnalyses } from "@/drizzle/schema";
import { getDb, hasDatabaseConfig } from "@/drizzle/db";
import type { AiReviewAnalysis } from "@/lib/data";
import { demoStore } from "@/lib/demo-store";
import { type ReviewSentiment, reviewSentiments } from "@/lib/constants";
import { analyzeReviewSentiment } from "@/lib/review-sentiment";
import type { AiReviewInput } from "@/schemas/ai-review";

const aiReviewSelection = {
  id: aiReviewAnalyses.id,
  customerName: aiReviewAnalyses.customerName,
  review: aiReviewAnalyses.review,
  sentiment: aiReviewAnalyses.sentiment,
  confidenceScore: aiReviewAnalyses.confidenceScore,
  createdAt: aiReviewAnalyses.createdAt,
};

function normalizeSentimentFilter(sentiment?: string | null) {
  if (!sentiment) return null;
  return reviewSentiments.includes(sentiment as ReviewSentiment) ? (sentiment as ReviewSentiment) : null;
}

function filterAiReviews(items: AiReviewAnalysis[], query: string, sentiment?: ReviewSentiment | null) {
  const normalizedQuery = query.toLowerCase();

  return items
    .filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        [item.customerName, item.review, item.sentiment, String(item.confidenceScore)]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesSentiment = sentiment ? item.sentiment === sentiment : true;
      return matchesQuery && matchesSentiment;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function canFallbackToMemory(error: unknown) {
  return error instanceof Error && /ai_review_analyses|review_sentiment|does not exist|relation/i.test(error.message);
}

function createMemoryReview(input: AiReviewInput) {
  const analysis = analyzeReviewSentiment(input.review);
  const created: AiReviewAnalysis = {
    id: crypto.randomUUID(),
    customerName: input.customerName,
    review: input.review,
    sentiment: analysis.sentiment,
    confidenceScore: analysis.confidenceScore,
    createdAt: new Date().toISOString(),
  };

  demoStore.aiReviewAnalyses = [created, ...demoStore.aiReviewAnalyses];
  return created;
}

export async function listAiReviews(query = "", sentiment?: string | null) {
  const normalizedSentiment = normalizeSentimentFilter(sentiment);

  if (!hasDatabaseConfig()) {
    return filterAiReviews(demoStore.aiReviewAnalyses, query, normalizedSentiment);
  }

  try {
    const sentimentFilter = normalizedSentiment ? eq(aiReviewAnalyses.sentiment, normalizedSentiment) : undefined;
    const searchFilter = query
      ? or(
          ilike(aiReviewAnalyses.customerName, `%${query}%`),
          ilike(aiReviewAnalyses.review, `%${query}%`),
        )
      : undefined;

    return await getDb()
      .select(aiReviewSelection)
      .from(aiReviewAnalyses)
      .where(and(isNull(aiReviewAnalyses.deletedAt), sentimentFilter, searchFilter))
      .orderBy(desc(aiReviewAnalyses.createdAt));
  } catch (error) {
    if (canFallbackToMemory(error)) {
      return filterAiReviews(demoStore.aiReviewAnalyses, query, normalizedSentiment);
    }
    throw error;
  }
}

export async function createAiReviewAnalysis(input: AiReviewInput) {
  const analysis = analyzeReviewSentiment(input.review);

  if (!hasDatabaseConfig()) {
    return createMemoryReview(input);
  }

  try {
    const [created] = await getDb()
      .insert(aiReviewAnalyses)
      .values({
        customerName: input.customerName,
        review: input.review,
        sentiment: analysis.sentiment,
        confidenceScore: analysis.confidenceScore,
      })
      .returning(aiReviewSelection);

    return created;
  } catch (error) {
    if (canFallbackToMemory(error)) {
      return createMemoryReview(input);
    }
    throw error;
  }
}
