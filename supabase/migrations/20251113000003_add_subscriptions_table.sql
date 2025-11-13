-- ============================================================================
-- WU Coach 2 - Subscriptions Table
-- Feature: 005-schedule-rank-subscription (Phase 5 - User Story 2)
-- Created: 2025-11-13
-- Description: Stores subscription history from Moyklass CRM for filtering
-- ============================================================================

-- ============================================================================
-- Table: subscriptions
-- Description: Historical subscription records for season-based filtering
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
    moyklass_subscription_id TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_athlete ON public.subscriptions(athlete_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_dates ON public.subscriptions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_moyklass_id ON public.subscriptions(moyklass_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- Comments
COMMENT ON TABLE public.subscriptions IS 'Subscription history from Moyklass CRM for season-based filtering';
COMMENT ON COLUMN public.subscriptions.athlete_id IS 'Reference to athlete record';
COMMENT ON COLUMN public.subscriptions.moyklass_subscription_id IS 'Original Moyklass subscription ID for deduplication';
COMMENT ON COLUMN public.subscriptions.start_date IS 'Subscription start date (Moyklass beginDate)';
COMMENT ON COLUMN public.subscriptions.end_date IS 'Subscription end date (Moyklass endDate)';
COMMENT ON COLUMN public.subscriptions.status IS 'Subscription status: active, expired, cancelled';

-- ============================================================================
-- Trigger: Auto-update updated_at timestamp
-- ============================================================================
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Function: Get subscriptions for season (for PWA filtering)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_subscriptions_for_season(
    p_season_start DATE,
    p_season_end DATE
)
RETURNS TABLE (
    athlete_id UUID,
    subscription_count BIGINT,
    latest_start_date DATE,
    latest_end_date DATE,
    latest_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.athlete_id,
        COUNT(*) AS subscription_count,
        MAX(s.start_date) AS latest_start_date,
        MAX(s.end_date) AS latest_end_date,
        (ARRAY_AGG(s.status ORDER BY s.end_date DESC))[1] AS latest_status
    FROM public.subscriptions s
    WHERE
        (s.end_date IS NULL OR s.end_date >= p_season_start)
        AND (s.start_date IS NULL OR s.start_date <= p_season_end)
    GROUP BY s.athlete_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_subscriptions_for_season IS 'Get subscription summary for athletes within season date range (overlapping logic)';

-- ============================================================================
-- RLS Policies (if needed in future)
-- ============================================================================
-- ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- For now, we rely on service role key from GitHub Actions
-- Public access will be added later when authentication is implemented
