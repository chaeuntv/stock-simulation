import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { getFirestore, query, collection, where, getDocs, doc, updateDoc } from 'firebase/firestore';

const TradeForm = () => {
  const [userData, setUserData] = useState(null);
  const [uid, setUid] = useState(null);

  const [selectedStock, setSelectedStock] = useState(null);
  const [quantity, setQuantity] = useState(0);
  const [stocks, setStocks] = useState([]);
  const [error, setError] = useState('');
  const [tradeType, setTradeType] = useState('buy');
  const db = getFirestore();

  const fetchUserData = async (uid) => {
    try {
      const q = query(collection(db, 'users2'), where('uid', '==', uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        return { ...userData, docId: userDoc.id };
      } else {
        console.error('No matching user found!');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  const fetchStocksData = async () => {
    try {
      const response = await fetch('/stocks.json');
      const data = await response.json();
      const currentTime = new Date();

      const latestStocks = {};
      data.forEach((entry) => {
        const entryTime = new Date(entry.time);
        if (entryTime <= currentTime) {
          if (
            !latestStocks[entry.symbol] ||
            entryTime > new Date(latestStocks[entry.symbol].time)
          ) {
            latestStocks[entry.symbol] = entry;
          }
        }
      });

      setStocks(Object.values(latestStocks));
    } catch (error) {
      console.error('Error fetching stock data:', error);
    }
  };

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUid(currentUser.uid);
    } else {
      console.error('No authenticated user found!');
      setError('사용자 인증에 문제가 발생했습니다.');
    }

    fetchStocksData();

    const intervalId = setInterval(fetchStocksData, 10000); // 10초마다 호출

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      if (uid) {
        const fetchedUserData = await fetchUserData(uid);
        if (fetchedUserData) {
          setUserData(fetchedUserData);
        } else {
          console.error('Failed to load user data');
          setError('사용자 데이터를 불러오는 데 실패했습니다.');
        }
      }
    };

    loadUserData();
  }, [uid]);

  const handleTradeSubmit = async (e) => {
    e.preventDefault();

    if (!userData || !selectedStock || quantity <= 0) {
      alert('유효한 주식과 수량을 선택하세요.');
      return;
    }

    const stockInfo = stocks.find((stock) => stock.symbol === selectedStock);
    if (!stockInfo) {
      alert('선택한 주식을 찾을 수 없습니다.');
      return;
    }

    if (tradeType === 'buy') {
      const totalCost = stockInfo.price * quantity;

      if (totalCost > userData.cash) {
        alert('부적절한 요청입니다: 보유 현금이 부족합니다.');
        return;
      }

      try {
        const updatedAssets = [...userData.assets];
        const existingStock = updatedAssets.find((asset) => asset.stockName === selectedStock);

        if (existingStock) {
          const oldTotalCost = existingStock.cumulativeBuyPrice * existingStock.quantity;
          const newTotalCost = totalCost;
          const newQuantity = existingStock.quantity + quantity;

          existingStock.cumulativeBuyPrice = (oldTotalCost + newTotalCost) / newQuantity;
          existingStock.quantity = newQuantity;
        } else {
          updatedAssets.push({
            stockName: selectedStock,
            quantity,
            cumulativeBuyPrice: stockInfo.price,
            cumulativeSellPrice: 0,
          });
        }

        const updatedCash = userData.cash - totalCost;

        const userRef = doc(db, 'users2', userData.docId);
        await updateDoc(userRef, {
          assets: updatedAssets,
          cash: updatedCash,
        });

        setUserData((prev) => ({
          ...prev,
          assets: updatedAssets,
          cash: updatedCash,
        }));

        alert('거래가 성공적으로 완료되었습니다.');
      } catch (error) {
        console.error('Error processing trade:', error);
        alert('거래 처리 중 문제가 발생했습니다.');
      }
    } else if (tradeType === 'sell') {
      const existingStock = userData.assets.find((asset) => asset.stockName === selectedStock);

      if (!existingStock || existingStock.quantity < quantity) {
        alert('부적절한 요청입니다: 보유한 주식이 부족합니다.');
        return;
      }

      try {
        const totalSale = stockInfo.price * quantity;
        const newQuantity = existingStock.quantity - quantity;

        if (newQuantity > 0) {
          const oldTotalSell = existingStock.cumulativeSellPrice * existingStock.quantity;
          const newTotalSell = stockInfo.price * quantity;

          existingStock.cumulativeSellPrice = (oldTotalSell + newTotalSell) / newQuantity;
          existingStock.quantity = newQuantity;
        } else {
          existingStock.cumulativeSellPrice = stockInfo.price;
          existingStock.quantity = 0;
        }

        const updatedCash = userData.cash + totalSale;

        const userRef = doc(db, 'users2', userData.docId);
        await updateDoc(userRef, {
          assets: userData.assets,
          cash: updatedCash,
        });

        setUserData((prev) => ({
          ...prev,
          cash: updatedCash,
        }));

        alert('판매가 성공적으로 완료되었습니다.');
      } catch (error) {
        console.error('Error processing trade:', error);
        alert('거래 처리 중 문제가 발생했습니다.');
      }
    }
  };

  const handleStockSelection = (e) => {
    setSelectedStock(e.target.value);
  };

  const calculateStockProfitLoss = (stock) => {
    if (stock.quantity === 0) return null;

    const currentStock = stocks.find((s) => s.symbol === stock.stockName);
    if (!currentStock || !stock.cumulativeBuyPrice) return 0;

    const currentPrice = currentStock.price;
    const profitLoss =
      ((currentPrice - stock.cumulativeBuyPrice) / stock.cumulativeBuyPrice) * 100;

    return profitLoss;
  };

  return (
    <div>
      <h2 style={{ textAlign: 'center' }}>주식 거래</h2>
      {userData && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3>보유 현금: ₩{userData.cash.toLocaleString()}</h3>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <h3>보유 자산</h3>
          {userData && userData.assets.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>주식 이름</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>보유 수량</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>현재 가격</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>수익률</th>
                </tr>
              </thead>
              <tbody>
                {userData.assets.map((asset) => {
                  const stock = stocks.find((s) => s.symbol === asset.stockName);
                  const currentPrice = stock ? stock.price : 0;
                  const profitLoss = calculateStockProfitLoss(asset);
                  const profitLossStyle = profitLoss >= 0 ? 'red' : 'blue';

                  return (
                    <tr key={asset.stockName}>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                        {asset.stockName}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                        {asset.quantity}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                        ₩{currentPrice.toLocaleString()}
                      </td>
                      <td
                        style={{
                          border: '1px solid #ccc',
                          padding: '8px',
                          color: profitLossStyle,
                        }}
                      >
                        {profitLoss !== null ? `${profitLoss.toFixed(2)}%` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p>보유한 자산이 없습니다.</p>
          )}
        </div>

        <form onSubmit={handleTradeSubmit} style={{ flex: 1, marginRight: '20px' }}>
          <h3>거래 폼</h3>
          <div>
            <span>거래 유형:</span>
            <label>
              <input
                type="radio"
                value="buy"
                checked={tradeType === 'buy'}
                onChange={() => setTradeType('buy')}
              />
              구매
            </label>
            <label>
              <input
                type="radio"
                value="sell"
                checked={tradeType === 'sell'}
                onChange={() => setTradeType('sell')}
              />
              판매
            </label>
          </div>
          <div>
            <span>주식 선택:</span>
            {stocks.map((stock) => (
              <label key={stock.symbol} style={{ display: 'block' }}>
                <input
                  type="radio"
                  value={stock.symbol}
                  checked={selectedStock === stock.symbol}
                  onChange={handleStockSelection}
                />
                {stock.symbol} (₩{stock.price.toLocaleString()})
              </label>
            ))}
          </div>
          <div>
            <label>수량:</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
              min="1"
            />
          </div>
          <button type="submit">거래</button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default TradeForm;
