import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1 className='text-4xl font-bold text-amber-700'>Welcome to MediSphere</h1>
      <p className='mt-4'>Your one-stop solution for managing medical appointments.</p>
    </>
  )
}

export default App
