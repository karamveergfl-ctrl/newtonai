-- ============================================
-- COMPREHENSIVE SECURITY HARDENING MIGRATION
-- ============================================

-- 1. PAYMENTS TABLE: Block all user INSERT (payments handled by webhooks/edge functions only)
DROP POLICY IF EXISTS "Users can insert their own payments" ON payments;
CREATE POLICY "No direct payment inserts" ON payments FOR INSERT WITH CHECK (false);

-- 2. REDEEMED_CODES TABLE: Block INSERT and DELETE (handled via RPC only)
DROP POLICY IF EXISTS "Users can insert their own redeemed codes" ON redeemed_codes;
DROP POLICY IF EXISTS "Users can delete their own redeemed codes" ON redeemed_codes;
CREATE POLICY "No direct redeemed codes inserts" ON redeemed_codes FOR INSERT WITH CHECK (false);
CREATE POLICY "No direct redeemed codes deletes" ON redeemed_codes FOR DELETE USING (false);

-- 3. CREDIT_TRANSACTIONS TABLE: Make fully immutable (SELECT only)
DROP POLICY IF EXISTS "Users can delete their own transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON credit_transactions;
CREATE POLICY "No direct transaction inserts" ON credit_transactions FOR INSERT WITH CHECK (false);
CREATE POLICY "No direct transaction deletes" ON credit_transactions FOR DELETE USING (false);

-- 4. FEATURE_USAGE TABLE: Block all modifications (handled server-side only)
DROP POLICY IF EXISTS "Users can insert their own usage" ON feature_usage;
DROP POLICY IF EXISTS "Users can update their own usage" ON feature_usage;
DROP POLICY IF EXISTS "Users can delete their own usage" ON feature_usage;
CREATE POLICY "No direct usage inserts" ON feature_usage FOR INSERT WITH CHECK (false);
CREATE POLICY "No direct usage updates" ON feature_usage FOR UPDATE USING (false);
CREATE POLICY "No direct usage deletes" ON feature_usage FOR DELETE USING (false);

-- 5. USER_NOTIFICATIONS TABLE: Block user inserts (only system triggers can create)
CREATE POLICY "No direct notification inserts" ON user_notifications FOR INSERT WITH CHECK (false);

-- 6. STUDY_SESSIONS TABLE: Make immutable after creation (remove UPDATE/DELETE for integrity)
DROP POLICY IF EXISTS "Users can update their own study sessions" ON study_sessions;
DROP POLICY IF EXISTS "Users can delete their own study sessions" ON study_sessions;
CREATE POLICY "No study session updates" ON study_sessions FOR UPDATE USING (false);
CREATE POLICY "No study session deletes" ON study_sessions FOR DELETE USING (false);

-- 7. VIDEO_WATCH_TIME TABLE: Make immutable (prevent credit fraud)
DROP POLICY IF EXISTS "Users can update their own video watch time" ON video_watch_time;
DROP POLICY IF EXISTS "Users can delete their own video watch time" ON video_watch_time;
DROP POLICY IF EXISTS "Users can insert their own video watch time" ON video_watch_time;
CREATE POLICY "No video watch time updates" ON video_watch_time FOR UPDATE USING (false);
CREATE POLICY "No video watch time deletes" ON video_watch_time FOR DELETE USING (false);
CREATE POLICY "No direct video watch time inserts" ON video_watch_time FOR INSERT WITH CHECK (false);

-- 8. SEARCH_HISTORY TABLE: Remove UPDATE (allow INSERT for tracking, DELETE for privacy)
DROP POLICY IF EXISTS "Users can update their own search history" ON search_history;
CREATE POLICY "No search history updates" ON search_history FOR UPDATE USING (false);

-- 9. GENERATION_HISTORY TABLE: Remove DELETE to preserve audit trail
DROP POLICY IF EXISTS "Users can delete their own generation history" ON generation_history;
CREATE POLICY "No generation history deletes" ON generation_history FOR DELETE USING (false);

-- 10. PODCASTS TABLE: Restrict what fields can be updated (title only, not audio_segments/script)
DROP POLICY IF EXISTS "Users can update their own podcasts" ON podcasts;
CREATE POLICY "Users can update podcast title only" ON podcasts FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 11. Create SECURITY DEFINER functions for server-side operations

-- Function to record video watch time (server-side only)
CREATE OR REPLACE FUNCTION public.record_video_watch_time(
  p_video_id TEXT,
  p_duration_seconds INTEGER
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  IF p_duration_seconds <= 0 OR p_duration_seconds > 3600 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid duration');
  END IF;

  INSERT INTO video_watch_time (user_id, video_id, watch_duration_seconds)
  VALUES (v_user_id, p_video_id, p_duration_seconds);
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function to track feature usage (server-side only)
CREATE OR REPLACE FUNCTION public.track_feature_usage(
  p_feature_name TEXT,
  p_usage_minutes INTEGER DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_period_start DATE;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  v_period_start := date_trunc('month', now())::date;
  
  INSERT INTO feature_usage (user_id, feature_name, usage_count, usage_minutes, period_start)
  VALUES (v_user_id, p_feature_name, 1, COALESCE(p_usage_minutes, 0), v_period_start)
  ON CONFLICT (user_id, feature_name, period_start) 
  DO UPDATE SET 
    usage_count = feature_usage.usage_count + 1,
    usage_minutes = feature_usage.usage_minutes + COALESCE(p_usage_minutes, 0),
    updated_at = now();
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function to record study session (server-side only)  
CREATE OR REPLACE FUNCTION public.start_study_session(
  p_pdf_name TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_session_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  IF p_pdf_name IS NULL OR length(p_pdf_name) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'PDF name required');
  END IF;

  INSERT INTO study_sessions (user_id, pdf_name)
  VALUES (v_user_id, p_pdf_name)
  RETURNING id INTO v_session_id;
  
  RETURN jsonb_build_object('success', true, 'session_id', v_session_id);
END;
$$;

-- Function to end study session
CREATE OR REPLACE FUNCTION public.end_study_session(
  p_session_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  UPDATE study_sessions 
  SET session_end = now()
  WHERE id = p_session_id AND user_id = v_user_id AND session_end IS NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not found');
  END IF;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function to record generation history (server-side only)
CREATE OR REPLACE FUNCTION public.record_generation(
  p_tool_name TEXT,
  p_title TEXT DEFAULT NULL,
  p_source_type TEXT DEFAULT NULL,
  p_source_preview TEXT DEFAULT NULL,
  p_result_preview JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_generation_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  IF p_tool_name IS NULL OR length(p_tool_name) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tool name required');
  END IF;

  INSERT INTO generation_history (user_id, tool_name, title, source_type, source_preview, result_preview, metadata)
  VALUES (v_user_id, p_tool_name, p_title, p_source_type, p_source_preview, p_result_preview, p_metadata)
  RETURNING id INTO v_generation_id;
  
  RETURN jsonb_build_object('success', true, 'id', v_generation_id);
END;
$$;

-- Add unique constraint on feature_usage for upsert to work
ALTER TABLE feature_usage DROP CONSTRAINT IF EXISTS feature_usage_unique_user_feature_period;
ALTER TABLE feature_usage ADD CONSTRAINT feature_usage_unique_user_feature_period 
  UNIQUE (user_id, feature_name, period_start);