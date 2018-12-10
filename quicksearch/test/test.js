/* eslint-disable no-param-reassign */

const test = require('ava');
const fs = require('fs');
const { getRedisClient } = require('../functions/redis');
const { format } = require('../functions/util');
const indexKeys = require('../functions/redisKeys');
const update = require('../functions/update');
const search = require('../functions/search');

const harry = 'harry';

test.beforeEach(async (t) => {
  t.context.client = getRedisClient();

  await t.context.client.flushdb();
  t.deepEqual([], await t.context.client.keys('*'));
  t.context.entries = JSON.parse(await fs.readFileSync('test/sample_data.json', 'utf8'));
  update.update(t.context.entries);
  t.notDeepEqual([], await t.context.client.keys('*'));
});

test.afterEach.always(async (t) => {
  const clients = [t.context.client, update.t.redisClient, search.t.redisClient];
  t.log(format(clients[1]));
  await Promise.all(clients.map(client => client.flushdb()));
});

test.serial('Updates', async (t) => {
  const { client } = t.context;
  const keys = JSON.parse(await fs.readFileSync('test/sample_data_keys.json', 'utf8'));
  const expectedKeys = keys.words.sort();
  const expectedEntries = keys.entries.sort();

  const actualKeys = (await client.hkeys(indexKeys.WORDS_TO_TITLES)).sort();
  t.deepEqual(expectedKeys, actualKeys);

  const actualEntries = (await client.hkeys(indexKeys.TITLES_TO_PICTURES)).sort();
  t.deepEqual(expectedEntries, actualEntries);

  t.log(t.context.entries);
  const expectedKeysForHarry = Object.entries(t.context.entries)
    .filter(k => k[1].name.toLowerCase().contains(harry))
    .map(k => k[1].name);

  const actualKeysForHarry = JSON.parse(await client.hget(indexKeys.WORDS_TO_TITLES, harry));
  t.log(format({ expectedKeysForHarry }));
  t.log(format({ actualKeysForHarry }));
  t.deepEqual(expectedKeysForHarry, actualKeysForHarry);

  const expectedSizeOfWordIndex = 48;
  const actualSizeOfWordIndex = (await client.hkeys(indexKeys.WORDS_TO_TITLES)).length;
  t.deepEqual(expectedSizeOfWordIndex, actualSizeOfWordIndex);
});

test.serial('Maximum numner of search results is 5', async (t) => {
  t.is(5, search.MAX_SEARCH_RESULTS);
});

test.serial('Maximum numner of search results is compatible with MAX_SEARCH_RESULTS', async (t) => {
  const actualSearchResult = await search.t.search(['a']);
  t.is(search.MAX_SEARCH_RESULTS, actualSearchResult.length);
});

test.serial('Search Harry Potter', async (t) => {
  const actualHarrySearchResult = await search.t.search([harry]);
  const expectedHarrySearchResult = [{ name: 'Harry Potter and the Forbidden Journey', picture: 'https://www.universalstudioshollywood.com/wp-content/uploads/2017/04/802x535_Potter_Forbidden_Journey_Quidditch.jpg' }, { name: 'The Wizarding World of Harry Potter', picture: 'https://www.universalstudioshollywood.com/wp-content/uploads/2017/04/Potter-Keyart-WWoHP-802x535.jpg' }];
  t.deepEqual(expectedHarrySearchResult, actualHarrySearchResult);
});

test.serial('Search for nonexistent terms', async (t) => {
  const searchTerms = [
    ['zg'],
    ['pita'],
    ['123123'],
    ['zg', 'pita', '123123'],
    [],
  ];

  const searchResults = await Promise.all(searchTerms.map(term => search.t.search(term)));
  t.true(searchResults.every(i => i.length === 0), 'All search results are empty');
});

test.serial('Search zero terms', async (t) => {
  const actualHarrySearchResult = await search.t.search([]);
  const expectedHarrySearchResult = [];
  t.deepEqual(expectedHarrySearchResult, actualHarrySearchResult);
});

test.serial('Search empty string', async (t) => {
  const actualHarrySearchResult = await search.t.search('');
  const expectedHarrySearchResult = [];
  t.deepEqual(expectedHarrySearchResult, actualHarrySearchResult);
});


test.serial('Search results are sorted according to', async (t) => {
  const actualHarrySearchResult = await search.t.search(['and', 'land', 'panda']);
  const expectedOrderedSearchResult = [
    'DreamWorks Theatre Featuring Kung Fu Panda',  // 8 === 'and'.length + 'panda'.length
    'Super Silly Fun Land',                        // 7 === 'and'.length + 'land'.length
    'Harry Potter and the Forbidden Journey',      // 3 === 'and'.length
  ];
  t.is(actualHarrySearchResult.length, expectedOrderedSearchResult.length);
  for (let i = 0; i < expectedOrderedSearchResult.length; i += 1) {
    t.is(expectedOrderedSearchResult[i], actualHarrySearchResult[i].name);
  }
});

test.serial('Mix matched and unmatched search words', async (t) => {
  const actuaSearchResult = await search.t.search(['am', 'zz']);
  t.is(1, actuaSearchResult.length);
});

test.serial('Intersecting search words', async (t) => {
  const ghSearchResult = await search.t.search(['gh']);
  const chSearchResult = await search.t.search(['ch']);
  const ghchSearchResult = await search.t.search(['gh', 'ch']);
  t.is(2, ghSearchResult.length);
  t.is(2, chSearchResult.length);
  t.is(3, ghchSearchResult.length);
});

test.serial('Disjoint search words', async (t) => {
  const ddSearchResult = await search.t.search(['dd']);
  const chSearchResult = await search.t.search(['ch']);
  const ddchSearchResult = await search.t.search(['dd', 'ch']);
  t.is(1, ddSearchResult.length);
  t.is(2, chSearchResult.length);
  t.is(3, ddchSearchResult.length);
});
