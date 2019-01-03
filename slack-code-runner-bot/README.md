# JavaScript Slack Bot

A simple bot which allows users to execute short-lived Javascript code snippets directly in Slack.

## Getting Started

1. Create a new app on Slack or have your administrator do it for you.
  
    https://api.slack.com/apps?new_app=1

1. Add a bot user to the newly created app.

    ![add_bot_user](https://raw.githubusercontent.com/binaris/functions-examples/feature-slack-bot/slack-code-runner-bot/assets/add_bot_user.png)

1. Navigate to the `OAuth & Permissions` tab and add a Permissions Scope. To keep things simple for this example `channel:write` is used. This may differ depending on your own security considerations. You can find a list of all possible scopes and their implications [here](https://api.slack.com/methods)

    ![set_permissions](https://raw.githubusercontent.com/binaris/functions-examples/feature-slack-bot/slack-code-runner-bot/assets/set_permissions.png)

1. Install the app to your Slack workspace by using the `Install App to Workspace` button located at the top of the same page you just used to add Permission Scopes.

    ![install_app](https://raw.githubusercontent.com/binaris/functions-examples/feature-slack-bot/slack-code-runner-bot/assets/install_app.png)
    
1. Obtain the `Bot User OAuth Access Token` from the Slack webUI (inside the red box)
   and export it.
   
   https://api.slack.com/apps/<APP_ID>/oauth?


   ![token](https://raw.githubusercontent.com/binaris/functions-examples/feature-slack-bot/slack-code-runner-bot/assets/token.png)
   
      `export SLACK_BOT_TOKEN=<YOUR_TOKEN_HERE>`

1. Deploy the Binaris function `bn deploy public_slackCodeRunner`.
1. Copy the URL printed by `bn deploy` and enter it as the `Request URL` on the "Event Subscriptions" page in the Slack webUI. This will send your function-bot a challenge.

   https://api.slack.com/apps/<APP_ID>/event-subscriptions?

   ![challenge_test](https://raw.githubusercontent.com/binaris/functions-examples/feature-slack-bot/slack-code-runner-bot/assets/challenge_test.png)
1. Finally, on the same "Event Subscriptions" page scroll slightly down and "Add Bot User Event". There are many options here but if you want your bot to respond in all public channels (that it's been invited to) use `message.channels`.
   ![bot_events](https://raw.githubusercontent.com/binaris/functions-examples/feature-slack-bot/slack-code-runner-bot/assets/bot_events.png)
1. You may need to reinstall your slack application to take advantage of the changes.

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
