const { parse } = require('query-string');
const PI = require('pi');

exports.handler = async (body, context) => {
  // slack unfortunately sends command payloads as x-url-form-encoded
  const parsed = parse(context.body.toString('utf8'));

  // ensure the input is a valid whole integer
  const numDigits = parseInt(parsed.text, 10);
  if (!numDigits || isNaN(numDigits)) {
    return {
      text: `Expected integer param, received ${typeof(numDigits)}`,
      response_type: 'ephemeral',
    };
  }

  // enforce a fun limit on the max pi digits
  if (numDigits > 10) {
    return {
      text: "You've already had too much 🥧!",
      response_type: 'ephemeral',
    };
  }
  return PI(numDigits - 1);
};
