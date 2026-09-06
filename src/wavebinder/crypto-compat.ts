/**
 * WaveBinder creates its license-session ID with crypto.randomUUID().
 * Some browsers expose Web Crypto but not this newer helper, so provide a
 * standards-compliant UUID v4 implementation before WaveBinder is loaded.
 */
if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID !== 'function') {
  Object.defineProperty(globalThis.crypto, 'randomUUID', {
    configurable: true,
    value: () => {
      const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16))

      bytes[6] = (bytes[6] & 0x0f) | 0x40
      bytes[8] = (bytes[8] & 0x3f) | 0x80

      return [...bytes]
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('')
        .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5')
    },
  })
}
