const express = require('express');

const fractal = require('../fractal');
const app = express();

async function handleReq(req, res) {
  if (req && req.query) {
    req.query.express_server = true;
    res.request = { query: req.query };
  }
  return await fractal.handler(req.body, res);
}

app.get('/v2/*', handleReq);

app.listen(3000, () => console.log('Fractal server running at localhost:3000/v2/*'));
