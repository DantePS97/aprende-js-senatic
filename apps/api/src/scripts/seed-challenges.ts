import mongoose from 'mongoose';
import { ChallengeModel } from '../models/Challenge.model';

const challenges = [
  {
    slug: 'propina-restaurante',
    title: 'Propina de restaurante',
    description: 'Recibes el total de la cuenta y debes devolver cuánto dejar de propina al 10 %. El resultado debe ser un número (no string).',
    difficulty: 'facil' as const,
    xpReward: 30,
    starterCode: 'function solution(total) {\n  // Devuelve el 10% del total\n}',
    testCases: [
      { input: '50000', expectedOutput: '5000', hidden: false, description: 'Cuenta redonda' },
      { input: '12345', expectedOutput: '1234.5', hidden: false, description: 'Cuenta con decimales' },
      { input: '0', expectedOutput: '0', hidden: true },
    ],
    order: 1,
    published: true,
    tags: ['math'],
  },
  {
    slug: 'nombre-mayusculas',
    title: 'Nombre en mayúsculas',
    description: 'Convierte un nombre a mayúsculas y quita los espacios sobrantes al inicio y final. Útil para normalizar datos antes de guardarlos en una base de datos.',
    difficulty: 'facil' as const,
    xpReward: 30,
    starterCode: 'function solution(nombre) {\n  // Retorna el nombre en mayúsculas y sin espacios sobrantes\n}',
    testCases: [
      { input: '"  oscar  "', expectedOutput: 'OSCAR', hidden: false, description: 'Espacios al inicio y final' },
      { input: '"maría camila"', expectedOutput: 'MARÍA CAMILA', hidden: false, description: 'Conserva acentos' },
      { input: '""', expectedOutput: '', hidden: true },
    ],
    order: 2,
    published: true,
    tags: ['strings'],
  },
  {
    slug: 'contar-vocales',
    title: 'Contar vocales en una frase',
    description: 'Cuenta cuántas vocales (a, e, i, o, u — con o sin tilde) aparecen en una frase, sin importar mayúsculas/minúsculas. Imagina un filtro que valida nombres de usuario.',
    difficulty: 'medio' as const,
    xpReward: 60,
    starterCode: 'function solution(frase) {\n  // Retorna la cantidad de vocales (incluye acentuadas)\n}',
    testCases: [
      { input: '"Hola Mundo"', expectedOutput: '4', hidden: false, description: 'Sin acentos' },
      { input: '"Árbol de Navidad"', expectedOutput: '6', hidden: false, description: 'Con tilde' },
      { input: '"BCDFG"', expectedOutput: '0', hidden: true },
    ],
    order: 3,
    published: true,
    tags: ['strings', 'logica'],
  },
  {
    slug: 'precio-con-iva',
    title: 'Precio con IVA',
    description: 'Una tienda en línea muestra precios sin IVA. Calcula el precio final aplicando el 19 % de IVA y redondea a dos decimales (como número).',
    difficulty: 'medio' as const,
    xpReward: 70,
    starterCode: 'function solution(precio) {\n  // Aplica IVA del 19% y redondea a 2 decimales\n}',
    testCases: [
      { input: '100', expectedOutput: '119', hidden: false, description: 'Precio entero' },
      { input: '49.99', expectedOutput: '59.49', hidden: false, description: 'Precio con centavos' },
      { input: '0', expectedOutput: '0', hidden: true },
    ],
    order: 4,
    published: true,
    tags: ['math'],
  },
  {
    slug: 'palabra-mas-larga',
    title: 'La palabra más larga',
    description: 'Dada una frase separada por espacios, devuelve la palabra más larga. Si hay empate, devuelve la primera. Útil al analizar texto de formularios de usuario.',
    difficulty: 'dificil' as const,
    xpReward: 120,
    starterCode: 'function solution(frase) {\n  // Devuelve la palabra más larga (primera en caso de empate)\n}',
    testCases: [
      { input: '"hola que tal estas hoy"', expectedOutput: 'estas', hidden: false, description: 'Frase corta' },
      { input: '"el desarrollo profesional importa"', expectedOutput: 'desarrollo', hidden: false, description: 'Empate parcial — primera gana' },
      { input: '"a bb ccc dddd eeeee"', expectedOutput: 'eeeee', hidden: true },
    ],
    order: 5,
    published: true,
    tags: ['arrays', 'strings', 'logica'],
  },
  {
    slug: 'invertir-palabras',
    title: 'Invertir el orden de las palabras',
    description: 'Dado un texto, devuelve las mismas palabras pero en orden inverso. Las palabras siempre estarán separadas por un único espacio. Útil en procesamiento de texto y búsquedas invertidas.',
    difficulty: 'facil' as const,
    xpReward: 35,
    starterCode: 'function solution(frase) {\n  // Devuelve las palabras en orden invertido\n  // "hola mundo" → "mundo hola"\n}',
    testCases: [
      { input: '"hola mundo cruel"', expectedOutput: 'cruel mundo hola', hidden: false, description: 'Tres palabras' },
      { input: '"JavaScript es genial"', expectedOutput: 'genial es JavaScript', hidden: false, description: 'Conserva mayúsculas' },
      { input: '"una"', expectedOutput: 'una', hidden: true },
    ],
    order: 6,
    published: true,
    tags: ['strings'],
  },
  {
    slug: 'sumar-digitos',
    title: 'Suma de dígitos',
    description: 'Dado un número entero positivo, devuelve la suma de todos sus dígitos. Por ejemplo, 1234 → 1+2+3+4 = 10. Este patrón aparece en algoritmos de validación como el dígito verificador de cédulas.',
    difficulty: 'facil' as const,
    xpReward: 40,
    starterCode: 'function solution(n) {\n  // Retorna la suma de los dígitos de n\n  // 1234 → 10\n}',
    testCases: [
      { input: '1234', expectedOutput: '10', hidden: false, description: 'Cuatro dígitos' },
      { input: '9999', expectedOutput: '36', hidden: false, description: 'Todos iguales' },
      { input: '100', expectedOutput: '1', hidden: true },
    ],
    order: 7,
    published: true,
    tags: ['math', 'strings'],
  },
  {
    slug: 'palindromo',
    title: 'Detector de palíndromos',
    description: 'Un palíndromo se lee igual de izquierda a derecha que de derecha a izquierda. Ignora espacios y mayúsculas. Devuelve true o false. Ejemplo: "Anita lava la tina" es palíndromo.',
    difficulty: 'medio' as const,
    xpReward: 65,
    starterCode: 'function solution(texto) {\n  // Retorna true si el texto es palíndromo (ignora espacios y mayúsculas)\n}',
    testCases: [
      { input: '"Anita lava la tina"', expectedOutput: 'true', hidden: false, description: 'Palíndromo clásico' },
      { input: '"Hola Mundo"', expectedOutput: 'false', hidden: false, description: 'No es palíndromo' },
      { input: '"racecar"', expectedOutput: 'true', hidden: true },
    ],
    order: 8,
    published: true,
    tags: ['strings', 'logica'],
  },
  {
    slug: 'mayores-de-edad',
    title: 'Filtrar mayores de edad',
    description: 'Dado un array de personas con nombre y edad, devuelve un array con los nombres de quienes tienen 18 años o más, en el mismo orden en que aparecen. Patrón frecuente al filtrar usuarios con acceso restringido.',
    difficulty: 'medio' as const,
    xpReward: 75,
    starterCode: 'function solution(personas) {\n  // personas: array de { nombre: string, edad: number }\n  // Retorna un array con los nombres de los mayores de edad (>= 18)\n}',
    testCases: [
      { input: '[{nombre:"Ana",edad:15},{nombre:"Luis",edad:20},{nombre:"Marta",edad:18}]', expectedOutput: 'Luis,Marta', hidden: false, description: 'Una menor, dos mayores' },
      { input: '[{nombre:"Valeria",edad:22},{nombre:"Carlos",edad:16},{nombre:"Diana",edad:18}]', expectedOutput: 'Valeria,Diana', hidden: false, description: 'Orden original preservado' },
      { input: '[{nombre:"Beto",edad:17},{nombre:"Zoe",edad:25}]', expectedOutput: 'Zoe', hidden: true },
    ],
    order: 9,
    published: true,
    tags: ['arrays', 'objetos'],
  },
  {
    slug: 'validar-parentesis',
    title: 'Paréntesis balanceados',
    description: 'Dado un string con paréntesis, determina si están correctamente balanceados: cada apertura tiene su cierre en el orden correcto. Devuelve true o false. Algoritmo clásico de entrevistas técnicas basado en el concepto de pila (stack).',
    difficulty: 'dificil' as const,
    xpReward: 130,
    starterCode: 'function solution(str) {\n  // Retorna true si los paréntesis están balanceados\n  // "(())" → true\n  // "(()" → false\n  // ")(" → false\n}',
    testCases: [
      { input: '"(())"', expectedOutput: 'true', hidden: false, description: 'Balanceados anidados' },
      { input: '"(()"', expectedOutput: 'false', hidden: false, description: 'Falta cierre' },
      { input: '")("', expectedOutput: 'false', hidden: true },
    ],
    order: 10,
    published: true,
    tags: ['strings', 'logica'],
  },
];

export async function seedChallenges(): Promise<void> {
  for (const challenge of challenges) {
    await ChallengeModel.updateOne(
      { slug: challenge.slug },
      { $setOnInsert: challenge },
      { upsert: true }
    );
  }
  console.log('✅  Retos sembrados');
}

if (require.main === module) {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI is required'); process.exit(1); }
  mongoose.connect(uri)
    .then(() => seedChallenges())
    .then(() => mongoose.disconnect())
    .catch((err) => { console.error(err); process.exit(1); });
}
