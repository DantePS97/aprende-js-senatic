/**
 * Converts a plain text string into a URL-safe kebab-case slug.
 *
 * Examples:
 *   slugify("Hello World!")   → "hello-world"
 *   slugify("  Mi Curso JS ") → "mi-curso-js"
 *   slugify("C++ avanzado")   → "c-avanzado"
 */
export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, ''); // strip leading/trailing dashes
