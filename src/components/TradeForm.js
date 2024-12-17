import React, { useState } from 'react';

const TradeForm = () => {
  const [amount, setAmount] = useState(0);
  const [action, setAction] = useState('buy');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(`Action: ${action}, Amount: ${amount}`);
    // 여기서 실제 거래 처리 로직 추가
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Action:
        <select value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>
      </label>
      <label>
        Amount:
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="1"
        />
      </label>
      <button type="submit">Submit</button>
    </form>
  );
};

export default TradeForm;
