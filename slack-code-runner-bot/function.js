const { WebClient } = require('@slack/client');
const decode = require('decode-html');

const token = process.env.SLACK_BOT_TOKEN;
const web = new WebClient(token);

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

// text that if present should elicit a response from the bot
const botTrigger = '@provemeright';

const NL = '\n';
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
  let finalMsg = `\`Code output\`${NL}${triBacktick}${result}${triBacktick}`;
  if (logs && logs.length) {
    finalMsg = `${finalMsg}${NL}\`Log output\`${NL}${triBacktick}${logs.join(NL)}${triBacktick}`;
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
  // replace the default console.log with an intercepter,
  // the intercepted messages will be included in the
  // response output
  const interceptMessages = [];
  const realLogger = console.log;
  console.log = (...args) => {
    interceptMessages.push(args);
    // still give the intended log message to the original console
    realLogger.apply(console, args);
  };

  let result;
  // only exec the code if it meets our regex format
  if (codeRegex.test(code)) {
    const extractText = codeRegex.exec(decode(code));
    try {
      // create a new AsyncFunction to run the extracted code
      const userfuncPromise = new AsyncFunction(extractText[2])
      // enforce a maximum time limit on the running code to avoid
      // long running segments
      result = await Promise.race([
        new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(timeoutRejection);
          }, maxTimeMS);
        }),
        userfuncPromise(),
      ]);
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
  if (codeText && codeText.includes(botTrigger)) {
    runCode(codeText, body.event.channel);
  }
  return 200;
};
