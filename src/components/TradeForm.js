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
      const q = query(collection(db, 'users'), where('uid', '==', uid));
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
          existingStock.quantity += quantity; 
        } else {
          updatedAssets.push({ 
            stockName: selectedStock, 
            quantity, 
            purchasePrice: stockInfo.price // 구매 가격 추가
          });
        }

        const updatedCash = userData.cash - totalCost;

        const userRef = doc(db, 'users', userData.docId);
        await updateDoc(userRef, {
          assets: updatedAssets,
          cash: updatedCash,
        });

        setUserData((prev) => ({ ...prev, assets: updatedAssets, cash: updatedCash }));

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
        const updatedAssets = userData.assets
          .map((asset) =>
            asset.stockName === selectedStock
              ? { ...asset, quantity: asset.quantity - quantity }
              : asset
          )
          .filter((asset) => asset.quantity > 0);

        const updatedCash = userData.cash + stockInfo.price * quantity;

        const userRef = doc(db, 'users', userData.docId);
        await updateDoc(userRef, {
          assets: updatedAssets,
          cash: updatedCash,
        });

        setUserData((prev) => ({ ...prev, assets: updatedAssets, cash: updatedCash }));

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

  const calculateProfitLoss = (purchasePrice, currentPrice) => {
    if (currentPrice === 0) return 0; // 현재 가격이 0일 경우 수익률을 0으로 처리
    return purchasePrice > 0 ? ((currentPrice - purchasePrice) / purchasePrice) * 100 : 0;
  };

  return (
    <div>
      <h2 style={{ textAlign: 'center' }}>거래 폼</h2>
      
      {userData && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3>현재 보유 현금: ${userData.cash.toFixed(2)}</h3>
        </div>
      )}

      <form onSubmit={handleTradeSubmit} style={{ textAlign: 'center' }}>
        <div>
          <label>거래 유형:</label>
          <select value={tradeType} onChange={(e) => setTradeType(e.target.value)}>
            <option value="buy">구매</option>
            <option value="sell">판매</option>
          </select>
        </div>
        <div>
          <label>주식 선택:</label>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {stocks.map((stock) => (
              <div key={stock.symbol}>
                <label>
                  <input
                    type="radio"
                    name="stock"
                    value={stock.symbol}
                    checked={selectedStock === stock.symbol}
                    onChange={handleStockSelection}
                  />
                  {stock.symbol} (${stock.price.toFixed(2)})
                </label>
              </div>
            ))}
          </div>
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

      <h3 style={{ textAlign: 'center' }}>보유 자산</h3>
      {userData && userData.assets.length > 0 ? (
        <table style={{ margin: '0 auto', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>주식 이름</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>보유 수량</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>현재 가격</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>총 가치</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>수익률</th>
            </tr>
          </thead>
          <tbody>
            {userData.assets.map((asset) => {
              const stock = stocks.find((s) => s.symbol === asset.stockName);
              const price = stock ? stock.price : 0;
              const totalValue = asset.quantity * price;
              const profitLoss = calculateProfitLoss(asset.purchasePrice, price);
              const profitLossStyle = profitLoss > 0 ? { color: 'green' } : { color: 'red' };

              return (
                <tr key={asset.stockName}>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{asset.stockName}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{asset.quantity}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>${price.toFixed(2)}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>${totalValue.toFixed(2)}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px', ...profitLossStyle }}>
                    {profitLoss.toFixed(2)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p style={{ textAlign: 'center' }}>보유한 자산이 없습니다.</p>
      )}
    </div>
  );
};

export default TradeForm;
