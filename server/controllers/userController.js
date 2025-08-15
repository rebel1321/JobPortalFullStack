import Job from "../models/Job.js"
import JobApplication from "../models/jobApplication.js"
import User from "../models/User.js"
import { v2 as cloudinary } from "cloudinary"
import { redisClient } from "../config/redis.js"

//Get user data
export const getUserData = async(req,res)=>{

    const userId = req.auth.userId
    try {
        // Check if user data is cached
        const cacheKey = `user_${userId}`;
        const cachedUser = await redisClient.get(cacheKey);
        
        if (cachedUser) {
            return res.json({ success: true, user: JSON.parse(cachedUser) });
        }

        const user =await User.findById(userId)
        if(!user){
            return res.json({
                success:false,
                message:"User not found"
            })
        }

        // Cache the user data for 15 minutes (900 seconds)
        await redisClient.setEx(cacheKey, 900, JSON.stringify(user));

        res.json({success:true,user})
    } catch (error) {
        res.json({
            success:false,
            message:error.message
        })
    }
}

//Apply for job
export const applyForJob =async (req,res)=>{
    const {jobId} =req.body
    const userId=req.auth.userId

    try {
        const isAlreadyApplied = await JobApplication.findOne({jobId,userId})

        if(isAlreadyApplied){
            return res.json({success:false,message:'Already Applied'})
        }

        const jobData = await Job.findById(jobId)
        if(!jobData){
            return res.json({success:false,message:"Job not found"})
        }

        await JobApplication.create({
            companyId: jobData.companyId,
            userId,
            jobId,
            date:Date.now()
        })

        // Invalidate relevant caches since new application was created
        await redisClient.del(`company_applicants_${jobData.companyId}`);
        await redisClient.del(`company_jobs_${jobData.companyId}`);
        await redisClient.del(`user_applications_${userId}`);

        res.json({
            success:true,
            message:"Applied successfully"
        })

    } catch (error) {
        res.json({
            success:false,
            message:error.message
        })
    }
}

//Get user applied application
export const getUserJobApplications =async (req,res)=>{
    try {
        
        const userId = req.auth.userId

        // Check if user applications are cached
        const cacheKey = `user_applications_${userId}`;
        const cachedApplications = await redisClient.get(cacheKey);
        
        if (cachedApplications) {
            return res.json({ success: true, applications: JSON.parse(cachedApplications) });
        }

        const applications = await JobApplication.find({userId})
        .populate('companyId','name email image')
        .populate('jobId','title description location category level salary')
        .exec()

        if(!applications){
            return res.json({success : false,message:'No job applications found'})
        }

        // Cache the applications for 10 minutes (600 seconds)
        await redisClient.setEx(cacheKey, 600, JSON.stringify(applications));

        return res.json({success:true,applications})
    } catch (error) {
        res.json({
            success:false,
            message:error.message
        })
    }
}

//update user profile (resume)
export const updateUserResume= async (req,res)=>{
    try {
        
        const userId =req.auth.userId
        const resumeFile = req.file
        const userData = await User.findById(userId)

        if(resumeFile){
            const resumeUpload = await cloudinary.uploader.upload(resumeFile.path)
            userData.resume=resumeUpload.secure_url
        }

        await userData.save()

        // Invalidate user cache since profile was updated
        await redisClient.del(`user_${userId}`);

        return res.json({success:true,message:"Resume updated"})
    } catch (error) {
        res.json({
            success:false,
            message:error.message
        })
    }
}