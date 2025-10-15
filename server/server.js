import './config/instrument.js'
import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/db.js'
import * as Sentry from "@sentry/node"
import { clerkWebhooks } from './controllers/webhooks.js'
import companyRoutes from './routes/companyRoutes.js'
import jobRoutes from './routes/jobRoutes.js'
import userRoutes from './routes/userRoutes.js'
import connectCloudinary from './config/cloudinary.js'
import {clerkMiddleware} from '@clerk/express'
import { connectRedis } from './config/redis.js'
import scheduleAwake from './utils/keepAlive.js'
//Initialise express 
const app = express()

//Connect to database
await connectDB()
await connectCloudinary()
await connectRedis()

//Middlewares
app.use(cors())
app.use(express.json())
app.use(clerkMiddleware())

//Routes
app.get('/',(req,res)=>res.send("API Working"))

app.get("/debug-sentry",
   function mainHandler(req, res) {
    throw new Error("My first Sentry error!");
  });

app.post('/webhooks',clerkWebhooks)
app.use('/api/company',companyRoutes)
app.use('/api/jobs',jobRoutes)
app.use('/api/users',userRoutes)
//Port
const PORT =  process.env.port || 5000

Sentry.setupExpressErrorHandler(app);

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
    
    // Initialize keep-alive cron job to prevent Render free tier sleep
    scheduleAwake();
})