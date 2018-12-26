const test = require('ava');
const get = require('../functions/get');
const draw = require('../functions/draw');
const clear = require('../functions/clear');


test.beforeEach('cleanup', async () => {
  await clear.t.deleteSegments();
});

test.after.always('cleanup', async () => {
  await clear.t.deleteSegments();
});


test.serial('clear()', async (t) => {
  await clear.t.deleteSegments();
  t.deepEqual(await get.t.getSegments(), []);
});

test.serial('Simple segment insertion: draw(), get()', async (t) => {
  const testSegments = [
    {
      x1: 398, y1: 302, x2: 365, y2: 258, color: '00eeee',
    },
    {
      x1: 365, y1: 258, x2: 259, y2: 207, color: '00eeee',
    },
  ];

  draw.t.saveSegments(testSegments);
  t.deepEqual(await get.t.getSegments(), testSegments);
});

test.serial('Long segment insertion: draw(), get()', async (t) => {
  const range = [...Array(300).keys()];
  const testSegments = range.map(i => ({
    x1: i, y1: i, x2: i + 1, y2: i + 1, color: '00eeee',
  }));
  draw.t.saveSegments(testSegments);
  t.deepEqual(await get.t.getSegments(), testSegments);
});
