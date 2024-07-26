# Gmail Notification Telegram Bot

This project implements a simple Telegram bot that provides real-time notifications for new Gmail messages across multiple accounts per user. It's designed to help users efficiently manage their email inboxes without constantly checking multiple Gmail accounts.

## 🚀 Features

- **🔗 Multi-account Support**: Monitor multiple Gmail accounts for each user.
- **⚡ Real-time Notifications**: Receive instant notifications on Telegram when new emails arrive.
- **🧠 AI-powered Email Analysis**: Utilizes OpenAI's GPT-4 to categorize emails, summarize content, and suggest action steps.
- **🎚️ Importance Rating**: Automatically rates email importance on a scale of 0-5.
- **📝 Message Preview**: Get a concise preview of the email content in the Telegram notification.
- **🎯 Quick Actions**: Perform basic actions like blacklisting senders or removing notifications directly from Telegram.
- **🔗 Smart Link Handling**: Extracts and provides quick access to important URLs in emails.
- **🚫 Spam Protection**: Automatically filters out spam and low-importance emails.
- **↩️ Unsubscribe Option**: Easily unsubscribe from newsletters directly from the notification.
- **📊 Daily Summary**: Receive a daily summary of email activity and important messages.
- **🔧 Easy Setup**: Simple setup process with detailed instructions

## 🛠️ Technical Stack

- **Backend**: Node.js with TypeScript
- **AI Integration**: OpenAI API (GPT-4)
- **Email Integration**: Gmail API (OAuth2 for Gmail accounts)
- **Bot Framework**: Telegraf (Telegram Bot API)
- **Database**: MongoDB
- **Deployment**: Google Cloud Functions, Heroku, or any Node.js hosting service

## 🧠 How It Works

1. **User Registration**: Users register their Gmail accounts with the bot through a secure OAuth2 process.
2. **Email Monitoring**: The bot uses Gmail's API to watch for new emails in registered accounts.
3. **Push Notifications**: When a new email arrives, Google sends a push notification to the bot's endpoint.
4. **Email Retrieval**: The bot fetches the new email details using the Gmail API.
5. **AI Analysis**: The email is analyzed using OpenAI's GPT-4 model to categorize, summarize, and rate its importance.
6. **Notification Creation**: Based on the AI analysis, a Telegram message is crafted with relevant information and action buttons.
7. **Message Delivery**: The notification is sent to the user's designated Telegram chat(s).
8. **User Interaction**: Users can interact with the notification to perform quick actions or view more details.
9. **Daily Summary**: Users receive a daily summary of email activity and important messages at 8AM and 8PM local time.

## Setup Instructions

### 1. Google Cloud Platform Setup

1. Create a new project in the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the Gmail API for your project:
   - Go to the [API Library](https://console.cloud.google.com/apis/library).
   - Search for "Gmail API" and enable it.
3. Create credentials:
   - Go to the [Credentials page](https://console.cloud.google.com/apis/credentials).
   - Click "Create Credentials" and select "OAuth client ID".
   - Choose "Web application" as the application type.
   - Add authorized redirect URIs (include your bot's callback URL).
   - Download the client configuration file (json).

4. Add JSON credentials to your project:
   - Open .env
   - Add the following environment variables:
	 ```
	 GOOGLE_CREDENTIALS="{"installed":{"client_id":"....","project_id":"....","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_secret":"....","redirect_uris":["https://..."],"javascript_origins":["https://..."]}}"
	 ```

### 2. Gmail Push Notifications Setup

1. Create a Pub/Sub topic:
   - Go to the [Pub/Sub topics page](https://console.cloud.google.com/cloudpubsub/topic/list).
   - Click "Create Topic".
   - Name your topic (e.g., "gmail-notifications").
   - Click "Create".

2. Grant Gmail permission to publish to the Pub/Sub topic:
   - On the topic details page, click "Add Principal" in the Permissions tab.
   - In the "New Principals" box, enter: `gmail-api-push@system.gserviceaccount.com`
   - In the "Assign Roles" section, search for and select: "Pub/Sub Publisher"
   - Click "Save".

3. Update your `.env` file with the Pub/Sub topic name:
   ```
   PUB_SUB_TOPIC=projects/your-project-id/topics/gmail-notifications
   ```
   Replace `your-project-id` with your Google Cloud project ID and `gmail-notifications` with your topic name if different.

4. Set up a Cloud Function to handle Gmail push notifications:
   - Go to the [Cloud Functions page](https://console.cloud.google.com/functions).
   - Click "Create Function".
   - Set the trigger to Cloud Pub/Sub and select your created topic.
   - Use the following code for the function:

   ```javascript
   const functions = require('@google-cloud/functions-framework');
   functions.cloudEvent('helloPubSub', cloudEvent => {
      fetch("https://<YOUR_PRIVATE_HOST>/ggle", {
         method: "POST",
         body: JSON.stringify(cloudEvent.data)
      })
   });

   ```

5. Replace `YOUR_PRIVATE_HOST` with your bot's API endpoint.
6. Deploy the function and note the function's URL.

### 3. Bot Setup

1. Clone this repository:
   ```
   git clone https://github.com/hormold/gmail-notification-bot.git
   cd gmail-notification-bot
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the project root with the following content:
   ```
   BOT_TOKEN=your_telegram_bot_token
   SERVER_PATH=your_endpoint_domain!.com
   MONGODB_URI=your_mongodb_connection_string
   OPENAI_API_KEY=your_openai_api_key
   GOOGLE_CREDENTIALS={"installed":{"client_id":"....","project_id":"....","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_secret":"....","redirect_uris":["https://..."],"javascript_origins":["https://..."]}}
   PUB_SUB_TOPIC=projects/your-project-id/topics/gmail-notifications
   ```

   Replace the placeholders with your actual credentials and configuration.

4. Set up the database:
   - Create a MongoDB database and note the connection string.
   - Update the `MONGODB_URI` in the `.env` file.

5. Start the bot:
   ```
   npm start
   ```

## Usage

1. Start a chat with your Telegram bot.
2. Use the `/connect` command to link a Gmail account and then `/new` to receive specific links to connect your Gmail account.
3. Follow the prompts to authorize the bot to access your Gmail.
4. The bot will now notify you of new emails in the connected account(s).

## Additional Commands
- `/remove_account`: Remove a connected Gmail account.
- `/help`: Display available commands and usage instructions.

## Troubleshooting

- If you're not receiving notifications, ensure that the Gmail Push API is properly set up and the Cloud Function is deployed correctly.
- Check the bot's logs for any error messages or issues with Gmail API authentication.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
