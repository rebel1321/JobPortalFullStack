import Job from "../models/Job.js"
import mongoose from "mongoose"
import { redisClient } from "../config/redis.js"

//Get all jobs
export const getJobs = async(req,res)=>{

    try {
        // Check if jobs are cached in Redis
        const cachedJobs = await redisClient.get('all_jobs');
        
        if (cachedJobs) {
            return res.json({ success: true, jobs: JSON.parse(cachedJobs) });
        }

        // If not cached, fetch from database
        const jobs = await Job.find({visible:true})
        .populate({path:'companyId',select:'-password'})

        // Cache the jobs in Redis for 5 minutes (300 seconds)
        await redisClient.setEx('all_jobs', 300, JSON.stringify(jobs));

        res.json({success:true,jobs})
    } catch (error) {
        res.json({success:false,message:error.message})
    }
}

//Get a single job by ID
export const getJobById = async(req,res)=>{
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.log("Invalid Job ID:", id);
            return res.status(400).json({ success: false, message: "Invalid job ID format" });
        }

        // Check if job is cached in Redis
        const cacheKey = `job_${id}`;
        const cachedJob = await redisClient.get(cacheKey);
        
        if (cachedJob) {
            return res.json({ success: true, job: JSON.parse(cachedJob) });
        }

        // If not cached, fetch from database
        const job = await Job.findById(id)
            .populate({ path: "companyId", select: "-password" });

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        // Cache the job in Redis for 10 minutes (600 seconds)
        await redisClient.setEx(cacheKey, 600, JSON.stringify(job));

        res.json({ success: true, job });
    } catch (error) {
        console.error("Error in getJobById:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}