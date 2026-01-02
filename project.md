DOCUMENTACIÓN COMPLETA - APLICACIÓN DE FRASES MOTIVADORAS
VISIÓN GENERAL DEL SISTEMA
Aplicación social tipo Twitter para frases motivadoras diarias donde:

Cada usuario recibe una frase del día oficial

Los usuarios pueden publicar sus propias frases

Los usuarios pueden dar like a frases de otros

Sistema de registro/login con OTP (One-Time Password)

🎯 OBJETIVOS DEL SISTEMA
Objetivos Principales:
Inspiración diaria: Frase motivadora cada día

Comunidad: Usuarios comparten sus propias frases

Interacción: Sistema de likes y feed social

Simplicidad: Experiencia minimalista y fácil de usar

Público Objetivo:
Personas que buscan motivación diaria

Usuarios que quieren compartir pensamientos positivos

Comunidad sin toxicidad, solo contenido positivo

🏗️ ARQUITECTURA TÉCNICA
Stack Tecnológico:
Frontend: Android (Ionic)

Backend/DB: Supabase (PostgreSQL + Auth + Realtime)

Autenticación: Magic Link/OTP por email

Almacenamiento: Base de datos relacional PostgreSQL

Componentes Principales:
text
App Android ↔ Supabase (4 servicios integrados)
├── Authentication (OTP por email)
├── PostgreSQL (Base de datos)
├── Realtime (Actualizaciones en vivo)
└── Storage (Para avatares, opcional)
📊 ESQUEMA DE BASE DE DATOS

1. TABLA: profiles (Perfiles de usuario)
   Propósito: Almacena información pública de cada usuario
   Relación: 1:1 con auth.users (tabla automática de Supabase Auth)

Campo Tipo Descripción Ejemplo
id UUID ID único, referencia a auth.users.id uuid_v4()
username Texto Nombre público único "maria_23"
avatar_url Texto URL de la imagen de perfil "https://..."
created_at Timestamp Fecha de creación 2024-01-01 10:30:00
Políticas de Acceso:

✅ Público: Cualquiera puede ver perfiles

✏️ Usuario: Solo el dueño puede actualizar su perfil

➕ Usuario: Auto-creación al registrarse

2. TABLA: daily_quotes (Frases del día oficiales)
   Propósito: Frase motivadora única para cada día del año

Campo Tipo Descripción Restricciones
id UUID ID único Primary Key
quote Texto La frase motivadora NOT NULL
author Texto Autor de la frase Opcional
date Fecha Fecha específica UNIQUE, NOT NULL
category Texto Tipo de motivación Opcional
Características:

Solo UNA frase por día

Se muestra a TODOS los usuarios

Insertada manualmente por administradores

3. TABLA: user_quotes (Frases de usuarios)
   Propósito: Frases publicadas por los usuarios

Campo Tipo Descripción Restricciones
id UUID ID único Primary Key
user_id UUID ID del autor FK → profiles.id
quote Texto Frase del usuario NOT NULL
likes_count Entero Número de likes Default: 0
created_at Timestamp Fecha publicación Orden descendente
is_public Booleano Visible públicamente Default: TRUE
Políticas de Acceso:

👁️ Público: Todos ven frases con is_public = true

👤 Usuario: Ve sus propias frases (públicas o privadas)

➕ Usuario: Puede crear nuevas frases

✏️ Usuario: Solo edita/elimina sus propias frases

4. TABLA: likes (Sistema de likes)
   Propósito: Track de qué usuario dio like a qué frase

Campo Tipo Descripción Restricciones
id UUID ID único Primary Key
user_id UUID ID del usuario FK → profiles.id
quote_id UUID ID de la frase FK → user_quotes.id
created_at Timestamp Fecha del like
Restricción Única: UNIQUE(user_id, quote_id) → Un usuario no puede dar like dos veces a la misma frase

Políticas de Acceso:

👁️ Público: Todos pueden ver likes

👍 Usuario: Solo puede dar like a frases públicas

👎 Usuario: Solo puede quitar sus propios likes

🔄 FLUJO DE DATOS
Trigger Automático 1: update_likes_count_trigger
Cuando: INSERT o DELETE en tabla likes
Acción:

INSERT → Incrementa likes_count +1 en user_quotes

DELETE → Decrementa likes_count -1 en user_quotes

Trigger Automático 2: on_auth_user_created
Cuando: Nuevo usuario en auth.users (al registrarse)
Acción: Crea registro automático en profiles con:

Mismo id que auth.users.id

username extraído del email (antes del @)

avatar_url como NULL

created_at con fecha actual

👤 FLUJO DE USUARIO
FASE 1: REGISTRO/AUTENTICACIÓN
text

1. Usuario abre app por primera vez
2. Pantalla: "Ingresa tu email para comenzar"
3. Usuario escribe: "maria@gmail.com"
4. Presiona: "Enviar código"
   ↓
5. Sistema envía email con código OTP a maria@gmail.com
   ↓
6. Usuario abre email, copia código
7. Pantalla: "Ingresa el código de 6 dígitos"
8. Usuario escribe código y presiona "Verificar"
   ↓
9. Supabase Auth valida código
10. SI válido → Crea sesión + Trigger crea perfil
11. App navega a Pantalla Principal
    FASE 2: EXPERIENCIA DIARIA
    Pantalla Principal (Feed) - Estructura:
    text
    [HEADER]
    ┌─────────────────────────────────┐
    │ FRASE DEL DÍA │
    │ "Hoy es un nuevo comienzo" │
    │ — Anónimo • Motivación • │
    └─────────────────────────────────┘

[ACCIONES]
[+] CREAR FRASE (botón flotante)

[FEED SOCIAL]
┌─────────────────────────────────┐
│ "La perseverancia es clave" │
│ 👤 @juan23 ❤️ 15 likes │
│ ───────────────────────────── │
│ "Sonríe más, preocúpate menos" │
│ 👤 @ana_91 ❤️ 8 likes │
│ (Tu like) │
└─────────────────────────────────┘
Interacciones Disponibles:
Ver Frase del Día: Información inspiradora estática

Scroll Feed: Ver frases de otros usuarios (más recientes primero)

Dar/Quitar Like: Toque en ❤️

Compartir: Toque en ↪️ para compartir frase vía WhatsApp/Twitter/etc.

Crear Frase: Toque en botón [+] para publicar

FASE 3: PUBLICAR FRASE
text

1. Usuario presiona botón [+] "Crear Frase"
2. Pantalla modal/separada con:
   - TextArea grande
   - Contador de caracteres (ej: 280 máximo)
   - Botón "Publicar"
3. Usuario escribe frase y presiona "Publicar"
   ↓
4. App envía a Supabase:
   - `user_id`: ID del usuario actual
   - `quote`: Texto de la frase
   - `is_public`: TRUE (por defecto)
     ↓
5. Supabase inserta en `user_quotes`
6. Feed se actualiza automáticamente con nueva frase
   FASE 4: SISTEMA DE LIKES
   Dar Like:
   text
7. Usuario ve frase que le gusta
8. Presiona icono ❤️ (vacío)
   ↓
9. App envía a Supabase:
   - `user_id`: Usuario actual
   - `quote_id`: Frase seleccionada
     ↓
10. Supabase INSERT en tabla `likes`
    ↓
11. Trigger automático: `likes_count +1` en la frase
12. Icono cambia a ❤️ (relleno)
13. Contador incrementa visualmente
    Quitar Like:
    text
14. Usuario ve frase que ya dio like (❤️ relleno)
15. Presiona icono ❤️ (relleno)
    ↓
16. App envía DELETE a Supabase (WHERE user_id AND quote_id)
    ↓
17. Trigger automático: `likes_count -1` en la frase
18. Icono cambia a ❤️ (vacío)
19. Contador decrementa visualmente
    🔐 SEGURIDAD Y PRIVACIDAD
    Modelo de Permisos (Row Level Security):
    Para Usuarios No Autenticados:
    ❌ No puede usar la app

❌ No ve feed

✅ Solo puede iniciar proceso de registro

Para Usuarios Autenticados:
✅ Ve frases públicas de otros

✅ Da like a frases públicas

✅ Publica sus propias frases

✅ Edita/elimina solo sus frases

✅ Ve sus estadísticas básicas

Protección Contra Abuso:
Un like por usuario: UNIQUE(user_id, quote_id)

Validación de contenido: Los usuarios reportan contenido inapropiado (campo reported_count)

Moderación: Frases con muchos reportes pueden ocultarse automáticamente

🎨 EXPERIENCIA DE USUARIO
Diseño Emocional:
Colores: Tonalidades cálidas, inspiradoras

Tipografía: Legible, serif para frases

Animaciones: Transiciones suaves al dar like

Sonidos: Opcional sonido sutil al publicar/recibir like

Feedback al Usuario:
Publicación exitosa: Mensaje "Frase publicada ✓"

Like registrado: Animación de corazón

Conexión perdida: "Modo offline, se sincronizará después"

Límite de caracteres: Contador que cambia de color
