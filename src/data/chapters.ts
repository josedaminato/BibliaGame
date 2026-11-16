export interface ChapterCard {
  id: string
  book: string
  title: string
  blurb: string
  time: string
  kind: 'level' | 'preview' | 'soon'
}

export const GENESIS: ChapterCard[] = [
  {
    id: 'creacion',
    book: 'Génesis',
    title: 'La creación',
    blurb: 'Una caminata por los siete días. Mirá cómo aparece el mundo, sin apuro.',
    time: 'Unos 8 minutos',
    kind: 'level',
  },
  {
    id: 'eden',
    book: 'Génesis',
    title: 'El jardín del Edén',
    blurb: 'La puerta del jardín. El nivel jugable llega después; ahora podés asomarte.',
    time: 'Una presentación corta',
    kind: 'preview',
  },
  {
    id: 'cain',
    book: 'Génesis',
    title: 'Caín y Abel',
    blurb: 'Dos hermanos y una decisión que pesa.',
    time: 'Más adelante',
    kind: 'soon',
  },
  {
    id: 'noe',
    book: 'Génesis',
    title: 'Noé y el diluvio',
    blurb: 'Un barco, una tormenta y una promesa.',
    time: 'Más adelante',
    kind: 'soon',
  },
  {
    id: 'babel',
    book: 'Génesis',
    title: 'La torre de Babel',
    blurb: 'Una ciudad que quiere alcanzar el cielo.',
    time: 'Más adelante',
    kind: 'soon',
  },
  {
    id: 'abraham',
    book: 'Génesis',
    title: 'Abraham',
    blurb: 'Un viaje largo y una confianza difícil.',
    time: 'Más adelante',
    kind: 'soon',
  },
  {
    id: 'isaac',
    book: 'Génesis',
    title: 'Isaac y Jacob',
    blurb: 'Una familia, pozos, y un camino que da vueltas.',
    time: 'Más adelante',
    kind: 'soon',
  },
  {
    id: 'jose',
    book: 'Génesis',
    title: 'José y sus hermanos',
    blurb: 'Un manto, un pozo y un reencuentro.',
    time: 'Más adelante',
    kind: 'soon',
  },
]
