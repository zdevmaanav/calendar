-- Marketing OS Phase 1 Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  industry TEXT,
  website_url TEXT NOT NULL,
  instagram_handle TEXT,
  facebook_url TEXT,
  youtube_url TEXT,
  twitter_handle TEXT,
  linkedin_url TEXT,
  target_audience_description TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brand Profiles table
CREATE TABLE IF NOT EXISTS brand_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  brand_voice TEXT,
  tone_of_voice TEXT,
  primary_colors JSONB DEFAULT '[]'::jsonb,
  target_audience TEXT,
  audience_age_range TEXT,
  content_themes JSONB DEFAULT '[]'::jsonb,
  posting_style TEXT,
  key_products_services JSONB DEFAULT '[]'::jsonb,
  unique_selling_points JSONB DEFAULT '[]'::jsonb,
  content_pillars JSONB DEFAULT '[]'::jsonb,
  suggested_hashtags JSONB DEFAULT '[]'::jsonb,
  competitor_keywords JSONB DEFAULT '[]'::jsonb,
  brand_personality JSONB DEFAULT '[]'::jsonb,
  industry TEXT,
  summary TEXT,
  raw_scraped_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brand Assets Storage Bucket
-- Note: Run this in the Supabase Dashboard > Storage > New Bucket
-- Bucket name: brand-assets
-- Public: true

-- Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can CRUD their own data
CREATE POLICY "Users can view own organizations"
  ON organizations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own organizations"
  ON organizations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own organizations"
  ON organizations FOR DELETE
  USING (auth.uid() = user_id);

-- Brand Profiles: Users can view/update profiles for their own orgs
CREATE POLICY "Users can view own brand profiles"
  ON brand_profiles FOR SELECT
  USING (
    org_id IN (
      SELECT id FROM organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own brand profiles"
  ON brand_profiles FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT id FROM organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own brand profiles"
  ON brand_profiles FOR UPDATE
  USING (
    org_id IN (
      SELECT id FROM organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own brand profiles"
  ON brand_profiles FOR DELETE
  USING (
    org_id IN (
      SELECT id FROM organizations WHERE user_id = auth.uid()
    )
  );

-- Allow service role to bypass RLS (for the API route)
-- This is handled automatically with SUPABASE_SERVICE_ROLE_KEY

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_user_id ON organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_profiles_org_id ON brand_profiles(org_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
