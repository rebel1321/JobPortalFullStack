import cron from 'node-cron';

const scheduleAwake = () => {
  // Keep server awake by pinging itself every 10 minutes (Render free tier sleeps after 15 minutes)
  cron.schedule('*/10 * * * *', async () => {
    try {
      const serverUrl = process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000';
      console.log(`🏓 Keep-alive ping to ${serverUrl}`);
      await fetch(`${serverUrl}/`);
    } catch (error) {
      console.log('Keep-alive ping failed:', error.message);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });
  
  console.log('✓ Keep-alive ping scheduled: Every 10 minutes to prevent server sleep');
};

export default scheduleAwake;
