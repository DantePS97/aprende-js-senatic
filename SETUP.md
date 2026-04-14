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

### Backend (`apps/api/.env`)

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/senatic
JWT_ACCESS_SECRET=tu_secreto_acceso_muy_largo_y_aleatorio_min_32_chars
JWT_REFRESH_SECRET=tu_secreto_refresh_diferente_al_anterior_min_32_chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### Frontend (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 3. Seed inicial (poblar la base de datos)

```bash
cd apps/api
npx tsx src/scripts/seed.ts
```

Crea:
- Curso "JavaScript Básico" con 2 módulos y 5 lecciones
- 7 logros base (achievements)

---

## 4. Desarrollo local

```bash
# Desde la raíz (corre ambos apps en paralelo)
npm run dev
```

- Frontend: http://localhost:3000
- Backend:  http://localhost:4000

---

## 5. Íconos PWA (automático)

Los íconos se generan automáticamente como parte del build:

```bash
cd apps/web
npm run generate-icons   # o se ejecuta solo con npm run build
```

Genera `public/icons/icon-192.png` y `public/icons/icon-512.png` (color primario Indigo).
Puedes reemplazarlos con íconos de marca una vez tengas el diseño final.

---

## 6. Estructura de contenido de lecciones

Los JSONs viven en `/content/`. Para agregar una nueva lección:

1. Crea el archivo en `/content/<curso>/<modulo>/lesson-XX.json`
2. Agrega la entrada al seed script o directamente en MongoDB
3. El campo `contentId` en el modelo Lesson apunta al path relativo sin `.json`

Estructura del JSON:

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
      { "description": "La variable existe", "expression": "typeof variable !== 'undefined'" }
    ],
    "hints": ["Primera pista", "Segunda pista"]
  }
}
```

---

## 7. Deploy a producción

### 7.1 MongoDB Atlas

1. Crear un cluster gratuito en [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Crear una base de datos llamada `senatic`
3. Agregar tu IP a la lista de acceso (o `0.0.0.0/0` para Railway)
4. Crear un usuario de base de datos y copiar el connection string
5. Ejecutar el seed contra la base de datos de producción:
   ```bash
   cd apps/api
   MONGODB_URI="tu_uri_de_produccion" npx tsx src/scripts/seed.ts
   ```

---

### 7.2 Backend — Railway (Docker)

Railway usa el `Dockerfile` en la raíz del repositorio.

**Pasos:**

1. Crear nuevo proyecto en [railway.app](https://railway.app)
2. **New Service → Deploy from GitHub repo** — selecciona `aprende-js-senatic`
3. En **Settings → Build**:
   - Dockerfile Path: `Dockerfile`
   - Build Command: *(vacío — usa el Dockerfile)*
4. En **Variables**, agregar:

   | Variable | Valor |
   |----------|-------|
   | `MONGODB_URI` | `mongodb+srv://...` |
   | `JWT_ACCESS_SECRET` | secreto largo aleatorio |
   | `JWT_REFRESH_SECRET` | otro secreto largo aleatorio |
   | `JWT_ACCESS_EXPIRES` | `15m` |
   | `JWT_REFRESH_EXPIRES` | `30d` |
   | `NODE_ENV` | `production` |
   | `CLIENT_URL` | `https://tu-app.vercel.app` |

5. Railway asigna automáticamente el `PORT` — el código ya lo lee con `process.env.PORT`.
6. Una vez desplegado, copia la URL pública (ej: `https://aprende-js-api.up.railway.app`)

---

### 7.3 Frontend — Vercel

1. Importar el repositorio en [vercel.com](https://vercel.com) → **Add New Project**
2. En la configuración del proyecto:
   - **Root Directory**: `apps/web`
   - **Framework Preset**: Next.js (se auto-detecta)
   - **Install Command**: `cd ../.. && npm install`
   - **Build Command**: `npm run build`
3. En **Environment Variables**, agregar:

   | Variable | Valor |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | `https://tu-api.up.railway.app/api` |
   | `NEXT_PUBLIC_SITE_URL` | `https://tu-app.vercel.app` |

4. Hacer clic en **Deploy**

> **Nota**: Vercel re-despliega automáticamente con cada `git push` a `main`.

---

### 7.4 CORS post-deploy

Una vez tengas la URL de Vercel, actualiza la variable `CLIENT_URL` en Railway
para que apunte exactamente a tu dominio de Vercel (sin trailing slash):

```
CLIENT_URL=https://aprende-js.vercel.app
```

Redespliega la API en Railway para que el cambio surta efecto.

---

## 8. Escalar a nuevos lenguajes (futuro)

El sistema está diseñado para escalar sin cambiar el frontend ni la gamificación:

1. Crea una carpeta en `/content/python-basico/` con JSONs del mismo esquema
2. Agrega el curso en la BD via el seed
3. El frontend y la gamificación funcionan sin modificaciones
