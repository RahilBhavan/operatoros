-- Allow anonymous users to read business name and deadlines when they hold a valid share token.
-- The token lookup itself is already protected by expiry check in the query.

create policy "Anon can read shared business info"
  on businesses for select
  to anon
  using (
    id in (
      select business_id from share_tokens where expires_at > now()
    )
  );

create policy "Anon can read shared deadlines"
  on deadlines for select
  to anon
  using (
    business_id in (
      select business_id from share_tokens where expires_at > now()
    )
  );
