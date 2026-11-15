-- Bucket público de Supabase Storage para las fotos de las piezas.
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES ('photos', 'photos', true, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
