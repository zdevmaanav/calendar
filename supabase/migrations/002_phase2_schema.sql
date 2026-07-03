-- Marketing OS Phase 2 Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- Content Calendar table
-- ============================================
CREATE TABLE IF NOT EXISTS content_calendar (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'youtube', 'all')),
  content_type TEXT NOT NULL CHECK (content_type IN ('educational', 'promotional', 'motivational', 'behind-the-scenes', 'festive', 'trending', 'product')),
  topic TEXT NOT NULL,
  caption_direction TEXT,
  visual_direction TEXT,
  occasion TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  generated_caption TEXT,
  generated_hashtags JSONB DEFAULT '[]'::jsonb,
  generated_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'caption_generated', 'image_generated', 'pending_approval', 'approved', 'posted', 'rejected', 'post_failed')),
  approved_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  post_platform_id TEXT,
  is_edited_by_user BOOLEAN DEFAULT FALSE,
  rejection_reason TEXT,
  use_assets BOOLEAN DEFAULT FALSE,
  scheduled_post_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Assets table (Brand Assets + Post-Ready Assets)
-- ============================================
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('brand', 'post_ready')),
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
  filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  is_active_for_generation BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Post Analytics table
-- ============================================
CREATE TABLE IF NOT EXISTS post_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  calendar_item_id UUID REFERENCES content_calendar(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  post_platform_id TEXT,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  engagement_rate FLOAT DEFAULT 0,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI Suggestions table
-- ============================================
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  content_type TEXT NOT NULL,
  platform TEXT NOT NULL,
  reason TEXT,
  suggested_date DATE,
  hook_idea TEXT,
  visual_idea TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'added_to_calendar', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Org Settings table
-- ============================================
CREATE TABLE IF NOT EXISTS org_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  use_assets_by_default BOOLEAN DEFAULT FALSE,
  default_aspect_ratio TEXT DEFAULT '1:1' CHECK (default_aspect_ratio IN ('1:1', '9:16', '16:9', '4:5')),
  posting_times JSONB DEFAULT '{}'::jsonb,
  notification_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_settings ENABLE ROW LEVEL SECURITY;

-- Content Calendar RLS
CREATE POLICY "Users can view own calendar items"
  ON content_calendar FOR SELECT
  USING (org_id IN (SELECT id FROM organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own calendar items"
  ON content_calendar FOR INSERT
  WITH CHECK (org_id IN (SELECT id FROM organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own calendar items"
  ON content_calendar FOR UPDATE
  USING (org_id IN (SELECT id FROM organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own calendar items"
  ON content_calendar FOR DELETE
  USING (org_id IN (SELECT id FROM organizations WHERE user_id = auth.uid()));

-- Assets RLS
CREATE POLICY "Users can view own assets"
  ON assets FOR SELECT
  USING (org_id IN (SELECT id FROM organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own assets"
  ON assets FOR INSERT
  WITH CHECK (org_id IN (SELECT id FROM organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own assets"
  ON assets FOR UPDATE
  USING (org_id IN (SELECT id FROM organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own assets"
  ON assets FOR DELETE
  USING (org_id IN (SELECT id FROM organizations WHERE user_id = auth.uid()));

-- Post Analytics RLS
CREATE POLICY "Users can view own analytics"
  ON post_analytics FOR SELECT
  USING (org_id IN (SELECT id FROM organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own analytics"
  ON post_analytics FOR INSERT
  WITH CHECK (org_id IN (SELECT id FROM organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own analytics"
  ON post_analytics FOR UPDATE
  USING (org_id IN (SELECT id FROM organizations WHERE user_id = auth.uid()));

-- AI Suggestions RLS
CREATE POLICY "Users can view own suggestions"
  ON ai_suggestions FOR SELECT
  USING (org_id IN (SELECT id FROM organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own suggestions"
  ON ai_suggestions FOR INSERT
  WITH CHECK (org_id IN (SELECT id FROM organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own suggestions"
  ON ai_suggestions FOR UPDATE
  USING (org_id IN (SELECT id FROM organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own suggestions"
  ON ai_suggestions FOR DELETE
  USING (org_id IN (SELECT id FROM organizations WHERE user_id = auth.uid()));

-- Org Settings RLS
CREATE POLICY "Users can view own settings"
  ON org_settings FOR SELECT
  USING (org_id IN (SELECT id FROM organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own settings"
  ON org_settings FOR INSERT
  WITH CHECK (org_id IN (SELECT id FROM organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own settings"
  ON org_settings FOR UPDATE
  USING (org_id IN (SELECT id FROM organizations WHERE user_id = auth.uid()));

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_content_calendar_org_id ON content_calendar(org_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_date ON content_calendar(date);
CREATE INDEX IF NOT EXISTS idx_content_calendar_status ON content_calendar(status);
CREATE INDEX IF NOT EXISTS idx_content_calendar_org_date ON content_calendar(org_id, date);
CREATE INDEX IF NOT EXISTS idx_assets_org_id ON assets(org_id);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(org_id, category);
CREATE INDEX IF NOT EXISTS idx_post_analytics_org_id ON post_analytics(org_id);
CREATE INDEX IF NOT EXISTS idx_post_analytics_calendar ON post_analytics(calendar_item_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_org_id ON ai_suggestions(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_status ON ai_suggestions(org_id, status);
CREATE INDEX IF NOT EXISTS idx_org_settings_org_id ON org_settings(org_id);
