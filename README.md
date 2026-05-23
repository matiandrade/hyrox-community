# HYROX Community App

La comunidad hispanohablante de atletas HYROX. Rankings, feed de actividad, planificador y historial de entrenamientos.

## Stack

- **Frontend**: React 18 + Vite
- **Backend/Auth/DB**: Supabase
- **Deploy**: Netlify
- **State**: Zustand
- **Routing**: React Router v6

---

## Setup en 5 pasos

### 1. Clonar e instalar
```bash
git clone <tu-repo>
cd hyrox-community
npm install
```

### 2. Crear proyecto en Supabase
1. Ir a [supabase.com](https://supabase.com) → New Project
2. Settings → API → copiar `Project URL` y `anon public key`

### 3. Variables de entorno
```bash
cp .env.example .env
# Editar .env con tus valores de Supabase
```

### 4. Ejecutar schema SQL
1. En Supabase → SQL Editor → New Query
2. Copiar y ejecutar el contenido de `supabase-schema.sql`

### 5. Activar Google OAuth (opcional)
1. En Supabase → Authentication → Providers → Google
2. Crear OAuth app en [Google Cloud Console](https://console.cloud.google.com)
3. Agregar redirect URI: `https://tu-proyecto.supabase.co/auth/v1/callback`

---

## Desarrollo local
```bash
npm run dev
# → http://localhost:5173
```

## Deploy en Netlify
```bash
# En Netlify Dashboard:
# 1. New site from Git → conectar repo
# 2. Build command: npm run build
# 3. Publish dir: dist
# 4. Environment variables: agregar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
```

---

## Estructura del proyecto

```
src/
├── components/
│   ├── ui/          # Button, Card, Input, Badge, Toast...
│   └── layout/      # AppLayout, Header, BottomNav
├── pages/
│   ├── AuthPage.jsx
│   ├── FeedPage.jsx
│   ├── RankingsPage.jsx
│   ├── TrainPage.jsx     (próximamente)
│   ├── HistoryPage.jsx   (próximamente)
│   └── ProfilePage.jsx   (próximamente)
├── store/
│   ├── authStore.js   # Zustand auth state
│   └── appStore.js    # Zustand app state
├── lib/
│   └── supabase.js    # Supabase client
└── styles/
    └── globals.css    # Design system CSS vars
```

---

## Roadmap MVP (4 semanas)

- [x] Setup base: React + Vite + Supabase + Zustand
- [x] Auth: email/password + Google OAuth
- [x] Feed de actividad pública con kudos
- [x] Rankings globales y por país
- [ ] Port del planificador (semana 2)
- [ ] Historial personal (semana 2)
- [ ] Perfil público + PBs por estación (semana 3)
- [ ] Challenges semanales (semana 3)
- [ ] PWA + share resultado (semana 4)
- [ ] Onboarding + landing pública (semana 4)
