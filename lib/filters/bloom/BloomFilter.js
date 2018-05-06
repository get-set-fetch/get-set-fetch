const Logger = gsfRequire('lib/logger/Logger').getLogger('BloomFilter');
const murmur = require('murmurhash-js');


/* eslint-disable no-bitwise */
class BloomFilter {
  static create(maxEntries, probability, bitset) {
    const m = Math.ceil(-(maxEntries * Math.log(probability)) / (Math.log(2.0) ** 2));
    const k = Math.ceil(-Math.log2(probability));

    return new BloomFilter(m, k, bitset);
  }
  constructor(m, k, bitset) {
    // round m so that we have block sizes of  Uint8Array (implemented by Buffer) multiple
    this.k = k;
    this.blockSize = Math.ceil(m / k / 8) * 8;
    this.m = this.k * this.blockSize;

    // initialize bitset
    this.bitset = (bitset === undefined || bitset === null) ? Buffer.alloc(Math.round(this.m / 8), 0) : bitset;
  }

  add(val) {
    const locations = this.getLocation(val);
    for (let i = 0; i < this.k; i += 1) {
      const byteIdx = Math.ceil(locations[i] / 8) - 1;
      const bitIdx = locations[i] % 8;
      this.bitset[byteIdx] = this.bitset[byteIdx] | (1 << bitIdx);
    }
  }

  merge(extBitset) {
    if (extBitset && this.bitset.length === extBitset.length) {
      for (let i = 0; i < this.bitset.length; i += 1) {
        this.bitset[i] |= extBitset[i];
      }
    }
    else {
      Logger.warn('merge: invalid bitset size');
    }
  }

  test(val) {
    const locations = this.getLocation(val);
    for (let i = 0; i < this.k; i += 1) {
      const byteIdx = Math.ceil(locations[i] / 8) - 1;
      const bitIdx = locations[i] % 8;

      if ((this.bitset[byteIdx] & (1 << bitIdx)) === 0) {
        return false;
      }
    }
    return true;
  }

  getLocation(val) {
    const locations = [];

    /*
    each murmur3 hash function returns 2^32 block idx value
    */
    const hash1 = murmur.murmur3(val, 0);
    const hash2 = murmur.murmur3(val, 256);

    locations.push(hash1 % this.blockSize);
    locations.push(this.blockSize + (hash2 % this.blockSize));

    for (let i = 2; i < this.k; i += 1) {
      const idx = (i * this.blockSize) + ((hash1 + (hash2 * i)) % this.blockSize);
      locations.push(idx);
    }

    return locations;
  }

  getBit(idx) {
    let byteIdx = Math.ceil(idx / 8) - 1;
    // for idx === 0, byteIdx results in -1
    byteIdx = Math.max(0, byteIdx);
    const bitIdx = idx % 8;

    return (this.bitset[byteIdx] & (1 << bitIdx)) === 0 ? 0 : 1;
  }
}

/* does not have seed, can't be using as pairwise independent hash combinations */
// eslint-disable-next-line no-unused-vars, camelcase
function hashFNV_1a_32(stringVal) {
  const prime = 16777619;
  let hash = 2166136261;

  for (let i = 0; i < stringVal.length; i += 1) {
    // each char code is UTF-16, 2 bytes
    const charCode = stringVal.charCodeAt(i);

    const firstByte = charCode & 0xFF;
    hash ^= firstByte;
    hash = (hash * prime) | 0; // Bitwise OR with zero to ensure a 32bit integer.

    const lastByte = charCode >> 8;
    hash ^= lastByte;
    hash = (hash * prime) | 0;
  }
}

module.exports = BloomFilter;
