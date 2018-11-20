const rp = require('request-promise-native');
const { format } = require('./util');

const { TRELLO_API_KEY, TRELLO_TOKEN } = process.env;

/**
 * @typedef {Object} TrelloCardUpdate
 * @property {string} cardId A Trello card id.
 * @property {Object} cardFields An object with any trello card fields, like
 * 'name' or 'pos'. See https://developers.trello.com/v1.0/reference#cardsid-1
 */

/**
 * @summary Updates a Trello card.
 *
 * @example
 * // Set a due date
 * $ export CARD_ID="..."
 * $ bn invoke updateTrelloCard \
 *      --data '{
 *         "cardId": "'$CARD_ID'",
 *         "updates": {
 *           "due": "2018-12-29 11:23:45"
 *          }
 *        }'
 *
 * {"id":"...","badges":{"votes"...
 *
 * @example
 * // Set owner
 * $ export CARD_ID="..."
 * $ export MEMBER_ID="..."
 * $ bn invoke updateTrelloCard \
 *      --data '{
 *         "cardId": "'$CARD_ID'",
 *         "updates": {
 *           "idMembers": "'$MEMBER_ID'"
 *          }
 *        }'
 *
 * {"id":"...","badges":{"votes"...
 *
 * @example
 * // Set multiple owners
 * $ export CARD_ID="..."
 * $ export MEMBER_ID_1="..."
 * $ export MEMBER_ID_2="..."
 * $ bn invoke updateTrelloCard \
 *      --data '{
 *         "cardId": "'$CARD_ID'",
 *         "updates": {
 *           "idMembers": ["'$MEMBER_ID_1'", "'$MEMBER_ID_2'"]
 *          }
 *        }'
 *
 * {"id":"...","badges":{"votes"...
 *
 * @example
 * // Remove owners
 * $ export CARD_ID="..."
 * $ bn invoke updateTrelloCard \
 *      --data '{
 *         "cardId": "'$CARD_ID'",
 *         "updates": {
 *           "idMembers": []
 *          }
 *        }'
 *
 * {"id":"...","badges":{"votes"...
 *
 * @example
 * // Set completion status
 * $ export CARD_ID="..."
 * $ bn invoke updateTrelloCard \
 *      --data '{
 *         "cardId": "'$CARD_ID'",
 *         "updates": {
 *           "dueComplete": true
 *          }
 *        }'
 *
 * {"id":"...","badges":{"votes"...
 *
 * @example
 * // Combined update
 * $ export CARD_ID="..."
 * $ bn invoke updateTrelloCard \
 *      --data '{
 *         "cardId": "'$CARD_ID'",
 *         "updates": {
 *           "dueComplete": true,
 *           "idMembers": [],
 *           "due": "2018-12-29 11:23:45"
 *          }
 *        }'
 *
 * {"id":"...","badges":{"votes"...
 *
 * @param {TrelloCardUpdate} params
 * @description I'm a Binaris function. [Deploy me]{@link https://dev.binaris.com}.
 */

exports.updateTrelloCard = async (params) => {
  const { cardId, updates } = params;

  const options = {
    method: 'PUT',
    url: `https://api.trello.com/1/cards/${cardId}`,
    qs: {
      key: TRELLO_API_KEY,
      token: TRELLO_TOKEN,
    },
    json: updates,
  };

  console.log(`Calling the Trello API with ${format({ cardId, updates })}`);
  const rv = await rp(options);
  console.log(`Response is ${JSON.stringify(rv)}`);
  return rv;
};
