DO $$
BEGIN
  CREATE TYPE review_sentiment AS ENUM ('positif', 'netral', 'negatif');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS ai_review_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  customer_name varchar(120) NOT NULL,
  review text NOT NULL,
  sentiment review_sentiment NOT NULL DEFAULT 'netral',
  confidence_score integer NOT NULL
);

CREATE INDEX IF NOT EXISTS ai_review_analyses_customer_idx ON ai_review_analyses (customer_name);
CREATE INDEX IF NOT EXISTS ai_review_analyses_sentiment_idx ON ai_review_analyses (sentiment);
CREATE INDEX IF NOT EXISTS ai_review_analyses_created_at_idx ON ai_review_analyses (created_at);
