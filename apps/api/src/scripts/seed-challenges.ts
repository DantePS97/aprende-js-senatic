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
