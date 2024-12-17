import React from 'react';

const Dashboard = ({ user }) => {
  return (
    <div className="dashboard">
      <h2>Welcome, {user ? user.name : "Guest"}</h2>
      <div className="balance-info">
        <p>Cash: ${user ? user.cash : 1000}</p>
        <p>Total Assets: ${user ? user.cash + 5000 : 1000}</p>
        {/* 보유 주식 정보 추가 */}
      </div>
    </div>
  );
};

export default Dashboard;
