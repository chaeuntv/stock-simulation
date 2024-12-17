// src/App.js

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { auth } from './firebase'; // Firebase 인증을 import
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import StockGraph from './components/StockGraph';
import TradeForm from './components/TradeForm';
import Login from './components/Login';
import Signup from './components/Signup';
import './App.css';

function App() {
  const [user, setUser] = useState(null); // 로그인 상태를 저장
  const [stocks, setStocks] = useState([]); // 주식 데이터 저장

  // Firebase 인증 상태 변화 추적 (로그인, 로그아웃)
  useEffect(() => {
    // auth.onAuthStateChanged는 사용자가 로그인하거나 로그아웃할 때마다 호출됨
    const unsubscribe = auth.onAuthStateChanged((userCredential) => {
      if (userCredential) {
        setUser(userCredential); // 로그인된 사용자 정보 설정
      } else {
        setUser(null); // 로그아웃된 상태
      }
    });

    return () => {
      unsubscribe(); // 컴포넌트 언마운트 시 리스너 제거
    };
  }, []); // 빈 배열로 두면 처음 렌더링할 때만 실행됨

  // 주식 데이터 로딩 (예시로 하드코딩된 데이터 사용)
  useEffect(() => {
    setStocks([
      { time: "2024-12-17 10:00", symbol: "AAPL", price: 150 },
      { time: "2024-12-17 10:01", symbol: "AAPL", price: 152 },
      { time: "2024-12-17 10:02", symbol: "AAPL", price: 153 },
    ]);
  }, []);

  return (
    <Router>
      <div className="App">
        <Navbar user={user} />
        <div className="content">
          <Routes>
            {/* 로그인 상태에 따라 적절한 컴포넌트 표시 */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/dashboard"
              element={
                user ? (
                  <>
                    <Dashboard user={user} />
                    <StockGraph stocks={stocks} />
                    <TradeForm />
                  </>
                ) : (
                  <Login />
                )
              }
            />
            <Route path="/" element={<Login />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
