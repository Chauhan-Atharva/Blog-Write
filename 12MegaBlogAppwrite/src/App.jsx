import { useState, useEffect, } from 'react'
import {useDispatch} from 'react-redux'
import authservice from './api/auth';
import {login,logout} from "./store/authSlice.js" 
import { Header,Footer } from './components/index.js';
import { Outlet } from 'react-router-dom';
import './App.css'

function App() {
  // console.log(process.env.REACT_APP_APPWRITE_URL);//this is using create react app 
  // console.log(import.meta.env.VITE_APPWRITE_URL);
  const [loading, setLoading ] = useState(true);
  const dispatch = useDispatch();
  useEffect(()=> {
    authservice.getCurrentUser()
    .then((userData)=>{
      if(userData){
        dispatch(login({userData}));
      }
      else{
        dispatch(logout());
      }
    })
    .finally(()=>{ setLoading(false)})
  },[]);

  return !loading ? (
    <div className='min-h-screen flex flex-wrap content-between bg-gray-400'>
      <div className='w-full block'>
        <Header />
        <main>
           <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  ):null
}

export default App
