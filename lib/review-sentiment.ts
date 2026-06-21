import type { ReviewSentiment } from "@/lib/constants";

export const reviewKeywords = {
  positive: [
    "bersih",
    "ramah",
    "cepat",
    "puas",
    "bagus",
    "rapi",
    "harum",
    "kilap",
    "nyaman",
    "terbaik",
  ],
  negative: [
    "kotor",
    "lambat",
    "mahal",
    "kecewa",
    "buruk",
    "bau",
    "rusak",
    "lama",
    "tidak rapi",
    "mengecewakan",
  ],
} as const;

type SentimentAnalysisResult = {
  sentiment: ReviewSentiment;
  confidenceScore: number;
  positiveMatches: string[];
  negativeMatches: string[];
};

export function analyzeReviewSentiment(review: string): SentimentAnalysisResult {
  const lower = review.toLowerCase();

  const positiveMatches = reviewKeywords.positive.filter((keyword) =>
    lower.includes(keyword),
  );
  const negativeMatches = reviewKeywords.negative.filter((keyword) =>
    lower.includes(keyword),
  );

  const positiveCount = positiveMatches.length;
  const negativeCount = negativeMatches.length;
  const total = positiveCount + negativeCount;

  if (total === 0) {
    return {
      sentiment: "netral",
      confidenceScore: 50,
      positiveMatches,
      negativeMatches,
    };
  }

  let sentiment: ReviewSentiment;
  let confidenceScore: number;

  if (positiveCount > negativeCount) {
    sentiment = "positif";
    confidenceScore = Math.round((positiveCount / total) * 100);
  } else if (negativeCount > positiveCount) {
    sentiment = "negatif";
    confidenceScore = Math.round((negativeCount / total) * 100);
  } else {
    sentiment = "netral";
    confidenceScore = 50;
  }

  return {
    sentiment,
    confidenceScore: Math.min(Math.max(confidenceScore, 10), 99),
    positiveMatches,
    negativeMatches,
  };
}
