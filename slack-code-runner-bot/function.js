const { WebClient } = require('@slack/client');
const { VM } = require('vm2');
const decode = require('decode-html');

const {
  SLACK_BOT_TOKEN: token,
  BOT_TRIGGER_STATEMENT: triggerStatement,
} = process.env;
const web = new WebClient(token);

const triBacktick = '```';
// code is only valid if it starts with ``` and ends with ```
const codeRegex = new RegExp(/(.*`{3,})([\s\S]*)(`{3,}.*)/m);

// maximum time user code should be allowed to evaluate
const maxTimeMS = 2000;
const timeoutRejection = `Invocation timed out in ${maxTimeMS} ms`;

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
  let finalMsg =
`\`Code output\`
${triBacktick}
${result}
${triBacktick}`;
  if (logs && logs.length) {
    finalMsg =
`${finalMsg}
\`Log output\`
${triBacktick}
${logs.join('\n')}
${triBacktick}`;
  }
  return finalMsg;
}

/**
 * Runs the provided code and responds with the output
 * in the specified channel.
 *
 * @param {string} - Javascript code to evaluate
 * @param {string} - id of channel to post output to
 */
async function runCode(code, channel) {
  const interceptMessages = [];
  // replacement for logic usually handled by "console"
  function pushLogs(data) {
    interceptMessages.push(data);
  }
  const redirectConsole = {
    err: pushLogs,
    log: pushLogs,
    warn: pushLogs,
  };

  let result;
  // only exec the code if it meets our regex format
  if (codeRegex.test(code)) {
    const extractText = codeRegex.exec(decode(code));
    const vm = new VM({
      timeout: maxTimeMS,
      sandbox: { console: redirectConsole },
      require: { external: true },
    });

    try {
      result = await vm.run(`(async function run() { ${extractText[2]} })()`);
    } catch (err) {
      result = `Error: ${err.message || err}`;
    }
  } else {
    result = 'Error: Javascript input must be enclosed with triple backticks ```';
  }
  const finalMsg = constructFinalMsg(interceptMessages, result);
  // finally, send the computed response back to slack
  await web.chat.postMessage({ channel, text: finalMsg });
}

exports.handler = async (body, context) => {
  // slack requires a challenge be answered to verify ownership
  if (body && body.challenge) {
    return body.challenge;
  }

  const codeText = body.event.text;
  // if the input includes our trigger statement begin
  // to evaluate the content as code
  if (codeText && codeText.includes(triggerStatement)) {
    runCode(codeText, body.event.channel);
  }
  return 200;
};
