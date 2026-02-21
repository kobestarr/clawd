// Channel configuration
// Populated from environment variables at runtime

module.exports = {
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
    botToken: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    briefingsChannel: process.env.SLACK_BRIEFINGS_CHANNEL,
    chatChannel: process.env.SLACK_CHAT_CHANNEL,
  },
  whatsapp: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: process.env.WHATSAPP_TO,
  },
};
