import Job from "../models/Job.js"
import mongoose from "mongoose"

//Get all jobs
export const getJobs = async(req,res)=>{

    try {
        const jobs = await Job.find({visible:true})
        .populate({path:'companyId',select:'-password'})

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

        const job = await Job.findById(id)
            .populate({ path: "companyId", select: "-password" });


        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        res.json({ success: true, job });
    } catch (error) {
        console.error("Error in getJobById:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}