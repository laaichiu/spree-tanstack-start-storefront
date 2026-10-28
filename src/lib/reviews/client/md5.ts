const SHIFT_AMOUNTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
  9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
  16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15,
  21,
] as const

const CONSTANTS = Array.from({ length: 64 }, (_, index) =>
  Math.floor(Math.abs(Math.sin(index + 1)) * 2 ** 32),
)

function rotateLeft(value: number, amount: number) {
  return (value << amount) | (value >>> (32 - amount))
}

function appendUint32LittleEndian(
  target: Uint8Array,
  offset: number,
  value: number,
) {
  target[offset] = value & 0xff
  target[offset + 1] = (value >>> 8) & 0xff
  target[offset + 2] = (value >>> 16) & 0xff
  target[offset + 3] = (value >>> 24) & 0xff
}

function paddedMessage(bytes: Uint8Array) {
  let paddedLength = bytes.length + 1

  while (paddedLength % 64 !== 56) {
    paddedLength += 1
  }

  const padded = new Uint8Array(paddedLength + 8)
  padded.set(bytes)
  padded[bytes.length] = 0x80
  appendUint32LittleEndian(padded, paddedLength, (bytes.length * 8) >>> 0)
  appendUint32LittleEndian(
    padded,
    paddedLength + 4,
    Math.floor((bytes.length * 8) / 2 ** 32) >>> 0,
  )

  return padded
}

function digestBytes(bytes: Uint8Array) {
  const message = paddedMessage(bytes)
  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  for (let offset = 0; offset < message.length; offset += 64) {
    const words = new Array<number>(16)

    for (let index = 0; index < 16; index += 1) {
      const wordOffset = offset + index * 4
      words[index] =
        message[wordOffset] |
        (message[wordOffset + 1] << 8) |
        (message[wordOffset + 2] << 16) |
        (message[wordOffset + 3] << 24)
    }

    let a = a0
    let b = b0
    let c = c0
    let d = d0

    for (let index = 0; index < 64; index += 1) {
      let f: number
      let g: number

      if (index < 16) {
        f = (b & c) | (~b & d)
        g = index
      } else if (index < 32) {
        f = (d & b) | (~d & c)
        g = (5 * index + 1) % 16
      } else if (index < 48) {
        f = b ^ c ^ d
        g = (3 * index + 5) % 16
      } else {
        f = c ^ (b | ~d)
        g = (7 * index) % 16
      }

      const next = d
      d = c
      c = b
      b =
        (b +
          rotateLeft(
            (a + f + CONSTANTS[index] + words[g]) >>> 0,
            SHIFT_AMOUNTS[index],
          )) >>>
        0
      a = next
    }

    a0 = (a0 + a) >>> 0
    b0 = (b0 + b) >>> 0
    c0 = (c0 + c) >>> 0
    d0 = (d0 + d) >>> 0
  }

  const digest = new Uint8Array(16)
  appendUint32LittleEndian(digest, 0, a0)
  appendUint32LittleEndian(digest, 4, b0)
  appendUint32LittleEndian(digest, 8, c0)
  appendUint32LittleEndian(digest, 12, d0)

  return digest
}

export function md5Base64(bytes: Uint8Array) {
  const digest = digestBytes(bytes)
  let binary = ''

  for (const byte of digest) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
}
