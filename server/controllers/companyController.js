import Company from "../models/Company.js"
import bcrypt from 'bcrypt'
import {v2 as cloudinary} from 'cloudinary'
import generateToken from "../utils/generateToken.js"
import Job from "../models/Job.js"
import JobApplication from "../models/jobApplication.js"
import { redisClient } from "../config/redis.js"

//Register a new Company

export const registerCompany = async(req,res)=>{
    const {name,email,password} =req.body
    const imageFile = req.file;

    if (!name || !email || !password || !imageFile) {
        return res.json({success:false,message:"Missing Details"})
    }

    try {
        const companyExists = await Company.findOne({email})
        if(companyExists){
            return res.json({success:false,message:"Company already registered"})
        }

        const salt = await bcrypt.genSalt(10)

        const hashPassword =await bcrypt.hash(password,salt)

        const imageUpload = await cloudinary.uploader.upload(imageFile.path)

        const company = await Company.create({
            name,
            email,
            password: hashPassword,
            image: imageUpload.secure_url
        })

        // No need to cache here since this is a new company
        // Auth cache will be created on first authenticated request

        res.json({
            success:true,
            company :{
                _id: company._id,
                name: company.name,
                email: company.email,
                image: company.image,


            },
            token:generateToken(company._id)
        })
    } catch (error) {
        res.json({
            success:false,
            message:error.message
        })
        
    }

}

//Compant login
export const loginCompany = async(req,res)=>{

    const {email,password} =req.body

    try {
        const company =await Company.findOne({email})
        if (!company) {
            return res.json({
                success: false,
                message: "Invalid email or password"
            });
        }
        
        if (await bcrypt.compare(password,company.password)){
            res.json({
                success: true,
                company: {
                    _id: company._id,
                name: company.name,
                email: company.email,
                image: company.image,
                },
                token: generateToken(company._id)
            })
        }
        else{
            res.json({
                success:false,
                message:"Invalid email or password"
            })
        }
    } catch (error) {
        res.json({success:false,message:error.message})
    }
}
 //Get company data 
export const getCompanyData = async(req,res)=>{
    try {
        const company = req.company
        const companyId = company._id

        // Check if company data is cached
        const cacheKey = `company_${companyId}`;
        const cachedCompany = await redisClient.get(cacheKey);
        
        if (cachedCompany) {
            return res.json({ success: true, company: JSON.parse(cachedCompany) });
        }

        // Cache the company data for 30 minutes (1800 seconds)
        await redisClient.setEx(cacheKey, 1800, JSON.stringify(company));

        res.json({success:true,company})
    } catch (error) {
        res.json({success:false,message:error.message})
    }
}
//Post a new job
export const postJob = async(req,res)=>{
    const {title,description,location,salary,level,category} =req.body

    const companyId =req.company._id

    try {
        const newJob = new Job({
            title,
            description,
            location,
            salary,
            companyId,
            date:Date.now(),
            level,
            category
        })

        await newJob.save()

        // Invalidate relevant caches since a new job was added
        await redisClient.del('all_jobs');
        await redisClient.del(`company_jobs_${companyId}`);

        res.json({success:true,newJob})
    } catch (error) {
        res.json({success:false,message:error.message})
    }
}

//Get company Job applicants
export const getCompanyJobApplicants =async(req,res)=>{
        try {
            const companyId = req.company._id

            // Check if company applicants are cached
            const cacheKey = `company_applicants_${companyId}`;
            const cachedApplicants = await redisClient.get(cacheKey);
            
            if (cachedApplicants) {
                return res.json({ success: true, applications: JSON.parse(cachedApplicants) });
            }

            //Find job applications for the user  and populate related data
            const applications = await JobApplication.find({companyId})
            .populate('userId','name image resume')
            .populate('jobId','title location category level salary')
            .exec()

            // Cache the applications for 5 minutes (300 seconds)
            await redisClient.setEx(cacheKey, 300, JSON.stringify(applications));

            return res.json({success:true,applications})
        } catch (error) {
            res.json({success:false,message:error.message})
        }
}

//Get company posted jobs
export const getCompanyPostedJobs = async(req,res)=>{

    try {
        const companyId = req.company._id

        // Check if company posted jobs are cached
        const cacheKey = `company_jobs_${companyId}`;
        const cachedJobs = await redisClient.get(cacheKey);
        
        if (cachedJobs) {
            return res.json({ success: true, jobsData: JSON.parse(cachedJobs) });
        }

        const jobs =await Job.find({companyId})

        // Adding no of applicants info in data
        const jobsData = await Promise.all(jobs.map(async (job)=>{
            const applicants = await JobApplication.find({jobId:job._id});
            return {...job.toObject(),applicants:applicants.length}
        }))

        // Cache the jobs data for 10 minutes (600 seconds)
        await redisClient.setEx(cacheKey, 600, JSON.stringify(jobsData));

        res.json({success:true,jobsData})

    } catch (error) {
        res.json({success:false,message:error.message})

    }
}
//Change job application status
export const ChangeJobApplicationStatus = async(req,res)=>{
    try {
        const {id,status}=req.body

        //Find Job Application Status
        const application = await JobApplication.findOneAndUpdate({_id: id},{status}, {new: true})
        .populate('userId', '_id')
        .populate('jobId', 'companyId');

        if (application) {
            // Invalidate relevant caches
            const companyId = application.jobId.companyId;
            const userId = application.userId._id;
            
            await redisClient.del(`company_applicants_${companyId}`);
            await redisClient.del(`company_jobs_${companyId}`);
            await redisClient.del(`user_applications_${userId}`);
        }

        res.json({success:true,message:'Status Changed'})
    } catch (error) {
        res.json({success:false,message:error.message})

    }
    
    
}

//Change job visiblity
export const changeVisibility =async(req,res)=>{

    try {
        const {id} = req.body
        const companyId =req.company._id

        const job = await Job.findById(id)

        if (companyId.toString() === job.companyId.toString()) {
            job.visible =!job.visible
        }
        await job.save()

        // Invalidate caches since job visibility changed
        await redisClient.del('all_jobs');
        await redisClient.del(`job_${id}`);
        await redisClient.del(`company_jobs_${companyId}`);

        res.json({success:true,job})
    } catch (error) {
        res.json({success:false,message:error.message})
    }
}