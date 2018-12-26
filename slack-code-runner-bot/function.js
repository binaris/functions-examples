const { WebClient } = require('@slack/client');
const { VM } = require('vm2');
const decode = require('decode-html');

const {
  SLACK_BOT_TOKEN: token,
  BOT_TRIGGER_STATEMENT: triggerStatement,
  MAX_CODE_RUNTIME_MS: maxTimeMS,
} = process.env;
const web = new WebClient(token);

const triBacktick = '```';

/**
 * Extracts the potential JavaScript code segment located
 * between leading and trailing triple backticks ```
 *
 * @param {string} textToExtractFrom - segment to attempt code extraction on
 *
 * @return {string} - extracted code segment
 */
function extractBetweenBackticks(textToExtractFrom) {
  const startIdx = textToExtractFrom.indexOf(triBacktick);
  const endIdx = textToExtractFrom.lastIndexOf(triBacktick);

  if (startIdx === -1 || endIdx === -1 || (startIdx === endIdx)) {
    throw new Error('Javascript input must begin and end with triple backticks');
  }
  return extractText.substring(startIdx + 3, endIdx);
}

/**
 * Runs the provided code and returns computed output.
 *
 * @param {string} code - Javascript code to evaluate
 * @param {Array} logBuffer - buffer to insert stdout ouput into
 */
async function runCode(code, logBuffer) {
  // replacement for logic usually handled by "console"
  const pushLogs = (data) => logBuffer.push(data);
  const redirectConsole = {
    err: pushLogs,
    log: pushLogs,
    warn: pushLogs,
  };

  let result;
  const vm = new VM({
    timeout: maxTimeMS,
    sandbox: { console: redirectConsole },
    require: { external: true },
  });

  return vm.run(`(async function run() { ${code} })()`);
}

/**
 * Create the final representation of the message that should be sent
 * back to the slack channel.
 *
 * @param {Array} logs - list of potential log entries
 * @param {string} result - result of running the user code
 *
 * @return {string} - final and complete response output
 */
function constructFinalMsg(logs, result) {
  let codeMsg = '';
  if (result) {
    codeMsg =
`\`Code output\`
${triBacktick}
${result}
${triBacktick}`;
  }
  if (logs && logs.length) {
    codeMsg = `${codeMsg}
\`Log output\`
${triBacktick}
${logs.join('\n')}
${triBacktick}`;
  }
  return codeMsg;
}

/**
 * Extracts, and then evaluates the input code segment and
 * then notifies the trigger slack channel based on response.
 *
 * @param {string} codeText - code to execute
 * @param {string} channel - Slack channel which should receive execution output
 */
async function evaluateAndNotifySlack(codeText, channel) {
  let result;
  const logBuffer = [];
  try {
    const code = extractBetweenBackticks(decode(codeText));
    result = await runCode(code, logBuffer);
  } catch (err) {
    result = `Error: ${err.message || err}`;
  }

  const finalMsg = constructFinalMsg(logBuffer, result);
  web.chat.postMessage({ channel, text: finalMsg });
}

exports.handler = async (body, context) => {
  // slack requires a challenge be answered to verify ownership
  if (body && body.challenge) {
    return body.challenge;
  }

  const { channel, text } = body.event;
  // if the input includes our trigger statement begin
  // to evaluate the content as code
  if (text.includes(triggerStatement)) {
    evaluateAndNotifySlack(text, channel);
  }

  // web.chat.postMessage({ channel, text: result });
  return 200;
};
