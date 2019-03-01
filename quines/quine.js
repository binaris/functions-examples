const stanza = `

exports.handler = async (body, ctx) => {
  const backtick = String.fromCharCode(96);
  const quine = 'const stanza = '
    + backtick + stanza + backtick + ';'
    + stanza;
  return new ctx.HTTPResponse({
    body: quine,
  });
};
`;

exports.handler = async (body, ctx) => {
  const backtick = String.fromCharCode(96);
  const quine = 'const stanza = '
    + backtick + stanza + backtick + ';'
    + stanza;
  return new ctx.HTTPResponse({
    body: quine,
  });
};
