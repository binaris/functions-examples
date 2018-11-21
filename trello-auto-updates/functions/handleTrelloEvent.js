const get = require('lodash.get');
const moment = require('moment');
const { format, invokeJSON } = require('./util');

/**
 * @summary Generate an update object to be sent to the Trello API.
 * @param {boolean} isDoneList Should items be marked as 'Done'?
 * @param {boolean} isTodoList Should items have no due date and no owner?
 * @param {string} boardId Trello board id in which the create/ move event occured
 * @param {string} listName The target list in which the card was created, or to which it was moved
 * @private
 */
async function getUpdates(isDoneList, isTodoList, boardId, listName) {
  if (isDoneList) {
    // Mark items in the done list(s) as done. They will have a green badge.
    return { dueComplete: true };
  }
  if (isTodoList) {
    // Items in a general ToDo list should have no due date or assignees.
    return {
      dueComplete: false,
      due: false,
      idMembers: [],
    };
  }
  /*
   * If the list name matches a board member, set the card a due date in 25 hours from
   * now, assign it to the board member and mark it as undone.
   * It's 25 hours to avoid the inconsistent transparent/yellow blink when a Trello card passes the 24 hours threshold.
   */
  const boardMembers = await invokeJSON('getBoardMembers', { boardId });
  const membersToAssign = boardMembers.filter(i => i.fullName.toLowerCase() === listName.toLowerCase());
  const idMembers = membersToAssign.map(i => i.id);
  if (idMembers.length > 0) {
    return {
      dueComplete: false,
      due: moment().add(25, 'h').toISOString(),
      idMembers,
    };
  }
  return {};
}

/**
 * @summary Processes a Trello webhook payload.
 *
 * @description Trello API can be used to configure webhooks, which will send a notification
 * to a given URL upon changes to a Trello model (card, board, list, and others).
 * This function handles the webhook message.
 *
 * I'm a Binaris function. [Deploy me]{@link https://dev.binaris.com}.
 *
 * @param body - A [Trello webhook call payload]{@link https://developers.trello.com/page/webhooks#section-triggering-webhooks}
 */

exports.handleTrelloEvent = async (body, req) => {
  /*
   * Return an empty 200 when the URL is tested by Trello without an actual event.
   * Trello tests the webhook upon its creation, and expects a 200 from the URL
   * regardless of its payload.
   */
  if (Object.keys(body).length === 0) {
    console.log(`Called without a body, request is ${format(req)}`);
    return { actionName: null };
  }
  console.log(`[DEBUG] Incoming webhook event: ${JSON.stringify(body)}`);

  // Parse the webhook payload
  const { action } = body;
  const { display } = action;
  const cardId = get(body, 'action.data.card.id');
  const { translationKey: actionName } = display;
  const listName = get(body, 'action.data.listAfter.name') || get(body, 'action.data.list.name');
  const boardId = get(body, 'action.data.board.id');

  const cardCreateOrMoveActions = ['action_create_card', 'action_move_card_from_list_to_list'];
  const isCardCreateOrMoveCardAction = cardCreateOrMoveActions.includes(actionName);

  const todoNamePattern = /^todo$/i;
  const doneNamePattern = /^done$/i;
  const isDoneList = doneNamePattern.test(listName);
  const isTodoList = todoNamePattern.test(listName);

  const fields = format({
    cardId, actionName, listName, isDoneList, isTodoList, isCardCreateOrMoveCardAction,
  });
  console.log(`Event attributes: ${fields}`);

  /*
   * Respond only to cards created or moved. This prevents the function
   * from responding to events created by itself, creating a loop with
   * the Trello API.
   */
  if (!isCardCreateOrMoveCardAction) {
    console.log(`Action ${format(actionName)}, ignored, not one of ${format(cardCreateOrMoveActions)}`);
    return { actionName };
  }

  const updates = await getUpdates(isDoneList, isTodoList, boardId, listName);

  /*
   * Update the trello card. Note that the Trello secrets (API key and token) are kept
   * in a different Binaris function. Developers changing this function do need to know
   * them in order to change this function.
   */
  console.log(`Card ${cardId} updates set to ${format(updates)}`);
  if (Object.keys(updates).length > 0) {
    const updateResponseBody = await invokeJSON('updateTrelloCard', { cardId, updates });
    console.log(format({ updateResponseBody }));
  }
  return { actionName };
};
