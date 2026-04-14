# AprendeJS — SENATIC: Guía de Setup

## Prerrequisitos

- Node.js >= 20
- npm >= 10
- Cuenta en MongoDB Atlas (gratuita)
- Cuenta en Vercel (gratuita, para frontend)
- Cuenta en Railway (gratuita, para backend)

---

## 1. Instalar dependencias

```bash
# Desde la raíz del monorepo
npm install
```

---

## 2. Variables de entorno

### Backend (apps/api/.env)

```
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/senatic
JWT_ACCESS_SECRET=tu_secreto_acceso_muy_largo_y_aleatorio
JWT_REFRESH_SECRET=tu_secreto_refresh_diferente_al_anterior
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### Frontend (apps/web/.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

---

## 3. Seed inicial (poblar la base de datos)

```bash
cd apps/api
MONGODB_URI="tu_uri_aqui" npx tsx src/scripts/seed.ts
```

Esto crea:
- Curso "JavaScript Básico" con 2 módulos y 5 lecciones
- 7 logros base

---

## 4. Desarrollo local

```bash
# Desde la raíz (corre ambos apps en paralelo)
npm run dev
```

- Frontend: http://localhost:3000
- Backend:  http://localhost:4000

---

## 5. Estructura de contenido

Las lecciones son archivos JSON en `/content/`. Para agregar una nueva lección:

1. Crea el JSON en `/content/<curso>/<modulo>/lesson-XX.json`
2. Agrega la lección al seed script o directamente en la base de datos
3. El `contentId` en el modelo Lesson apunta al path relativo del JSON (sin `.json`)

Estructura del JSON de lección:

```json
{
  "id": "identificador-unico",
  "title": "Título de la lección",
  "xpReward": 15,
  "theory": {
    "markdown": "## Contenido en Markdown\n\n...",
    "examples": [
      { "code": "console.log('Hola');", "explanation": "Imprime Hola" }
    ]
  },
  "exercise": {
    "prompt": "Descripción del ejercicio...",
    "starterCode": "// Tu código aquí\n",
    "tests": [
      { "description": "El test pasa si...", "expression": "typeof variable !== 'undefined'" }
    ],
    "hints": ["Primera pista", "Segunda pista"]
  }
}
```

---

## 6. Deploy

### Backend (Railway)
1. Conectar repositorio en Railway
2. Seleccionar `apps/api` como directorio raíz
3. Build command: `npm run build`
4. Start command: `node dist/index.js`
5. Agregar variables de entorno

### Frontend (Vercel)
1. Importar repositorio en Vercel
2. Root directory: `apps/web`
3. Build command: `npm run build`
4. Agregar `NEXT_PUBLIC_API_URL=https://tu-api.railway.app/api`

---

## 7. Iconos PWA

Coloca en `apps/web/public/icons/`:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

Puedes generarlos desde el emoji 💻 con cualquier generador de iconos PWA.

---

## 8. Agregar nuevos lenguajes (futuro)

El sistema está diseñado para escalar:

1. Crea una nueva carpeta en `/content/python-basico/`
2. Agrega los JSONs con los mismos campos
3. Crea el curso en la BD via el seed
4. El frontend y la gamificación funcionan sin cambios
