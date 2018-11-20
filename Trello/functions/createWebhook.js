const rp = require('request-promise-native');

/**
 * @typedef {Object} TrelloWebhook
 * @property {string} description A human-readable description
 * @property {string} callbackURL A URL to be called when a Trello event occurs.
 * Use Binaris functions to create these backends in advance.
 * @property {string} idModel The id of the Trello object (card, board, list, ...) that triggers the webhooks.
 */

/**
 * @summary Create a new [Trello Webhook]{@link https://developers.trello.com/page/webhooks}.
 * @param {TrelloWebhook} params - webhook parameters.
 * @description I'm a Binaris function. [Deploy me]{@link https://dev.binaris.com}.
 */

exports.createWebhook = async (params) => {
  const { TRELLO_API_KEY, TRELLO_TOKEN } = process.env;

  const options = {
    url: `https://api.trello.com/1/tokens/${TRELLO_TOKEN}/webhooks`,
    qs: {
      key: TRELLO_API_KEY,
      description: params.description,
      callbackURL: params.callbackURL,
      idModel: params.idModel,
    },
    json: true,
  };
  const response = await rp.post(options);
  console.log(`Webhook created: ${JSON.stringify({ response })}`);
  return response;
};
