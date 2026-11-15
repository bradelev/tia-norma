-- Revierte 0001_photos-bucket con `pnpm db:down`. El bucket queda: las fotos no se borran.
DELETE FROM drizzle.__drizzle_migrations WHERE created_at = 1794719481105;
