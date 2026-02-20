import React, { useState, useEffect, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule,themeQuartz } from 'ag-grid-community';

const myTheme = themeQuartz.withParams({
  spacing: 12,                // 전체적인 간격 확대 (가독성)
    accentColor: '#00ffa3',     // 치지직 느낌의 강조색
    rowBorder: { style: 'solid', width: 1, color: '#f0f0f0' }, // 행 구분선
    oddRowBackgroundColor: '#fdfdfd', // 홀수 줄 배경색
    headerBackgroundColor: '#f8f9fa', // 헤더 배경색
    headerTextColor: '#333',
    headerFontWeight: '700',
})

ModuleRegistry.registerModules([AllCommunityModule]);

//import 'ag-grid-community/styles/ag-grid.css';
//import 'ag-grid-community/styles/ag-theme-alpine.css';

function App() {
  const [channelId, setChannelId] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [historyRows, setHistoryRows] = useState([]);
  const [countRows, setCountRows] = useState([]);
  
  // 1. 현재 선택된 탭 상태 (기본값: 'count')
  const [activeTab, setActiveTab] = useState('count');

  useEffect(() => {
    window.addDonation = (data) => {
      setHistoryRows(prev => [data, ...prev].slice(0, 500));
      setCountRows(prev => {
        const existingIndex = prev.findIndex(row => row.message === data.message);
        if (existingIndex > -1) {
          const newState = [...prev];
          newState[existingIndex] = {
            ...newState[existingIndex],
            count: newState[existingIndex].count + 1,
            totalAmount: newState[existingIndex].totalAmount + (data.amount || 0)
          };
          return newState.sort((a, b) => b.count - a.count);
        } else {
          return [...prev, { message: data.message, count: 1, totalAmount: (data.amount || 0) }];
        }
      });
    };
    return () => { if (window.addDonation) delete window.addDonation; };
  }, []);

  // 컬럼 정의 (이전과 동일)
  const historyColDefs = useMemo(() => [
    { field: 'time', headerName: '시간', width: 120 },
    { field: 'nickname', headerName: '닉네임', width: 120 },
    { field: 'amount', headerName: '금액', width: 100, valueFormatter: p => p.value?.toLocaleString() + '원' },
    { field: 'message', headerName: '메시지', flex: 1 }
  ], []);

  const countColDefs = useMemo(() => [
    { field: 'message', headerName: '도네 내용', flex: 1 },
    { field: 'count', headerName: '횟수', width: 100 },
    { field: 'totalAmount', headerName: '누적 금액', width: 150, valueFormatter: p => p.value?.toLocaleString() + '원' }
  ], []);

  const handleStart = async () => {
    if (!channelId) return alert('채널 ID를 입력하세요');
    if (window.pywebview && window.pywebview.api) {
      const res = await window.pywebview.api.start_collection(channelId);
      setIsRunning(true);
    }
  };

  const handleStop = async () => {
    await window.pywebview.api.stop_collection();
    setIsRunning(false);
  };

  return (
    // 전체 컨테이너에 하단 여백(pb: '30px') 추가
    <div style={{ padding: '20px', paddingBottom: '30px', height: '100vh', display: 'flex', flexDirection: 'column', gap: '15px', boxSizing: 'border-box' }}>
      
      {/* 상단 컨트롤 영역 */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
        <input 
          type="text" 
          placeholder="치지직 채널 ID" 
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          style={{ padding: '10px', width: '250px', border: '1px solid #ddd', borderRadius: '4px' }}
        />
        {!isRunning ? (
          <button onClick={handleStart} style={{ padding: '10px 25px', backgroundColor: '#00ffa3', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>수집 시작</button>
        ) : (
          <button onClick={handleStop} style={{ padding: '10px 25px', backgroundColor: '#ff4d4d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>수집 중지</button>
        )}
      </div>

      {/* 탭 메뉴 영역 */}
      <div style={{ display: 'flex', gap: '5px' }}>
        <button 
          onClick={() => setActiveTab('count')}
          style={{
            padding: '10px 20px',
            cursor: 'pointer',
            border: '1px solid #ddd',
            borderBottom: activeTab === 'count' ? '3px solid #00ffa3' : '1px solid #ddd',
            backgroundColor: activeTab === 'count' ? '#fff' : '#eee',
            fontWeight: activeTab === 'count' ? 'bold' : 'normal',
            borderRadius: '4px 4px 0 0'
          }}
        >
          내용별 집계 (기본)
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          style={{
            padding: '10px 20px',
            cursor: 'pointer',
            border: '1px solid #ddd',
            borderBottom: activeTab === 'history' ? '3px solid #00ffa3' : '1px solid #ddd',
            backgroundColor: activeTab === 'history' ? '#fff' : '#eee',
            fontWeight: activeTab === 'history' ? 'bold' : 'normal',
            borderRadius: '4px 4px 0 0'
          }}
        >
          전체 히스토리
        </button>
      </div>

      {/* 그리드 영역 - 탭에 따라 조건부 렌더링 */}
      <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
      {activeTab === 'count' ? (
      <AgGridReact 
      key="grid-count"
      theme={myTheme} // ⭐ 최신 테마 적용
      rowData={countRows} 
      columnDefs={countColDefs}
      animateRows={true}
      rowHeight={45} // ⭐ 행 높이 설정
      />
      ) : (
      <AgGridReact 
      key="grid-history"
      theme={myTheme} // ⭐ 최신 테마 적용
      rowData={historyRows} 
      columnDefs={historyColDefs}
      animateRows={true}
      rowHeight={45} // ⭐ 행 높이 설정
      />
      )}
      </div>

      {/* 바닥 상태 바 (여백 확인용) */}
      <div style={{ fontSize: '12px', color: '#888', textAlign: 'right' }}>
        EasyWare v1.0 | Status: {isRunning ? 'Running' : 'Stopped'}
      </div>
    </div>
  );
}

export default App;