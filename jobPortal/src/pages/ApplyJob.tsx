import { useContext, useEffect, useState } from 'react'
import {  useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext';
import { assets, } from '../assets/assets';
import Loading from '../components/Loading';
import Navbar from '../components/Navbar';
import moment from 'moment';
import JobCard from '../components/JobCard';
import Footer from '../components/Footer';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '@clerk/clerk-react';

interface Company {
  _id: string;
  name: string;
  email: string;
  image: string;  // Image resolves to a string (URL)
}

interface Jobs {
  _id: string;
  title: string;
  location: string;
  level: "Beginner Level" | "Intermediate Level" | "Senior Level";
  companyId: Company;
  description: string;
  salary: number;
  date: number;
  category: string;
  applicants:number;
  visible:boolean
}

const ApplyJob = () => {

 
  const { id } = useParams<{ id: string }>();

  const {getToken} = useAuth()

  const navigate = useNavigate()
  
  const [JobData,setJobData] = useState<Jobs | null>(null);


  const [isAlreadyApplied,setIsAlreadyApplied] = useState<Boolean>(false)
  const context = useContext(AppContext);
    if (!context) {
        throw new Error("AppContext must be used within an AppContextProvider");
    }
    const { backendUrl,jobs,userData,userApplications,fetchUserApplications} = context;
  const fetchJob = async ()=>{
    try {
      const {data} = await axios.get(backendUrl+`/api/jobs/${id}`)
    if(data.success){
      setJobData(data.job)
    }else{
      toast.error(data.message)
    }
    } catch (error: any) {
      toast.error(error.response?.data?.message);
    }
  }

  //Function to applyHandler
  const applyHandler = async () =>{
    try{
      if(!userData){
        return toast.error('Login to apply for jobs')
      }
      if(!userData.resume){
        navigate('/applications')
        return toast.error('Upload resume')
      }

      const token = await getToken()

      const {data} = await axios.post(backendUrl+'/api/users/apply',
        {jobId:JobData?._id},
        {headers:{Authorization:`Bearer ${token}`}}
      )

      if(data.success){
        toast.success(data.message)
        fetchUserApplications()
      }else{
        toast.error(data.message)
      }

    } catch (error: any) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  }

  const checkAlreadyApplied = () =>{

  const hasApplied = userApplications.some(item => 
    item.jobId && item.jobId._id === JobData?._id
  );
  
  console.log("Has Applied:", hasApplied); // Debugging output
  setIsAlreadyApplied(hasApplied);
  }



  useEffect(() => {
    fetchJob()
  }, [id]);

  useEffect(()=>{
    if( JobData && userApplications.length>0 ){
      checkAlreadyApplied()
    }
  },[JobData,userApplications,id])

  const formatSalary = (salary: number) => {
    if (salary >= 1_000_000) return (salary / 1_000_000).toFixed(1) + "M";
    if (salary >= 1_000) return (salary / 1_000).toFixed(1) + "K";
    return salary.toString();
  };
  return JobData ?(
    <>
      <Navbar/>
      <div className='min-h-screen flex flex-col py-10 container px-4 2xl:px-20 mx-auto'>
        <div className='bg-white text-black rounded-lg w-full'>
          <div className='flex justify-center md:justify-between flex-wrap gap-8 px-14 py-20 mb-6 bg-sky-50 border border-sky-400 rounded-xl'>
            <div className='flex flex-col md:flex-row items-center'>
              <img className='h-24 bg-white rounded-lg p-4 mr-4 max-md:mb-4 border' src={JobData.companyId.image} alt="" />
              <div className='text-center md:text-left text-neutral-700'>
                <h1 className='text-2xl sm:text-4xl font-medium'>{JobData.title}</h1>
                <div className='flex flex-row flex-wrap max-md:justify-centergap-y-2 gap-6 items-center text-gray-600 mt-2'>
                  <span className='flex items-center gap-1'>
                    <img src={assets.suitcase_icon} alt="" />
                    {JobData.companyId.name}
                  </span>
                  <span className='flex items-center gap-1'>
                    <img src={assets.location_icon} alt="" />
                    {JobData.location}
                  </span>
                  <span className='flex items-center gap-1'>
                    <img src={assets.person_icon} alt="" />
                    {JobData.level}
                  </span>
                  <span className='flex items-center gap-1'>
                    <img src={assets.money_icon} alt="" />
                    CTC: {formatSalary(JobData.salary)}
                  </span>
                </div>
              </div>
            </div>
            <div className='flex flex-col justify-center text-end text-sm max-md:mx-auto max-md:text-center'>
              <button onClick={applyHandler} className='bg-blue-600 p-2.5 px-10 text-white rounded '>{isAlreadyApplied?'Already applied':'Apply Now'}</button>
              <p className='mt-1 text-gray-600'>Posted {moment(JobData.date).fromNow()}</p>
            </div>
          </div>
          <div className='flex flex-col lg:flex-row justify-between items-start'>
            <div className='w-full lg:w-2/3'>
              <h2 className='font-bold text-3xl mb-4'>Job Description</h2>
              <div className='rich-text' dangerouslySetInnerHTML={{ __html: JobData.description }}></div>
              <button onClick={applyHandler} className='bg-blue-600 p-2.5 px-10 text-white rounded mt-10'>{isAlreadyApplied?'Already applied':'Apply Now'}</button>
            </div>
            {/* Right section more job */}
            <div className='w-full lg:w-1/3 mt-8  lg:mt-0 lg:ml-8 space-y-5'>
              <h2>More jobs from {JobData.companyId.name}</h2>
              {jobs.filter(job=> job._id !== JobData._id && job.companyId._id === JobData.companyId._id)
              .filter(job=>{
                //Set of applied jobs
                const appliedJobsIds = new Set(userApplications.map(app=>app.jobId && app.jobId._id))
                // Return true if the user hyas not already applied for this job
                return !appliedJobsIds.has(job._id)
              })
              .slice(0,4)
              .map((job, index) => <JobCard job={job} key={index} />)
}
            </div>
          </div>

        </div>
      </div>
      <Footer/>
    </>
  ):(
    <Loading/>
  )
}

export default ApplyJob