import {Route, Routes, useNavigate } from "react-router-dom"

function App() {
  const navigate = useNavigate();
  return (
    <>
    <Routes>
      <Route path="/" element={<div>    <button onClick={()=>{navigate('/attendance')}}>attendance</button>
    <button onClick={()=>{navigate('/login')}}>login</button>
    <button onClick={()=>{navigate('/teacher')}}>teacher</button></div>}/>
      <Route path="/hello" element={<div>hello</div>}/>
      <Route path="/hells" element={<div>hells</div>}/>
      <Route path="/hella" element={<div>hella</div>}/>
    </Routes>
    </>
  )
}

export default App