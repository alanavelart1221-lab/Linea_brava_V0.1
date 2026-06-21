-- ============================================================================
-- Línea Brava — Seed: rutas oficiales (placeholder) → user_routes
-- ============================================================================
-- Migra las 8 rutas curadas de lib/data.ts a la tabla user_routes para que
-- tanto la web como la app móvil (que solo lee Supabase) las muestren.
-- Quedan como status='approved' y calificada=true (distintivo oficial).
--
-- Idempotente: no duplica si ya existen por nombre. El dueño es el superadmin.
-- El trigger trg_protect_route_calificada exige is_admin() para marcar
-- calificada; como este script corre sin contexto de auth, se desactiva el
-- trigger solo durante el insert y se reactiva al final.
-- ============================================================================

do $$
declare
  owner_id uuid;
begin
  select id into owner_id from public.profiles
    where rol in ('admin','superadmin') order by created_at limit 1;
  if owner_id is null then
    raise exception 'No hay un perfil admin/superadmin para asignar como dueño';
  end if;

  alter table public.user_routes disable trigger trg_protect_route_calificada;

  insert into public.user_routes
    (user_id, name, description, state, region, level, distance_km, elevation_m, track, start_coords, waypoints, status, calificada, approved_at)
  select owner_id, v.name, v.description, v.state, v.region, v.level, v.distance_km, v.elevation_m,
         v.track::jsonb, v.start_coords::jsonb, '[]'::jsonb, 'approved', true, now()
  from (values
    ('Cañón del Diablo',
     E'El Cañón del Diablo se abre paso por la falda del Picacho del Diablo, el punto más alto de Baja California. Es una ruta de roca densa, con escalones que exigen líneas precisas y un spotter atento.\n\nEl cruce del arroyo a media ruta es el momento decisivo: dependiendo de la temporada, el agua puede llegar a los rines. Recompensa con vistas al granito de la sierra que pocos llegan a ver desde el volante.',
     'Baja California','Sierra San Pedro Mártir','Negro',38,2100,
     '[[30.94,-115.46],[30.95,-115.44],[30.97,-115.42],[30.99,-115.41],[31.01,-115.39]]','{"lat":30.94,"lng":-115.46}'),
    ('Sierra Gorda',
     E'La reserva de la biósfera Sierra Gorda regala una de las terracerías más escénicas del centro de México. Curvas amplias y firmes que serpentean entre bosque de niebla y miradores naturales.\n\nEs la ruta perfecta para estrenar tu 4x4: terreno exigente pero predecible, con paradas en pueblos serranos y misiones franciscanas patrimonio de la humanidad.',
     'Querétaro','Jalpan de Serra','Azul',64,1400,
     '[[21.18,-99.52],[21.2,-99.5],[21.22,-99.47],[21.25,-99.45],[21.28,-99.43]]','{"lat":21.18,"lng":-99.52}'),
    ('Laguna Salada',
     E'La Laguna Salada es un enorme lecho lacustre seco al sur de Mexicali: kilómetros de planicie perfecta para rodar a velocidad de crucero y aprender a leer el terreno blando.\n\nAl caer la noche montamos campamento en medio de la nada. Sin contaminación lumínica, la Vía Láctea se refleja en la sal. Es la introducción ideal al overland en familia.',
     'Baja California','Mexicali','Verde',112,60,
     '[[32.24,-115.7],[32.27,-115.66],[32.3,-115.62],[32.34,-115.58],[32.37,-115.54]]','{"lat":32.24,"lng":-115.7}'),
    ('Barrancas del Cobre',
     E'Más profundas que el Gran Cañón, las Barrancas del Cobre son el examen final del calendario. Descensos de roca suelta, pendientes pronunciadas y vados que cambian con la lluvia.\n\nSe corre solo en convoy y con dos días por delante: pernoctamos en la sierra Tarahumara antes del ascenso de regreso. No es una ruta para improvisar — es para la que te has estado preparando.',
     'Chihuahua','Creel','Pro',47,2400,
     '[[27.7,-107.7],[27.73,-107.66],[27.75,-107.63],[27.79,-107.6],[27.82,-107.56]]','{"lat":27.7,"lng":-107.7}'),
    ('Dunas de Samalayuca',
     E'Los Médanos de Samalayuca son dunas de arena fina y blanca que parecen sacadas de otro planeta. El reto es puramente de técnica de arena: presión correcta, impulso constante y lectura de la duna.\n\nIdeal como segundo paso después de una ruta Verde. Practicamos desinflado, recuperación en arena y manejo de médano antes de soltarte en las dunas grandes.',
     'Chihuahua','Ciudad Juárez','Azul',28,120,
     '[[31.31,-106.54],[31.32,-106.52],[31.34,-106.5],[31.36,-106.48],[31.38,-106.46]]','{"lat":31.31,"lng":-106.54}'),
    ('Real de Catorce',
     E'La subida a Real de Catorce mezcla planicie desértica con terracería de montaña hasta este pueblo minero semifantasma encaramado en la sierra del altiplano potosino.\n\nUna ruta tan cultural como técnica: socavones, capillas y el famoso túnel Ogarrio. El desierto wirikuta alrededor convierte cada parada en una postal.',
     'San Luis Potosí','Sierra de Catorce','Azul',54,1600,
     '[[23.64,-100.95],[23.66,-100.92],[23.69,-100.89],[23.71,-100.86],[23.73,-100.83]]','{"lat":23.64,"lng":-100.95}'),
    ('Valle de los Cirios',
     E'El corredor de Cataviña, dentro del área protegida Valle de los Cirios, es puro desierto surrealista: cirios de diez metros, cardones y enormes boulders de granito rosa.\n\nBrechas suaves y firmes que cualquier 4x4 capaz disfruta, con campamento entre las rocas y pinturas rupestres a corta caminata. Overland relajado y de paisaje brutal.',
     'Baja California','Cataviña','Verde',96,540,
     '[[29.68,-114.78],[29.7,-114.75],[29.73,-114.72],[29.76,-114.69],[29.79,-114.66]]','{"lat":29.68,"lng":-114.78}'),
    ('Nevado de Toluca',
     E'Pocas rutas en México llegan tan alto en vehículo. El camino al cráter del Nevado de Toluca trepa por roca volcánica suelta hasta más de 4,000 metros, junto a las lagunas del Sol y la Luna.\n\nEl reto es la altitud y la temperatura: motores que pierden potencia, posible hielo en la sombra y clima que cambia en minutos. Una experiencia de alta montaña a una hora del Valle de Toluca.',
     'Estado de México','Volcán Xinantécatl','Negro',22,2900,
     '[[19.07,-99.8],[19.08,-99.78],[19.1,-99.76],[19.11,-99.74],[19.12,-99.72]]','{"lat":19.07,"lng":-99.8}')
  ) as v(name, description, state, region, level, distance_km, elevation_m, track, start_coords)
  where not exists (
    select 1 from public.user_routes ur where ur.name = v.name
  );

  alter table public.user_routes enable trigger trg_protect_route_calificada;
end $$;
