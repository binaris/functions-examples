exports.computePiMapper = body => {
  let inside = 0;

  // repeat points times:
  for (let i = 0; i < body.points; i++) {

    // random point (use R = 1)
    const x = Math.random() * 2 - 1;
    const y = Math.random() * 2 - 1;

    // is it inside the circle?
    if (x * x + y * y < 1) {
      inside++;
    }
  }

  return inside;
};

exports.computePiReducer = body =>
  4 * body.inputs.reduce((a, b) => a + b) / body.points;
