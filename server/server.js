import './config/instrument.js'
import 'dotenv/config'
import connectDB from './config/db.js'
import * as Sentry from "@sentry/node"
import connectCloudinary from './config/cloudinary.js'
import { connectRedis } from './config/redis.js'
import scheduleAwake from './utils/keepAlive.js'
import app from './app.js'

await connectDB()
await connectCloudinary()
await connectRedis()
//Port
const PORT = process.env.PORT || process.env.port || 5000

Sentry.setupExpressErrorHandler(app);

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
    
    // Initialize keep-alive cron job to prevent Render free tier sleep
    scheduleAwake();
})