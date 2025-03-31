import  { useContext, useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { assets } from '../assets/assets'
import moment from 'moment';
import Footer from '../components/Footer';
import { AppContext } from '../context/AppContext';
import { useAuth, useUser, } from '@clerk/clerk-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Application = () => {

  const {user} = useUser()
  const {getToken} = useAuth()
  const [isEdit,setIsEdit]=useState<boolean>(false);

  const [resume , setResume] = useState<File | null>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setResume(e.target.files[0]);
    }
  };
  const context = useContext(AppContext);
      if (!context) {
          throw new Error("AppContext must be used within an AppContextProvider");
      }
      const { backendUrl,userData,userApplications,fetchUserData,fetchUserApplications } = context;

      const updateResume = async()=>{
        if (!resume) {
          toast.error("Please select a resume before saving.");
          return;
        }
        try {
          const formData = new FormData()
          formData.append('resume',resume)

          const token = await getToken()
          const {data} = await axios.post(backendUrl+'/api/users/update-resume',
            formData,
            {headers:{Authorization:`Bearer ${token}`}}
          )
          if(data.success){
            toast.success(data.message)
            await fetchUserData()
          }else{
            toast.error(data.message)
          }
        }catch (error: any) {
          toast.error(error.response?.data?.message );
        }
        setIsEdit(false)
        setResume(null)
      }

      useEffect(()=>{
        if (user) {
          fetchUserApplications
        }
      },[user])

  return (
    <>
    <Navbar/>
    <div className='container px-4 mi-h-[65vh] 2xl:px-20 mx-auto my-10'>
      <h2 className='text-xl font-semibold'>Your Resume</h2>
      <div className='flex gap-2 mb-6 mt-3'>
        {
          isEdit || userData && userData.resume==="" 
          ?<>
          <label className='flex items-center' htmlFor="resumeUpload">
            <p className='bg-blue-100 text-blue-600 px-4 py-2 rounded-lg mr-2'>{resume? resume.name:"Select Resume"}</p>
            <input id='resumeUpload' onChange={handleFileChange} accept='application/pdf' type="file" hidden />
            <img src={assets.profile_upload_icon} alt="" />

          </label>
          <button onClick={updateResume} className='bg-green-100 border border-green-400 rounded-lg px-4 py-2'>Save</button>
          </>
          : <div className='flex gap-2'>
            <a className='bg-blue-100 text-blue-600 px-4 py-2 rounded-lg' href={userData?.resume} target='_blank'>
              Resume
            </a>
            <button onClick={()=>setIsEdit(true)} className='text-gray-500 border border-gray-300 rounded-lg px-4 py-2'>
              Edit
            </button>
          </div>
        }
      </div>
      <h2 className='text-xl font-semibold mb-4'>Job Applied</h2>
      <div className='overflow-x-auto shadow-lg rounded-lg'>
          <table className='min-w-full bg-white border border-white rounded-lg shadow-md'>
            <thead className='bg-gray-100'>
              <tr>
                <th className='py-3 px-4 text-left'>Company</th>
                <th className='py-3 px-4 text-left'>Job Title</th>
                <th className='py-3 px-4 text-left max-sm:hidden'>Location</th>
                <th className='py-3 px-4 text-left max-sm:hidden'>Date</th>
                <th className='py-3 px-4 text-left'>Status</th>
              </tr>
            </thead>
            <tbody>
              {userApplications.map((job, index) => (
                <tr key={index} className='border-b border-white hover:bg-gray-50'>
                  <td className='py-3 px-4 flex items-center gap-2'>
                    <img className='w-8 h-8 rounded-full' src={job.companyId.image} alt='' />
                    {job.companyId.name}
                  </td>
                  <td className='py-2 px-4'>{job.jobId.title}</td>
                  <td className='py-2 px-4 max-sm:hidden'>{job.jobId.location}</td>
                  <td className='py-2 px-4 max-sm:hidden'>{moment(job.date).format('ll')}</td>
                  <td className='py-2 px-4 font-medium'>
                    <span className={`${job.status === 'Accepted'? 'bg-green-100':job.status === 'Rejected'? 'bg-red-100': 'bg-blue-100' } px-4 py-1.5 rounded`}>{job.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </div>
    <Footer/>
    </>
  )
}

export default Application