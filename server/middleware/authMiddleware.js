import jwt from 'jsonwebtoken'
import Company from '../models/Company.js'
import { redisClient } from '../config/redis.js'

export const protectCompany = async (req,res,next)=>{
    const token = req.headers.token
    if (!token){
        return res.json({success:false,message:"Not authorised,Login again"})
    }

    try {
        const decoded = jwt.verify(token,process.env.JWT_SECRET)
        
        // Check if company data is cached in Redis
        const cacheKey = `auth_company_${decoded.id}`;
        const cachedCompany = await redisClient.get(cacheKey);
        
        if (cachedCompany) {
            req.company = JSON.parse(cachedCompany);
            return next();
        }

        // If not cached, fetch from database
        const company = await Company.findById(decoded.id).select('-password');
        
        if (!company) {
            return res.json({success:false,message:"Company not found"});
        }

        // Cache the company data for 10 minutes (600 seconds)
        await redisClient.setEx(cacheKey, 600, JSON.stringify(company));
        
        req.company = company;
        next();
    } 

    catch (error) {
        res.json({success:false,message:error.message})
    }
}