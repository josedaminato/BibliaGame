import { readSave, writeSave, type KeyValue, type SaveV1 } from './save'

function browserStore(): { store: KeyValue; persistent: boolean } {
  const memory = new Map<string, string>()
  const fallback: KeyValue = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => {
      memory.set(key, value)
    },
    removeItem: (key) => {
      memory.delete(key)
    },
  }
  try {
    const probe = '__dep_probe'
    localStorage.setItem(probe, '1')
    localStorage.removeItem(probe)
    return { store: localStorage, persistent: true }
  } catch {
    return { store: fallback, persistent: false }
  }
}

const backing = browserStore()

class Session {
  data: SaveV1
  readonly persistent = backing.persistent
  touched = false

  constructor() {
    this.data = readSave(backing.store)
  }

  commit(): void {
    try {
      writeSave(backing.store, this.data)
    } catch {
      /* The play session still continues in memory. */
    }
  }
}

export const session = new Session()
