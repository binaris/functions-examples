const Alexa = require('ask-sdk-core');
const PI = require('pi');

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = 'What would you like to compute';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Compute, powered by binaris', speechText)
      .getResponse();
  }
};

const CalculateIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'calculate';
  },
  handle(handlerInput) {
    const inputField = handlerInput.requestEnvelope.request.intent.slots.number_of_digits.value;

    // ensure the input is a valid, real number
    const numDigits = parseInt(inputField, 10);
    if (!numDigits || isNaN(numDigits)) {
      return handlerInput.responseBuilder
        .speak(`Expected number, received ${typeof(inputField)}`)
        .getResponse();
    }

    // enforce a fun limit on the max pi digits
    if (numDigits > 10) {
      const overflowResponse = "You've already had too much 🥧!";
      return handlerInput.responseBuilder
        .speak(overflowResponse)
        .withSimpleCard(overflowResponse)
        .getResponse();
    }

    const piToNDigits = PI(numDigits);
    return handlerInput.responseBuilder
      .speak(piToNDigits)
      .withSimpleCard(`The first ${numDigits} digits of PI are: `, piToNDigits)
      .getResponse();
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'You can ask me to compute pi';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('', speechText)
      .getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent' ||
       handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
    .addRequestHandlers(
        LaunchRequestHandler,
        CalculateIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();
