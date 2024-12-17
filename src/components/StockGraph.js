import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

const StockGraph = ({ stocks }) => {
  const data = {
    labels: stocks.map(stock => stock.time),
    datasets: [
      {
        label: 'AAPL Stock Price',
        data: stocks.map(stock => stock.price),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  return <Line data={data} />;
};

export default StockGraph;
