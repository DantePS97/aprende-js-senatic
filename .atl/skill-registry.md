# Skill Registry — SENATIC

Generated: 2026-04-15

## User Skills

| Skill | Triggers |
|-------|----------|
| next-best-practices | Next.js, App Router, RSC, pages, layouts, route handlers |
| tailwind-design-system | Tailwind, design tokens, component library, CSS |
| vercel-react-best-practices | React components, performance, optimization |
| branch-pr | Creating pull requests, PR preparation |
| git-commit | Committing changes, conventional commits |
| sdd-explore | Investigate features, read codebase |
| sdd-propose | Architecture proposals, change proposals |
| sdd-spec | Write specifications, scenarios |
| sdd-design | Technical design, sequence diagrams |
| sdd-tasks | Task breakdown, implementation plan |
| sdd-apply | Implement features, write code |
| sdd-verify | Validate implementation against specs |
| sdd-archive | Archive completed changes |

## Project Conventions

No project-level CLAUDE.md found. Using global conventions from ~/.claude/CLAUDE.md.

## Compact Rules

### next-best-practices
- Use App Router conventions: layout.tsx, page.tsx, error.tsx, loading.tsx
- Server Components by default; add "use client" only when needed (interactivity, hooks, browser APIs)
- Colocate data fetching in Server Components; never fetch in client components when avoidable
- Use Next.js Image, Font, and Link for optimization
- Route handlers in app/api/**/route.ts

### tailwind-design-system
- Use Tailwind utility classes; avoid custom CSS unless necessary
- Use clsx + tailwind-merge (already installed) for conditional classes
- Follow existing color/spacing scale — do not introduce arbitrary values
- Use class-variance-authority (cva) for component variants

### vercel-react-best-practices
- Minimize client bundle: avoid large client-side dependencies
- Memoize expensive computations; use React.memo for pure components
- Prefer Zustand for client state (already in use)
- Avoid prop drilling; use context or Zustand stores

### TypeScript (project-wide)
- Strict TypeScript — no `any`, no type assertions without comment
- Shared types live in packages/shared/src/types/
- Zod schemas for runtime validation live in packages/shared/src/schemas/
- Always run `npm run type-check` before committing

### API (Express)
- All routes require Zod validation middleware for POST/PUT
- Auth-protected routes use auth.middleware.ts
- Services handle business logic — routes are thin
- Error responses: { message: string } shape
