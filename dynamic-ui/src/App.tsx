import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import DynamicTextBoxes from './DynamicTextBoxes'

function App() {
  const [count, setCount] = useState(0)

  
  return (
    <>
      <DynamicTextBoxes />
    </>
  )
}

export default App
