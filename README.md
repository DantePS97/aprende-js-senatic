# AprendeJS — SENATIC

Plataforma de aprendizaje de JavaScript con gamificación, ejercicios interactivos y panel de administración. Monorepo full-stack construido con Next.js, Express y MongoDB.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS 3, Zustand 5 |
| Backend | Node.js 20+, Express 4, Mongoose 8 |
| Base de datos | MongoDB Atlas |
| Auth | JWT — access 15 min / refresh 30 días |
| Editor de código | CodeMirror 6 |
| Offline | Dexie 4 (IndexedDB) + PWA (next-pwa) |
| Monorepo | Turborepo + npm workspaces |
| Testing | Vitest + React Testing Library |

---

## Estructura

```
SENATIC/
├── apps/
│   ├── web/              # Next.js — frontend
│   └── api/              # Express — backend REST
├── packages/
│   └── shared/           # Tipos Zod compartidos
└── content/              # Lecciones en JSON
    └── javascript-basico/
        ├── module-01-variables/
        └── module-02-condicionales/
```

### Rutas del frontend

**Plataforma** (autenticado)
- `/courses` — catálogo de cursos
- `/courses/[courseId]` — detalle y módulos
- `/lessons/[lessonId]` — lección con editor de código
- `/forum` — foro de la comunidad
- `/leaderboard` — ranking global por XP
- `/profile` — perfil y logros

**Administración** (rol `admin`)
- `/admin` — dashboard con estadísticas
- `/admin/courses` — gestión de cursos, módulos y lecciones
- `/admin/users` — gestión de usuarios y roles
- `/admin/analytics` — funnel, retención, métricas por lección
- `/admin/audit` — bitácora de acciones

---

## Requisitos

- Node.js >= 20
- npm >= 10
- Cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas) (tier gratuito)

---

## Instalación y desarrollo

```bash
# 1. Clonar e instalar
git clone <repo-url>
cd SENATIC
npm install

# 2. Crear variables de entorno (ver sección Variables de entorno)

# 3. Levantar frontend + backend en paralelo
npm run dev
# Frontend → http://localhost:3000
# Backend  → http://localhost:4000
```

### Variables de entorno

**`apps/api/.env`**
```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/senatic
JWT_ACCESS_SECRET=<mínimo 32 caracteres aleatorios>
JWT_REFRESH_SECRET=<mínimo 32 caracteres, diferente al anterior>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

**`apps/web/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Scripts

### Raíz del monorepo

```bash
npm run dev          # Levanta todos los apps
npm run build        # Compila todos los apps
npm run test         # Ejecuta tests en todos los workspaces
npm run lint         # ESLint
npm run type-check   # TypeScript
npm run clean        # Elimina artefactos de build
```

### Utilidades del backend

```bash
# Poblar la base de datos con cursos y lecciones de /content
cd apps/api
npx tsx src/scripts/seed.ts

# Dar rol de admin a un usuario por email
npx tsx src/scripts/make-admin.ts usuario@ejemplo.com
```

---

## Funcionalidades

### Aprendizaje
- Cursos estructurados en módulos y lecciones
- Teoría en Markdown + ejemplos de código
- Ejercicios interactivos con tests automáticos
- Editor CodeMirror con resaltado de sintaxis
- Sistema de pistas progresivas
- Acceso offline mediante IndexedDB

### Gamificación
- **XP**: puntos por lección completada
- **Logros**: insignias por hitos (primera lección, racha, etc.)
- **Ranking**: tabla de posiciones global por XP acumulado

### Comunidad
- Foro con posts y respuestas anidadas

### Panel de administración
- CRUD completo de cursos, módulos y lecciones
- Gestión de roles de usuario
- Analytics: funnel de conversión, retención por cohorte, métricas por lección
- Bitácora de auditoría de acciones admin

### Formato de lección (JSON)

```json
{
  "id": "les-01-variables",
  "title": "Variables: var, let y const",
  "xpReward": 15,
  "theory": {
    "markdown": "## Contenido en Markdown",
    "examples": [{ "code": "let x = 1;", "explanation": "..." }]
  },
  "exercise": {
    "prompt": "Declara una variable llamada nombre con tu nombre.",
    "starterCode": "// Escribe tu código aquí",
    "tests": [{ "description": "nombre está definido", "expression": "typeof nombre !== 'undefined'" }],
    "hints": ["Usa let o const"]
  }
}
```

---

## Docker

```bash
# Solo el backend
docker build -t senatic-api .
docker run -p 4000:4000 --env-file apps/api/.env senatic-api
```

---

## Despliegue

| Servicio | Plataforma | Config |
|---------|-----------|--------|
| Frontend | Vercel | Root dir: `apps/web` |
| Backend | Railway | Dockerfile en raíz |
| Base de datos | MongoDB Atlas | URI en variable de entorno |

Para instrucciones detalladas de despliegue, ver [SETUP.md](./SETUP.md).

---

## Testing

```bash
npm run test               # Todos los workspaces
cd apps/web && npm run test:coverage   # Coverage del frontend
cd apps/api && npm run test            # Tests del backend
```

Los tests del backend cubren servicios de gamificación, utilidades de caché y cálculo de semanas. Los del frontend cubren componentes de UI con React Testing Library.
