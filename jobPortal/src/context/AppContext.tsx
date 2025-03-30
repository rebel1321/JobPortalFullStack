import { createContext, ReactNode, useEffect, useState } from "react";
import { Job,  } from "../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth, useUser } from "@clerk/clerk-react";

interface Company {
  _id: string;
  name: string;
  email: string;
  image: string;
}
interface SearchFilterType {
  title: string;
  location: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  resume: string;
  image: string;
}

// Job Application Interface
interface JobApplication {
  userId: string;
  companyId: Company;
  jobId: Job;
  status: string;
  date: number;
}

interface AppContextType {
  searchFilter: SearchFilterType;
  setSearchFilter: React.Dispatch<React.SetStateAction<SearchFilterType>>;
  isSearched: boolean;
  setIsSearched: React.Dispatch<React.SetStateAction<boolean>>;
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  showRecruiterLogin: boolean;
  setShowRecruiterLogin: React.Dispatch<React.SetStateAction<boolean>>;
  companyToken: string | null;
  setCompanyToken: React.Dispatch<React.SetStateAction<string | null>>;
  companyData: Company | null;
  setCompanyData: React.Dispatch<React.SetStateAction<Company | null>>;
  backendUrl: string;
  userData: User | null;
  setUserData: React.Dispatch<React.SetStateAction<User|null>>;
  userApplications: JobApplication[];
  setUserApplications: React.Dispatch<React.SetStateAction<JobApplication[]>>;
  fetchUserData: () => Promise<void>;
  fetchUserApplications: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppContextProviderProps {
  children: ReactNode;
}

export const AppContextProvider: React.FC<AppContextProviderProps> = ({ children }) => {
  const backendUrl: string = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"; 
  const {user} = useUser()
  const {getToken} = useAuth()

  const [searchFilter, setSearchFilter] = useState<SearchFilterType>({
    title: '',
    location: '',
  });

  const [isSearched, setIsSearched] = useState<boolean>(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showRecruiterLogin,setShowRecruiterLogin] = useState<boolean>(false)

  const [companyToken, setCompanyToken] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState<Company | null>(null);

  const [userData, setUserData] = useState<User | null>(null);
  const [userApplications, setUserApplications] = useState<JobApplication[]>([]);
  // Function to fetch COMPANY DATA
  const fetchCompanyData = async () =>{
    if (!companyToken) return;
    try {
      const {data} = await axios.get(backendUrl+'/api/company/company',{headers:{token:companyToken}})

      if(data.success){
        setCompanyData(data.company)
        console.log(data);
        
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to fetch company data!");
      } else {
        toast.error("An unexpected error occurred while fetching company data.");
      }
    }
  }

  //Function to fetch jobs
  const fetchJobs =async()=>{
    try {
      const {data} = await axios.get(backendUrl+'/api/jobs')
      if(data.success){
        setJobs(data.jobs)
      console.log(data.jobs);
      }else{
        toast.error(data.message)
      }
      
    }catch (error: any) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  }

  //Function to fetch user data
  const fetchUserData = async () =>{
    try {
      const token =await getToken()

      const {data} = await axios.get(backendUrl+'/api/users/user',
        {headers:{Authorization:`Bearer ${token}`}}
      )
      if(data.success){
        setUserData(data.user)
      }else{
        toast.error(data.message)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  }
//Function to fetch user's applied application data
  const fetchUserApplications = async()=>{
    try {
      const token = await getToken()
      const {data}= await axios.get(backendUrl+'/api/users/applications',
        {headers:{Authorization:`Bearer ${token}`}}
      )
      if(data.success){
        setUserApplications(data.applications)
      }else{
        toast.error(data.message)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  }
  useEffect(() => {
    fetchJobs();

    const storedCompanyToken = localStorage.getItem('companyToken')
    if (storedCompanyToken) {
      setCompanyToken(storedCompanyToken)
      
    }
  }, []);
  useEffect(()=>{
    if(companyToken){
      fetchCompanyData()
    }
  },[companyToken])

  useEffect(()=>{
    if (user) {
      fetchUserData()
      fetchUserApplications()
    }
  },[user])

  const value: AppContextType = {
    searchFilter,
    setSearchFilter,
    isSearched,
    setIsSearched,
    jobs,
    setJobs,
    showRecruiterLogin,setShowRecruiterLogin,
    companyToken,
    setCompanyToken,
    companyData,
    setCompanyData,
    backendUrl,
    userData,
    setUserData,
    userApplications,
    setUserApplications,
    fetchUserData,
    fetchUserApplications
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
