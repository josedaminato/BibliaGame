import type { LuminaryId } from '../world/content'

export const FICTION_NOTE =
  'Los senderos, las semillas para juntar, la luciérnaga, Chispa y las criaturas concretas son recursos del juego para explorar. No agregan hechos al texto de Génesis. Dios es quien crea; vos recorrés y descubrís.'

export interface RefEntry {
  day: number
  title: string
  ref: string
  text: string
}

export const REFS: RefEntry[] = [
  {
    day: 1,
    title: 'La luz',
    ref: 'Génesis 1:1-5',
    text: 'Al principio Dios creó el cielo y la tierra. Todo estaba desordenado y oscuro. Dios hizo existir la luz, la separó de la oscuridad y llamó Día a la luz y Noche a la oscuridad.',
  },
  {
    day: 2,
    title: 'El cielo y las aguas',
    ref: 'Génesis 1:6-8',
    text: 'Dios separó las aguas de abajo y las de arriba, y en el medio quedó el cielo. A ese espacio lo llamó Cielo.',
  },
  {
    day: 3,
    title: 'Tierra y vegetación',
    ref: 'Génesis 1:9-13',
    text: 'Dios juntó las aguas y apareció lo seco. A lo seco lo llamó Tierra y a las aguas, Mares. Después la tierra se llenó de plantas, semillas y árboles. Dios vio que era bueno.',
  },
  {
    day: 4,
    title: 'Las luces del cielo',
    ref: 'Génesis 1:14-19',
    text: 'Dios puso luces en el cielo para separar el día de la noche y para marcar tiempos y estaciones: la luz mayor, la luz menor y las estrellas.',
  },
  {
    day: 5,
    title: 'Aguas y cielo con vida',
    ref: 'Génesis 1:20-23',
    text: 'Dios llenó las aguas de seres vivos y el cielo de aves, y los bendijo para que se multiplicaran.',
  },
  {
    day: 6,
    title: 'Animales y personas',
    ref: 'Génesis 1:24-31',
    text: 'Dios hizo los animales de la tierra. Después creó a la humanidad, varón y mujer, y les confió el cuidado de lo creado. Vio todo lo que había hecho, y era bueno en gran manera.',
  },
  {
    day: 7,
    title: 'El descanso',
    ref: 'Génesis 2:1-3',
    text: 'El cielo, la tierra y todo lo que hay en ellos quedó terminado. Dios descansó el séptimo día y lo bendijo.',
  },
]

export const DAY_TOAST: Record<number, string> = {
  1: 'Dios dijo que exista la luz. Y la luz existió.',
  2: 'Dios separó las aguas y apareció el cielo.',
  3: 'Lo seco se llenó de verde. Dios vio que era bueno.',
  4: 'Quedaron la luz mayor, la luz menor y las estrellas.',
  5: 'Las aguas y el cielo se llenaron de vida.',
  6: 'Aparecieron los animales de la tierra y, después, las personas.',
  7: 'El séptimo día fue de descanso. La creación estaba completa.',
}

export const LUMINARY_NAME: Record<LuminaryId, string> = {
  mayor: 'Luz mayor',
  menor: 'Luz menor',
  stars: 'Estrellas',
}

export const SIGN_LINES: Record<string, string[]> = {
  intro: [
    'En el principio, Dios creó el cielo y la tierra. Todo estaba vacío y oscuro.',
    'Caminá y mirá de cerca. Chispa, la lucecita, es solo tu guía: no aparece en la Biblia.',
  ],
  day1: ['Buscá tres resplandores. Cuando te acerques, la oscuridad se corre.'],
  water: ['Seguí a la luciérnaga, de lirio en lirio. Si pisás otro, se vuelve a empezar. No hay apuro.'],
  garden: [
    'Juntá semillas y dejálas en la tierra removida.',
    'En el juego es un gesto para explorar. En Génesis, es Dios quien hace brotar las plantas.',
  ],
  sky: ['Cada luz va al pedestal con su mismo dibujo: la mayor, la menor y las estrellas.'],
  coast: ['Empujá los peces hasta el agua. Tocá las aves para soltarlas.'],
  meadow: ['Caminá con el fruto. Los animales te siguen hasta el prado verde.'],
  tide: ['Si un pez se traba, la marea lo mueve un paso hacia el agua.'],
  whistle: ['Un silbido los orienta un paso hacia el prado.'],
}

export const COMPLETE_SUMMARY = [
  'Recorriste los siete días del relato de la creación.',
  'La luz, el cielo, la tierra, las plantas, las luces del cielo, los animales y las personas aparecieron en el orden de Génesis 1. Después llegó el descanso.',
  'Si querés leer el relato completo, abrí Génesis 1:1 a 2:3 en tu Biblia.',
]

export const EDEN_BLURB = [
  'Próximo nivel: El jardín del Edén.',
  'El jardín ya está plantado. El relato de Génesis 2 se acerca a la vida allí. Esta puerta todavía no se abre: es la presentación del siguiente tramo.',
]
