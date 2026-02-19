import {useState} from 'react'

function App(){
  const [msg,setMsg] = useState('대기 중...')

  const callPython = async() =>{
    if(window.pywebview && window.pywebview.api){
      const response = await window.pywebview.api.greet('React 사용지')
      setMsg(response)
    }
  }
  
  return(
    <div style={{ textAlign: 'center', padding: '50px' }}>
        <h1>React + PyWebView</h1>
        <button onClick={callPython}>Python API 호출</button>
        <p>{msg}</p>
      </div>
  )
}


export default App