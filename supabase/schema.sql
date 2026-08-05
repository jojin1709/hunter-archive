-- Run this once in the Supabase SQL editor (free tier project)

create table if not exists writeups (
  id bigint generated always as identity primary key,
  url text not null unique,
  title text not null,
  summary text,
  source text not null,              -- 'medium' | 'github' | 'pentesterland' | 'custom'
  source_label text,                 -- e.g. 'infosecwriteups.com', 'github.com/owner/repo'
  tags text[] default '{}',
  published_at timestamptz,
  fetched_at timestamptz default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(coalesce(tags, '{}'), ' ')), 'C')
  ) stored
);

create index if not exists writeups_search_idx on writeups using gin (search_vector);
create index if not exists writeups_published_idx on writeups (published_at desc);
create index if not exists writeups_source_idx on writeups (source);

-- Row Level Security: public read-only, writes only via service role (scraper script)
alter table writeups enable row level security;

create policy "public can read writeups"
  on writeups for select
  using (true);
