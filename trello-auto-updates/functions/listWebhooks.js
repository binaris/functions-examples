const rp = require('request-promise-native');

/**
 * @summary Lists existing Trello webhooks.
 * @description I'm a Binaris function. [Deploy me]{@link https://dev.binaris.com}.
 */

exports.listWebhooks = async () => {
  const { TRELLO_API_KEY, TRELLO_TOKEN } = process.env;

  const options = {
    url: `https://api.trello.com/1/tokens/${TRELLO_TOKEN}/webhooks`,
    qs: {
      key: TRELLO_API_KEY,
      token: TRELLO_TOKEN,
    },
    json: true,
  };
  const response = await rp.get(options);

  console.log(`Trello API Response: ${JSON.stringify(response)}`);
  return response;
};
