/* eslint-disable no-restricted-syntax, no-await-in-loop */

const { getRedisClient } = require('./redis');
const { format } = require('./util');
const redisKeys = require('./redisKeys');

const redisClient = getRedisClient();
exports.MAX_SEARCH_RESULTS = 5;

function sortObjectKeysByNumericValues(obj) {
  const sortedResults = Object.entries(obj)
    .sort((a, b) => (b[1] - a[1]))
    .map(item => item[0]);
  return sortedResults;
}

/**
 * @summary Returns a list of unique indexed words, each containing at least one searchTerm.
 * @example
 * // Assume the indexed words are: ['harry', 'potter', 'special', 'effects']
 * completeWords(['h', 'harry', 'eff']) === ['harry', 'effects']
 * @param {*} searchTerms An array of search words.
 */
async function completeWords(searchTerms) {
  const filteredsearchTerms = searchTerms.filter(w => /^[a-z]+$/.test(w));
  const indexedWords = await redisClient.hkeys(redisKeys.WORDS_TO_TITLES);
  const matchedWords = {};
  filteredsearchTerms.forEach((st) => {
    indexedWords.forEach((iw) => {
      if (iw.indexOf(st) >= 0) {
        matchedWords[iw] = matchedWords[iw] === undefined ? 0 : matchedWords[iw] + st.length;
      }
    });
  });
  return sortObjectKeysByNumericValues(matchedWords);
}
//

/**
 * @summary Returns a list of unique keys matched by at least one word in the input. No more than
 * MAX_SEARCH_RESULTS are returned.
 * @param {string[]} words a list of indexed words.
 */
async function getKeysByWords(words) {
  const keydict = {};
  for (const word of words) {
    const keys = JSON.parse(await redisClient.hget(redisKeys.WORDS_TO_TITLES, word));
    for (const key of keys) {
      if (!(key in keydict)) {
        keydict[key] = true;
        if (Object.keys(keydict).length === exports.MAX_SEARCH_RESULTS) {
          return Object.keys(keydict);
        }
      }
    }
  }
  return Object.keys(keydict);
}

/**
 * @summary Search the given terms. Return
 * @param {string[]} searchTerms
 */
async function search(searchTerms) {
  const arraySearchTerms = (typeof searchTerms === 'string') ? [searchTerms] : searchTerms;
  const words = await completeWords(arraySearchTerms);
  const keys = await getKeysByWords(words);

  const resp = keys.length > 0 ? await redisClient.hmget(redisKeys.TITLES_TO_PICTURES, keys) : {};
  const rv = keys.map((_, i) => ({ name: keys[i], picture: resp[i] }));
  return rv;
}

/**
 * @summary Search the given terms
 * @description A thin HTTP wrapper around {@link search}
 * @returns A CORS-friendly HTTP response
 * @param {string[]} searchTerms An array of textual search terms
 */
exports.searchWithCors = async (searchTerms, ctx) => {
  const resp = await search(searchTerms);
  console.log(format({ searchTerms }));
  return new ctx.Response({
    body: Buffer.from(JSON.stringify(resp)),
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
};

// Expose some internals for testing.
exports.t = { redisClient, search };
