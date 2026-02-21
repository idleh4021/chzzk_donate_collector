import React, { useState, useEffect, useMemo,useRef } from 'react';
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
  const [showAmount,setShowAmount] = useState(false);
  const [targetAmount, setTargetAmount] = useState(1000);
  const [matchType,setMatchType] = useState('above');
  const [calcMethod,setCalcMethod] = useState('ratio');
  const [allowRemainder, setAllowRemainder] = useState(true);
  //const targetAmountRef = useRef(targetAmount);
  //const calcMethodRef = useRef(calcMethod);
  const settingsRef = useRef({targetAmount,matchType,allowRemainder,calcMethod});

  useEffect(()=>{
    settingsRef.current = {targetAmount,matchType,allowRemainder,calcMethod}
  },[targetAmount,matchType,allowRemainder,calcMethod])

  // 1. 현재 선택된 탭 상태 (기본값: 'count')
  const [activeTab, setActiveTab] = useState('count');

  useEffect(() => {
    window.addDonation = (data) => {
      const {targetAmount: currTarget,calcMethod: currMethod}= settingsRef.current;
      let increment = 1;

      if(currMethod ==='ratio' ){
        const base = currTarget || 1000;
        increment = Math.floor((data.amount || 0 ) / base);
        if(increment < 1) increment = 1;
      }

      setHistoryRows(prev => [data, ...prev].slice(0, 500));
      setCountRows(prev => {
        const existingIndex = prev.findIndex(row => row.message === data.message);
        if (existingIndex > -1) {
          const newState = [...prev];
          newState[existingIndex] = {
            ...newState[existingIndex],
            count: newState[existingIndex].count + increment,
            totalAmount: newState[existingIndex].totalAmount + (data.amount || 0)
          };
          return newState.sort((a, b) => b.count - a.count);
        } else {
          return [...prev, { message: data.message, count: increment, totalAmount: (data.amount || 0) }];
        }
      });
    };
    return () => { if (window.addDonation) delete window.addDonation; };
  }, []);

  // 컬럼 정의 (이전과 동일)
  const historyColDefs = useMemo(() => [
    { field: 'time', headerName: '시간', width: 120 },
    { field: 'nickname', headerName: '닉네임', width: 120 },
    { field: 'amount', headerName: '금액', width: 100,hide:!showAmount, valueFormatter: p => p.value?.toLocaleString() + '원' },
    { field: 'message', headerName: '메시지', flex: 1 }
  ], [showAmount]);

  const countColDefs = useMemo(() => [
    { field: 'message', headerName: '도네 내용', flex: 1 },
    { field: 'count', headerName: '횟수', width: 100 },
    { field: 'totalAmount', headerName: '누적 금액',hide:!showAmount, width: 150, valueFormatter: p => p.value?.toLocaleString() + '원' }
  ], [showAmount]);

  const handleStart = async () => {
    if (!channelId) return alert('채널 ID를 입력하세요');

    const options = {
      targetAmount: Number(targetAmount),
      matchType,
      calcMethod,
      allowRemainder
    }

    if (window.pywebview && window.pywebview.api) {
      const res = await window.pywebview.api.start_collection(channelId, options);
      setIsRunning(true);
    }
  };

  const handleStop = async () => {
    await window.pywebview.api.stop_collection();
    setIsRunning(false);
  };

  const handleClear =()=>{
    if(window.confirm('집계 기록을 전부 초기화 하시겠습니까?')){
      setHistoryRows([]);
      setCountRows([]);
    }
  }

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
          disabled = {isRunning}
          style={{ padding: '10px', width: '250px', border: '1px solid #ddd', borderRadius: '4px' }}
        />
        
        {!isRunning ? (
          <button onClick={handleStart} style={{ padding: '10px 25px', backgroundColor: '#00ffa3', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>수집 시작</button>
        ) : (
          <button onClick={handleStop} style={{ padding: '10px 25px', backgroundColor: '#ff4d4d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>수집 중지</button>
        )}
        <button onClick={handleClear}
        disabledd = {isRunning}
        style ={{
          padding: '10px 20px', 
          backgroundColor: isRunning ? '#ccc' : '#6c757d', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px', 
          cursor: isRunning ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          marginLeft: 'auto' // 버튼을 오른쪽 끝으로 밀기
        }}>초기화</button>
      </div>
      {/* ⭐ 추가된 상세 설정 영역 (필터 및 집계 조건) */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', backgroundColor: '#f1f3f5', padding: '10px 15px', borderRadius: '0 0 8px 8px', fontSize: '13px', flexWrap: 'wrap' }}>
        {/* 1. 기준 금액 입력 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 'bold' }}>기준 금액:</span>
          <input 
            type="number" 
            value={targetAmount} 
            onChange={(e) => setTargetAmount(Number(e.target.value))} 
            disabled = {isRunning}
            style={{ width: '80px', padding: '5px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>

        {/* 2. 비교 방식 (라디오) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid #ccc', paddingLeft: '15px' }}>
          <label style={{ cursor: 'pointer' }}>
            <input type="radio" name="matchType" value="exact" checked={matchType === 'exact'} onChange={(e) => setMatchType(e.target.value)} disabled = {isRunning} /> 정확히
          </label>
          <label style={{ cursor: 'pointer' }}>
            <input type="radio" name="matchType" value="above" checked={matchType === 'above'} onChange={(e) => setMatchType(e.target.value)} disabled = {isRunning} /> 이상
          </label>
        </div>

        {/* 4. 나머지 허용 여부 (체크박스) - '이상'일 때만 의미 있음 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', borderLeft: '1px solid #ccc', paddingLeft: '15px' }}>
          <label style={{ cursor: 'pointer', color: matchType === 'exact' ? '#ccc' : '#333' }}>
            <input 
              type="checkbox" 
              disabled={isRunning || matchType === 'exact'} 
              checked={allowRemainder} 
              onChange={(e) => setAllowRemainder(e.target.checked)} 
            /> 나머지 허용 (미체크 시 배수만 집계)
          </label>
        </div>

        {/* 3. 카운트 방식 (Select) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid #ccc', paddingLeft: '15px' }}>
          <span style={{ fontWeight: 'bold' }}>집계 방식:</span>
          <select value={calcMethod} onChange={(e) => setCalcMethod(e.target.value)} disabled = {isRunning} style={{ padding: '5px', borderRadius: '4px' }}>
            <option value="once">단순 1회</option>
            <option value="ratio">금액 비례(배수)</option>
          </select>
        </div>
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

      {/* 바닥 상태 바 */}
    <div style={{ 
      fontSize: '12px', 
      color: '#888', 
      display: 'flex',           // Flexbox 활성화
      justifyContent: 'flex-end', // 전체 내용을 우측 끝으로 정렬
      alignItems: 'center',       // 세로 중앙 정렬
      gap: '15px',                // 체크박스와 텍스트 사이 간격
      marginTop: '5px'            // 위 그리드와의 미세한 간격
    }}>
      {/* ⭐ 금액 표시 체크박스 */}
      <label style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '5px', 
        cursor: 'pointer', 
        color: '#333' // 체크박스 텍스트는 좀 더 진하게 보이게 설정
      }}>
        <input 
          type="checkbox" 
          checked={showAmount} 
          onChange={(e) => setShowAmount(e.target.checked)}
          style={{ width: '15px', height: '15px', cursor: 'pointer' }}
        />
        금액 표시
      </label>
    
      {/* 버전 및 상태 정보 */}
      <span>
        DonateCollector v0.0.1 | Status: 
        <span style={{ color: isRunning ? '#00ffa3' : '#ff4d4d', fontWeight: 'bold', marginLeft: '4px' }}>
          {isRunning ? 'Running' : 'Stopped'}
        </span>
      </span>
    </div>
  </div>
  );
}

export default App;