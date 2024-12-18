import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

const StockGraph = () => {
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState('AAPL'); // 기본적으로 AAPL을 선택

  // JSON 데이터를 가져오는 useEffect
  useEffect(() => {
    fetch('/stocks.json')
      .then(response => response.json())
      .then(data => setStocks(data)) // 데이터 불러와서 상태에 저장
      .catch(error => console.error("Error loading stock data:", error));
  }, []);

  // 주식 심볼을 고유하게 추출
  const stockSymbols = Array.from(new Set(stocks.map(stock => stock.symbol)));

  // 선택된 주식에 해당하는 데이터만 필터링
  const selectedStockData = stocks.filter(stock => stock.symbol === selectedStock);

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
