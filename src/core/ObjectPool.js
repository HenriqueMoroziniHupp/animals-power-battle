/**
 * Pool genérico. Usado por partículas, números de dano, barras de vida e
 * projéteis — evita alocação/GC no meio do gameplay, que é a principal
 * causa de engasgos de framerate em mobile.
 */
export class ObjectPool {
  /**
   * @param {() => T} factory cria uma instância nova
   * @param {(item: T) => void} [reset] devolve o item ao estado inicial
   * @param {number} [prealloc] quantos criar de antemão
   * @template T
   */
  constructor(factory, reset = null, prealloc = 0) {
    this.factory = factory
    this.reset = reset
    /** @type {T[]} */
    this.free = []
    /** @type {Set<T>} */
    this.active = new Set()
    for (let i = 0; i < prealloc; i++) this.free.push(factory())
  }

  acquire() {
    const item = this.free.pop() ?? this.factory()
    this.active.add(item)
    return item
  }

  release(item) {
    if (!this.active.delete(item)) return
    if (this.reset) this.reset(item)
    this.free.push(item)
  }

  releaseAll() {
    for (const item of this.active) {
      if (this.reset) this.reset(item)
      this.free.push(item)
    }
    this.active.clear()
  }

  get activeCount() {
    return this.active.size
  }
}
