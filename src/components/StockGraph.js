import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

const StockGraph = () => {
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState('AAPL'); // 기본적으로 AAPL을 선택

  // JSON 데이터를 가져오는 함수
  const fetchStockData = () => {
    fetch('/stocks.json')
      .then(response => response.json())
      .then(data => setStocks(data)) // 데이터 불러와서 상태에 저장
      .catch(error => console.error("Error loading stock data:", error));
  };

  // 처음 로드 시 데이터를 가져오고, 10초마다 데이터를 갱신
  useEffect(() => {
    fetchStockData(); // 처음 데이터 가져오기
    const intervalId = setInterval(fetchStockData, 10000); // 10초마다 데이터 갱신

    return () => clearInterval(intervalId); // 컴포넌트가 언마운트되면 인터벌을 클리어
  }, []);

  // 주식 심볼을 고유하게 추출
  const stockSymbols = Array.from(new Set(stocks.map(stock => stock.symbol)));

  // 현재 시간 가져오기 (UTC 기준으로)
  const currentTime = new Date();

  // 선택된 주식에 해당하는 데이터만 필터링 (현재 시간 이전의 데이터만)
  const selectedStockData = stocks
    .filter(stock => stock.symbol === selectedStock) // 선택된 주식만 필터링
    .filter(stock => new Date(stock.time) <= currentTime); // 현재 시간 이전의 데이터만 필터링

  // 차트 데이터 설정
  const data = {
    labels: Array.from(new Set(selectedStockData.map(stock => stock.time))), // x축: 시간
    datasets: [
      {
        label: selectedStock, // 선택된 주식 이름 (AAPL, GOOGL 등)
        data: selectedStockData.map(stock => stock.price), // 해당 주식 가격
        fill: false,
        borderColor: 'rgb(75, 192, 192)', // 색상 설정 (하나의 주식만 표시)
        tension: 0.1,
      },
    ],
  };

  // 주식 선택 핸들러
  const handleStockChange = (event) => {
    setSelectedStock(event.target.value); // 선택된 주식의 심볼로 상태 업데이트
  };

  return (
    <div>
      <h2>Stock Graph</h2>

      {/* 주식 선택 드롭다운 */}
      <select value={selectedStock} onChange={handleStockChange}>
        {stockSymbols.map(symbol => (
          <option key={symbol} value={symbol}>
            {symbol}
          </option>
        ))}
      </select>

      {/* 차트 표시 */}
      <Line data={data} />
    </div>
  );
};

export default StockGraph;
