CREATE TABLE pages (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

INSERT INTO pages (slug, title, summary, published, updated_at) VALUES
  (
    'home',
    'Entrance',
    'Public entrance. The static page is the source of truth.',
    1,
    '2026-10-09T00:00:00.000Z'
  ),
  (
    'background',
    'Background',
    'Education and credentials. The static page is the source of truth.',
    1,
    '2026-10-09T00:00:00.000Z'
  ),
  (
    'learning',
    'Current learning',
    'Degree and study in progress. The static page is the source of truth.',
    1,
    '2026-10-09T00:00:00.000Z'
  );
