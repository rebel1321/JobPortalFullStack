import { createContext, ReactNode, useEffect, useState } from "react";
import { Job, jobsData } from "../assets/assets";

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

interface AppContextType {
  searchFilter: SearchFilterType;
  setSearchFilter: React.Dispatch<React.SetStateAction<SearchFilterType>>;
  isSearched: boolean;
  setIsSearched: React.Dispatch<React.SetStateAction<boolean>>;
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  showRecruiterLogin: boolean;
  setShowRecruiterLogin: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppContextProviderProps {
  children: ReactNode;
}

export const AppContextProvider: React.FC<AppContextProviderProps> = ({ children }) => {
  const [searchFilter, setSearchFilter] = useState<SearchFilterType>({
    title: '',
    location: '',
  });

  const [isSearched, setIsSearched] = useState<boolean>(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showRecruiterLogin,setShowRecruiterLogin] = useState<boolean>(false)
  // Function to fetch jobs
  useEffect(() => {
    setJobs(jobsData);
  }, []);


  const value: AppContextType = {
    searchFilter,
    setSearchFilter,
    isSearched,
    setIsSearched,
    jobs,
    setJobs,
    showRecruiterLogin,setShowRecruiterLogin
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
