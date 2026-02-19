import React,{useState,useEffect,useRef,useMemo} from 'react';
import {AgGridReact} from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

function App(){
  const [channelId, setChannelId] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const [historyRows, setHistoryRows] = useState([]);
  const [countRows, setCountRows] = useState([]);

  useEffect(()=>{
    window.addDonation = (data)=>{
      setHistoryRows(prev=>[data,...prev]);

      setCountRows(prev => {
        const existingIndex = prev.findIndex(row=>row.message ===data.message);
        if(existingIndex>-1){
          const newState=[...prev]
          newState[existingIndex]={
            ...newState[existingIndex],
            count:newState[existingIndex].count+1,
            totalAmount: new State[existingIndex].totalAmount+data.totalAmount
          };
          return newState.sort((a,b)=>b.count - a.count);
        }else{
          return [...prev,{message:data.message,count:1,totalAmount:data.amount}];
        }
      });
    };

    return () => {delete window.adddonation;};
  },[]);

  const historyColDefs = useMemo(()=>[
    {field : 'time', headerName:'시간',width:150},
    { field: 'nickname', headerName: '닉네임', width: 120 },
    { field: 'amount', headerName: '금액', width: 100, valueFormatter: p => p.value?.toLocaleString() + '원' },
    { field: 'message', headerName: '메시지', flex: 1 }

  ],[]);


  const countColDefs = useMemo(()=>[
    { field: 'message', headerName: '도네 내용', flex: 1 },
    { field: 'count', headerName: '횟수', width: 100 },
    { field: 'totalAmount', headerName: '누적 금액', width: 120, valueFormatter: p => p.value?.toLocaleString() + '원' }
  ],[]);

  const handleStart = async() =>{
    if(!channelId) return alert('채널 ID를 입력하세요');

    if (window.pywebview && window.pywebview.api){
      try{
        const res = await window.pywebview.api.start_collection(channelId);
        setIsRunning(true);
        console.log(res)
      } catch (e){
        console.error('백엔드 호출 실패:',e)
      }
    }else{
      alert('백엔드 연결이 아직 안됨')
    }

    const res = await window.pywebview.api.start_collection(channelId);
    setIsRunning(true);
    console.log(res);
  };

  const handleStop = async()=>{
    const res = await window.pywebview.api.stop_collection();
    setIsRunning(false);
    console.log(res);
  };

  return (
    <div style={{ padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="치지직 채널 ID 입력" 
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          style={{ padding: '8px', width: '300px' }}
        />
        {!isRunning ? (
          <button onClick={handleStart} style={{ padding: '8px 20px', backgroundColor: '#00ffa3', border: 'none', cursor: 'pointer' }}>시작</button>
        ) : (
          <button onClick={handleStop} style={{ padding: '8px 20px', backgroundColor: '#ff4d4d', color: 'white', border: 'none', cursor: 'pointer' }}>중지</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '20px', flex: 1 }}>
        <div className="ag-theme-alpine" style={{ flex: 2, height: '100%' }}>
          <h3>도네이션 히스토리</h3>
          <AgGridReact 
            rowData={historyRows} 
            columnDefs={historyColDefs}
            animateRows={true}
          />
        </div>
        <div className="ag-theme-alpine" style={{ flex: 1, height: '100%' }}>
          <h3>내용별 카운트</h3>
          <AgGridReact 
            rowData={countRows} 
            columnDefs={countColDefs}
            animateRows={true}
          />
        </div>
      </div>
    </div>
  );
}

export default App;