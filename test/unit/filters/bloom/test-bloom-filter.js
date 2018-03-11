require('chai/register-assert');

const BloomFilter = gsfRequire('lib/filters/bloom/BloomFilter');

describe('Test Bloom Filter', () => {
  it('generate based on maxEntries and probability', () => {
    const ceilM = (m, k) => Math.ceil(m / k / 8) * 8 * k;

    // n = 750, p = 0.01 (1 in 100) → m = 7,189 (899B), k = 7,
    let bloom = BloomFilter.create(750, 0.01);
    assert.strictEqual(bloom.m, ceilM(7189, 7));
    assert.strictEqual(bloom.k, 7);

    // n = 5,000, p = 0.001 (1 in 1,000) → m = 71,888 (8.78KB), k = 10
    bloom = BloomFilter.create(5000, 0.001);
    assert.strictEqual(bloom.m, ceilM(71888, 10));
    assert.strictEqual(bloom.k, 10);

    // n = 5,000, p = 0.005 (1 in 200) → m = 55,139 (6.73KB), k = 8
    bloom = BloomFilter.create(5000, 0.005);
    assert.strictEqual(bloom.m, ceilM(55139, 8));
    assert.strictEqual(bloom.k, 8);

    // n = 10,000, p = 0.001 (1 in 1,000) → m = 143,776 (17.55KB), k = 10
    bloom = BloomFilter.create(10000, 0.001);
    assert.strictEqual(bloom.m, ceilM(143776, 10));
    assert.strictEqual(bloom.k, 10);
  });

  it('constructor', () => {
    const bloom = new BloomFilter(1024, 6);
    assert.isNotNull(bloom, 'bloom filter should be defined');
  });

  it('getBitsetIdx32', () => {
    const k = 6;
    const blockSize = 1024;
    const m = k * blockSize;
    const byteBlocks = Math.round(m / 8);

    const bloom = new BloomFilter(m, k);
    assert.strictEqual(bloom.m, m);
    assert.strictEqual(bloom.k, k);
    assert.strictEqual(bloom.blockSize, blockSize);
    assert.strictEqual(bloom.bitset.length, byteBlocks);
  });

  it('getLocations', () => {
    const k = 6;
    const blockSize = 1024;
    const m = k * blockSize;

    const bloom = new BloomFilter(m, k);

    const l1 = bloom.getLocation('string1');
    assert.strictEqual(l1.length, k);

    const l2 = bloom.getLocation('string2');
    assert.strictEqual(l2.length, k);

    assert.notEqual(l1, l2);
  });

  /* eslint-disable no-bitwise */
  it('add', () => {
    const k = 6;
    const blockSize = 1024;
    const m = k * blockSize;

    const bloom = new BloomFilter(m, k);
    bloom.add('string1');

    const byteVal1 = bloom.bitset[13];
    const expectedVal = (1 << 4) | 0; // 108-104 (13 * 8) = 4, 4th bit from the 13th byte element, 3dblock = 4096
    assert.strictEqual(byteVal1, expectedVal);

    assert.strictEqual(bloom.getBit(108), 1);
    assert.strictEqual(bloom.getBit(107), 0);
    assert.strictEqual(bloom.getBit(109), 0);

    assert.strictEqual(bloom.getBit(1250), 1);
    assert.strictEqual(bloom.getBit(2608), 1);
    assert.strictEqual(bloom.getBit(3858), 1);
    assert.strictEqual(bloom.getBit(5108), 1);
    assert.strictEqual(bloom.getBit(5334), 1);
  });
  /* eslint-enable no-bitwise */

  it('check if set', () => {
    const k = 6;
    const blockSize = 1024;
    const m = k * blockSize;

    const bloom = new BloomFilter(m, k);

    bloom.add('string1');
    bloom.add('string2');

    assert.isTrue(bloom.test('string1'));
    assert.isTrue(bloom.test('string2'));
    assert.isFalse(bloom.test('string3'));
  });

  it('merge', () => {
    const k = 1;
    const blockSize = 8;
    const m = k * blockSize;

    const bloom = new BloomFilter(m, k);
    bloom.bitset[0] = 0;
    assert.strictEqual(bloom.bitset[0], 0);

    const mergeBitset = Buffer.alloc(1, 1);
    bloom.merge(mergeBitset);
    assert.strictEqual(bloom.bitset[0], 1);
    assert.strictEqual(bloom.getBit(0), 1);
    assert.strictEqual(bloom.getBit(1), 0);
  });
});
