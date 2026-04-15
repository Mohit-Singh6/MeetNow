import {BrowserRouter as Router} from 'react-router-dom';
import {Routes, Route} from 'react-router-dom';
import LandingPage from './pages/landingRedirectPage.jsx';
import Login from './pages/login.jsx';
import Signup from './pages/signup.jsx';
import VideoMeet from './pages/videoMeet.jsx';
import HomeComponent from './pages/homePage.jsx';
import HistoryPage from './pages/historyPage.jsx';
import './App.css'


function App() {

  return (
    <Router>
      {/* Routes go here! */}
      <Routes>
        <Route path='/' element={<LandingPage/>}/>
        <Route path='/login' element={<Login/>} />
        <Route path='/signup' element={<Signup/>} />
        <Route path='/home' element={<HomeComponent/>} />
        <Route path='/history' element={<HistoryPage/>} />
        <Route path='/:url' element={<VideoMeet/>} />
        {/* <Route /> */}
      </Routes>
    </Router>
  )
}

export default App
