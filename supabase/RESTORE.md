# Restaurar Supabase para Positive 2026

## Estado detectado

La app usa Supabase directamente desde Angular con `@supabase/supabase-js`.
Las credenciales actuales estan en:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

El proyecto viejo apunta a:

- URL: `https://qevzmpoizgdmpvpimfue.supabase.co`
- Project ref: `qevzmpoizgdmpvpimfue`

El archivo local de Codex tiene configurado un MCP de Supabase en
`C:\Users\acmnh\.codex\config.toml`, pero en esta sesion Codex no recibio
herramientas MCP de Supabase. Solo se ven recursos MCP vacios, por lo que no
se puede ejecutar SQL por MCP desde esta sesion todavia.

## Migraciones necesarias

Ejecutar en este orden sobre un proyecto Supabase nuevo:

1. `supabase/migrations/20260428151936_initial_schema.sql`
2. `supabase/migrations/20260428151947_add_user_trigger.sql`
3. `supabase/migrations/20260428152024_seed_daily_quotes.sql`
4. `supabase/migrations/20260428152030_create_config_table.sql`
5. `supabase/migrations/20260428152042_optimize_feed.sql`
6. `supabase/migrations/20260428152103_harden_trigger_functions.sql`
7. `supabase/migrations/20260428152140_optimize_rls_and_foreign_keys.sql`

Esto crea:

- `profiles`
- `daily_quotes`
- `user_quotes`
- `likes`
- `reports`
- `config`
- trigger `on_like_change`
- trigger `on_auth_user_created`
- RPC `get_smart_feed`
- hardened function `search_path` and trigger function execution grants
- foreign-key indexes and optimized RLS auth checks

## Funcionalidades que dependen de esto

- Login por email OTP: Supabase Auth.
- Perfil de usuario: tabla `profiles` y trigger `on_auth_user_created`.
- Frase diaria: tabla `daily_quotes`.
- Feed social: RPC `get_smart_feed`.
- Crear frases: tabla `user_quotes`.
- Likes: tabla `likes` y trigger `handle_likes`.
- Reportes: tabla `reports`.
- Version minima/latest app: tabla `config`, key `latest_version`.

## Cosas que normalmente quedan manuales

Si no hay MCP de Supabase conectado, estas partes se hacen desde Dashboard o CLI:

- Crear el proyecto nuevo en Supabase.
- Activar/configurar Auth por email OTP.
- Revisar URLs permitidas/redirecciones de Auth si se usan magic links. Esta app
  verifica OTP con codigo (`verifyOtp`) y no parece depender de callback URL.
- Copiar `Project URL` y `anon public key` nuevas a los environments.
- Aplicar migraciones en la base de datos.
- Revisar SMTP si el OTP de Supabase no llega o si se quiere usar dominio propio.

## Pasos recomendados ahora

1. En Supabase, crear o seleccionar el proyecto nuevo.
2. Copiar el project ref nuevo.
3. Actualizar el MCP local para que apunte al project ref nuevo:

   ```toml
   [mcp_servers.supabase]
   enabled = true
   url = "https://mcp.supabase.com/mcp?project_ref=PROJECT_REF_NUEVO"
   ```

4. Reiniciar Codex para que cargue las herramientas MCP.
5. Si el MCP aparece, ejecutar las migrations por MCP en el orden de abajo.
6. Si el MCP no aparece, ejecutar las migrations desde Supabase Dashboard:
   `SQL Editor` -> pegar cada archivo en orden -> `Run`.
7. Copiar `Project URL` y `anon public key` nuevas en:
   - `src/environments/environment.ts`
   - `src/environments/environment.prod.ts`
8. Ejecutar la verificacion de `supabase/verify_restore.sql`.

## Objetivo con MCP

Con un MCP de Supabase conectado, se deberia poder hacer desde Codex:

- listar proyectos;
- seleccionar el proyecto nuevo;
- ejecutar las migraciones SQL;
- consultar tablas/RLS/RPC para verificar;
- leer URL y anon key si el MCP expone esa metadata.

Actualmente Codex no ve ningun recurso MCP registrado en esta sesion.

## Verificacion esperada

Despues de restaurar, `supabase/verify_restore.sql` deberia confirmar:

- existen tablas `profiles`, `daily_quotes`, `user_quotes`, `likes`, `reports`,
  `config`;
- existen triggers `on_like_change` y `on_auth_user_created`;
- existe la funcion/RPC `get_smart_feed`;
- existe `config.latest_version`;
- hay frases sembradas en `daily_quotes`.
