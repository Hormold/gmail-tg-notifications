# Gmail Notification Telegram Bot

This project is a Telegram bot that provides notifications for new Gmail messages across multiple accounts per user.

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
   const fetch = require('node-fetch');

   exports.gmailPushHandler = async (message, context) => {
     const data = JSON.parse(Buffer.from(message.data, 'base64').toString());
     
     try {
       await fetch('YOUR_BOT_ENDPOINT/googlePushEndpoint', {
         method: 'POST',
         body: JSON.stringify({ data: { message: { data: message.data } } }),
         headers: { 'Content-Type': 'application/json' },
       });
     } catch (error) {
       console.error('Error forwarding push notification:', error);
       throw new Error('Error processing push notification');
     }
   };
   ```

5. Replace `YOUR_BOT_ENDPOINT` with your bot's API endpoint.
6. Deploy the function and note the function's URL.

### 3. Bot Setup

1. Clone this repository:
   ```
   git clone https://github.com/your-repo/gmail-notification-bot.git
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
2. Use the `/connect_gmail` command to link a Gmail account.
3. Follow the prompts to authorize the bot to access your Gmail.
4. The bot will now notify you of new emails in the connected account(s).

## Additional Commands

- `/list_accounts`: List all connected Gmail accounts.
- `/remove_account`: Remove a connected Gmail account.
- `/help`: Display available commands and usage instructions.

## Troubleshooting

- If you're not receiving notifications, ensure that the Gmail Push API is properly set up and the Cloud Function is deployed correctly.
- Check the bot's logs for any error messages or issues with Gmail API authentication.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
