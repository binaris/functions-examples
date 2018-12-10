const { getRedisClient } = require('./redis');
const redisKeys = require('./redisKeys');

const redisClient = getRedisClient();

/**
 * @summary Updates a the quicksearch database.
 * @description I'm a Binaris function. [Deploy me]{@link https://dev.binaris.com}.
 */
exports.update = async (entries) => {
  const index = {};

  Object.entries(entries).forEach(async ([, entry]) => {
    // The _{key} stores the human-readable name and an image URL.
    console.log(`Indexing: "${entry.name}" => "${entry.picture}"`);

    // Index words with more two or more English letters
    const words = entry.name
      .split(/\s+/g)
      .map(w => w.toLowerCase())
      .filter(w => /^[a-z]{2,}$/.test(w));
    console.log(`Words: ${words} => "${entry.name}"`);

    // Each indexed word points to the key(s) in which it appears.
    words.forEach((word) => {
      if (!(word in index)) {
        index[word] = [];
      }
      index[word].push(entry.name);
    });
    await redisClient.hset(redisKeys.TITLES_TO_PICTURES, entry.name, entry.picture);
  });


  const indexWords = Object.keys(index);
  indexWords.forEach(async (word) => {
    await redisClient.hset(redisKeys.WORDS_TO_TITLES, word, JSON.stringify(index[word]));
  });
  return index;
};

// Expose some internals for testing.
exports.t = { redisClient };
