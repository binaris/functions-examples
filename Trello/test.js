const fs = require('fs');
const assert = require('assert');
const { handleTrelloEvent } = require('./functions/handleTrelloEvent');

describe('handleTrelloEvent', async () => {
  const actionName = 'action_moved_card_lower';
  describe(`Called with an "${actionName}" action`, async () => {
    const expectedValue = { actionName };
    it(`Returns the right actionName ${JSON.stringify(expectedValue)}`, async () => {
      const input = JSON.parse(await fs.readFileSync('tests/action_moved_card_lower_payload.json'));
      const returnValue = await handleTrelloEvent(input);
      assert.deepStrictEqual(returnValue, expectedValue);
    });
  });

  describe('Called with an empty body', () => {
    it('Returns an empty response without errors', async () => {
      const input = {};
      const expectedValue = { actionName: null };
      const returnValue = await handleTrelloEvent(input);
      assert.deepStrictEqual(returnValue, expectedValue);
    });
  });
});
