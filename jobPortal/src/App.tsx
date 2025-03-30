import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import ApplyJob from './pages/ApplyJob'
import Application from './pages/Application'
import RecruiterLogin from './components/RecruiterLogin'
import { useContext } from 'react'
import { AppContext } from './context/AppContext'
import Dashboard from './pages/Dashboard'
import AddJob from './pages/AddJob'
import ManageJobs from './pages/ManageJobs'
import ViewApplication from './pages/ViewApplication'
import 'quill/dist/quill.snow.css' 
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const App = () => {
  const { showRecruiterLogin,companyToken } = useContext(AppContext) ?? {};
  return (
    <div>
      { showRecruiterLogin && <RecruiterLogin/>}
      <ToastContainer/>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/apply-job/:id' element={<ApplyJob/>}/>
        <Route path='/applications' element={<Application/>}/>
        <Route path='/dashboard' element={<Dashboard/>}>
        {companyToken?<>
          <Route path='add-job' element={<AddJob/>}/>
          <Route path='manage-job' element={<ManageJobs/>}/>
          <Route path='view-applications' element={<ViewApplication/>}/>
        </>:null}
          
        </Route>
      </Routes>
    </div>
  )
}

export default App