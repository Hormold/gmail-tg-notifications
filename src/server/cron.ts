// Run morning summary at 8:00 AM every day
/*cron.schedule("0 8 * * *", async () => {
  try {
    await generateEmailSummary("morning", CHAT_ID!);
    console.log("Morning summary generated successfully");
  } catch (error) {
    console.error("Error generating morning summary:", error);
  }
});

// Run evening summary at 8:00 PM every day
cron.schedule("0 20 * * *", async () => {
  try {
    await generateEmailSummary("evening", CHAT_ID!);
    console.log("Evening summary generated successfully");
  } catch (error) {
    console.error("Error generating evening summary:", error);
  }
});

// Run 24-hour summary at midnight every day
cron.schedule("0 0 * * *", async () => {
  try {
    await generateEmailSummary("24hours", CHAT_ID!);
    console.log("24-hour summary generated successfully");
  } catch (error) {
    console.error("Error generating 24-hour summary:", error);
  }
});
*/
