// Safari (und ältere Browser) können ReadableStream nicht mit `for await … of` durchlaufen.
// PDF.js nutzt das beim Lesen der Textebene und beim Entpacken komprimierter Daten.
// Ergänzt die fehlende Methode – nur wenn sie fehlt, sonst bleibt der Browser unverändert.
if (typeof ReadableStream !== 'undefined' && !ReadableStream.prototype[Symbol.asyncIterator]) {
  const iterator = async function* ({ preventCancel = false } = {}) {
    const reader = this.getReader()
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) return
        yield value
      }
    } finally {
      if (!preventCancel) reader.cancel().catch(() => {})
      reader.releaseLock()
    }
  }
  Object.defineProperty(ReadableStream.prototype, Symbol.asyncIterator, { value: iterator, writable: true, configurable: true })
  if (!ReadableStream.prototype.values) Object.defineProperty(ReadableStream.prototype, 'values', { value: iterator, writable: true, configurable: true })
}
