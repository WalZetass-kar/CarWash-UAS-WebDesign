import type { ReviewSentiment } from "@/lib/constants";

const positiveKeywords = [
  "bersih",
  "cepat",
  "puas",
  "ramah",
  "bagus",
  "mantap",
  "nyaman",
  "rapi",
  "wangi",
  "profesional",
] as const;

const negativeKeywords = [
  "lama",
  "kotor",
  "kecewa",
  "buruk",
  "lambat",
  "kasar",
  "rusak",
  "jelek",
  "kurang",
  "antri",
] as const;

export const reviewKeywords = {
  positive: positiveKeywords,
  negative: negativeKeywords,
} as const;

function tokenizeReview(review: string) {
  return review
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function collectKeywordHits(tokens: string[], keywords: readonly string[]) {
  return tokens.flatMap((token) => {
    const match = keywords.find((keyword) => token.includes(keyword));
    return match ? [match] : [];
  });
}

function calculateConfidenceScore(positiveHits: number, negativeHits: number) {
  const totalHits = positiveHits + negativeHits;

  if (!totalHits) return 50;
  if (positiveHits === negativeHits) return Math.min(78, 55 + totalHits * 6);

  const gap = Math.abs(positiveHits - negativeHits);
  return Math.min(98, 65 + gap * 10 + Math.min(totalHits, 4) * 3);
}

export function analyzeReviewSentiment(review: string) {
  const tokens = tokenizeReview(review);
  const positiveMatches = collectKeywordHits(tokens, positiveKeywords);
  const negativeMatches = collectKeywordHits(tokens, negativeKeywords);

  let sentiment: ReviewSentiment = "netral";
  if (positiveMatches.length > negativeMatches.length) sentiment = "positif";
  if (negativeMatches.length > positiveMatches.length) sentiment = "negatif";

  return {
    sentiment,
    confidenceScore: calculateConfidenceScore(positiveMatches.length, negativeMatches.length),
    positiveMatches,
    negativeMatches,
  };
}
