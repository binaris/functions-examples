const rp = require('request-promise-native');

const { TRELLO_API_KEY, TRELLO_TOKEN } = process.env;

/**
 * @typedef {Object} Board
 * @property {string} boardId A trello ID of an existing board. Obtain it by calling
 * https://trello.com/b/<board-short-id>.json from a browser and copying the id field.
 */

/**
 * @summary Gets the members of a Trello board.
 *
 *
 * @example
 * bn invoke getBoardMembers --data '{"boardId": "boardxxxxxxxxxxxxxxxxxxx"}'
 * [
 *   {
 *     "id": "userxxxxxxxxxxxxxxxxxxxx",
 *     "fullName": "Adam Matan",
 *     "username": "adammatan"
 *    },
 *    ...
 * ]
 * @param {Board} params
 *
 * @description I'm a Binaris function. [Deploy me]{@link https://dev.binaris.com}.
 */


exports.getBoardMembers = async (params) => {
  const { boardId } = params;
  const options = {
    url: `https://api.trello.com/1/boards/${boardId}/members`,
    qs: {
      key: TRELLO_API_KEY,
      token: TRELLO_TOKEN,
    },
    json: true,
  };

  const rv = await rp.get(options);
  console.log(`Board members for ${boardId}: ${JSON.stringify({ rv })}`);
  return rv;
};
