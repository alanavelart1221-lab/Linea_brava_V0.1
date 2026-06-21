-- ============================================================================
-- Línea Brava — Imágenes en user_routes (foto principal + galería)
-- ============================================================================
-- Agrega image/gallery para que las tarjetas de la app (y la web) muestren
-- la ruta con su foto. Rellena las 8 rutas oficiales sembradas en 0006 con
-- las mismas imágenes de lib/data.ts. Idempotente.
-- ============================================================================

alter table public.user_routes
  add column if not exists image text,
  add column if not exists gallery jsonb not null default '[]'::jsonb;

update public.user_routes set
  image = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=70',
  gallery = '["https://images.unsplash.com/photo-1486611367184-17759508999c?auto=format&fit=crop&w=1200&q=70","https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=70","https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=70"]'::jsonb
  where name = 'Cañón del Diablo';

update public.user_routes set
  image = 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=70',
  gallery = '["https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=70","https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=70","https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=70"]'::jsonb
  where name = 'Sierra Gorda';

update public.user_routes set
  image = 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=70',
  gallery = '["https://images.unsplash.com/photo-1444927714506-8492d94b5ba0?auto=format&fit=crop&w=1200&q=70","https://images.unsplash.com/photo-1504457047772-27faf1c00561?auto=format&fit=crop&w=1200&q=70","https://images.unsplash.com/photo-1421789665209-c9b2a435e3dc?auto=format&fit=crop&w=1200&q=70"]'::jsonb
  where name = 'Laguna Salada';

update public.user_routes set
  image = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=70',
  gallery = '["https://images.unsplash.com/photo-1486611367184-17759508999c?auto=format&fit=crop&w=1200&q=70","https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=70","https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=70"]'::jsonb
  where name = 'Barrancas del Cobre';

update public.user_routes set
  image = 'https://images.unsplash.com/photo-1421789665209-c9b2a435e3dc?auto=format&fit=crop&w=1200&q=70',
  gallery = '["https://images.unsplash.com/photo-1444927714506-8492d94b5ba0?auto=format&fit=crop&w=1200&q=70","https://images.unsplash.com/photo-1504457047772-27faf1c00561?auto=format&fit=crop&w=1200&q=70","https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=70"]'::jsonb
  where name = 'Dunas de Samalayuca';

update public.user_routes set
  image = 'https://images.unsplash.com/photo-1504457047772-27faf1c00561?auto=format&fit=crop&w=1200&q=70',
  gallery = '["https://images.unsplash.com/photo-1444927714506-8492d94b5ba0?auto=format&fit=crop&w=1200&q=70","https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=70","https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=70"]'::jsonb
  where name = 'Real de Catorce';

update public.user_routes set
  image = 'https://images.unsplash.com/photo-1444927714506-8492d94b5ba0?auto=format&fit=crop&w=1200&q=70',
  gallery = '["https://images.unsplash.com/photo-1504457047772-27faf1c00561?auto=format&fit=crop&w=1200&q=70","https://images.unsplash.com/photo-1421789665209-c9b2a435e3dc?auto=format&fit=crop&w=1200&q=70","https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=70"]'::jsonb
  where name = 'Valle de los Cirios';

update public.user_routes set
  image = 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=70',
  gallery = '["https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=70","https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=70","https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=70"]'::jsonb
  where name = 'Nevado de Toluca';
