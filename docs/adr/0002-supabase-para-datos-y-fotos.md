# Supabase para datos y fotos

La página y el bot necesitan una base Postgres y un lugar para las fotos originales y tratadas. Usamos Supabase para las dos cosas: una sola cuenta, un solo juego de claves, y el plan gratuito incluye almacenamiento. Drizzle habla con la base, así que el código no depende del cliente de Supabase salvo en el adaptador de `MediaStore`.

## Considered Options

- **Neon y Vercel Blob.** Dos servicios para lo mismo que cubre uno.
