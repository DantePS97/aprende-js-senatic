import { redirect } from 'next/navigation';

// El root / siempre redirige a /courses.
// El guard de autenticación en (platform)/layout.tsx
// se encarga de redirigir a /login si no hay sesión.
export default function RootPage() {
  redirect('/courses');
}
