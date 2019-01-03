# JavaScript Slack Bot

A simple bot which allows users to execute short-lived Javascript code snippets directly in Slack.

## Getting Started

1. Create a new app on Slack or have your administrator do it for you
  
    https://api.slack.com/apps?new_app=1
    
2. Obtain the `Bot User OAuth Access Token` from the Slack webUI (inside the red box)
   and export it 
   
   https://api.slack.com/apps/<APP_ID>/oauth?


   ![token](https://raw.githubusercontent.com/binaris/functions-examples/feature-slack-bot/slack-code-runner-bot/assets/token.png)
   
      `export SLACK_BOT_TOKEN=<YOUR_TOKEN_HERE>`

3. Deploy the Binaris function `bn deploy public_slackCodeRunner`
4. Copy the URL printed by `bn deploy` and enter it as the `Request URL` on the "Event Subscriptions" page in the Slack webUI. This will send your function-bot a challenge.

   https://api.slack.com/apps/<APP_ID>/event-subscriptions?

   ![challenge](https://raw.githubusercontent.com/binaris/functions-examples/feature-slack-bot/slack-code-runner-bot/assets/challenge.png)
5. Finally, on the same "Event Subscriptions" page scroll slightly down and "Add Bot User Event". There are many options here but if you want your bot to respond in all public channels (that it's been invited to) use `message.channels`
   ![bot_events](https://raw.githubusercontent.com/binaris/functions-examples/feature-slack-bot/slack-code-runner-bot/assets/bot_events.png)
6. You may need to reinstall your slack application to take advantage of the changes

    https://api.slack.com/apps/<APP_ID>/install-on-team?


   ![reinstall](https://raw.githubusercontent.com/binaris/functions-examples/feature-slack-bot/slack-code-runner-bot/assets/reinstall.png)

### Running some code

You will first need to invite your bot to any channels you plan to interact with it on.

   ![add_to_channel](https://raw.githubusercontent.com/binaris/functions-examples/feature-slack-bot/slack-code-runner-bot/assets/add_to_channel.png)


You should now be able to test your function-bot in action by sending a message such as

````
@provemewrong
```
const a = 5;
const b = 10;
return a + b;
```
````

*Expected Response*

`Output`

```
15
```

### Isolation model

In addition to the per function isolation that Binaris provides, this bot uses the [VM2](https://github.com/patriksimek/vm2) module which offers further code execution isolation. By default, `require` and other OS based NodeJS calls are disabled.
