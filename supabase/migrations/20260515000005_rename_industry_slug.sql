-- Rename industry_sic_code → industry_slug.
-- The column stores onboarding slugs ('restaurant', 'construction', ...), not SIC codes,
-- and the misleading name was flagged in the round-1 VC review (Moritz).
ALTER TABLE businesses
  RENAME COLUMN industry_sic_code TO industry_slug;
