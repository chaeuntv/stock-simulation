import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

// Firebase에서 유저 데이터를 가져오는 함수
const fetchUserData = async (uid) => {
  try {
    const q = query(collection(db, "users"), where("uid", "==", uid));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      return userData;
    } else {
      console.error("No matching user found!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

// 현재 시간을 기준으로 가장 최신 가격을 찾는 함수
const getLatestPrice = (stockSymbol, stocks) => {
  const now = new Date();
  const formattedNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // 주어진 주식의 가격 데이터 중, 현재 시간보다 이전의 가장 최신 데이터 찾기
  const filteredStocks = stocks.filter(stock => stock.symbol === stockSymbol && stock.time <= formattedNow);

  if (filteredStocks.length === 0) return null;

  // 가장 최신의 데이터를 찾기
  const latestStock = filteredStocks.reduce((latest, current) => {
    return new Date(current.time) > new Date(latest.time) ? current : latest;
  });

  return latestStock ? latestStock.price : null;
};

const Dashboard = () => {
  const [userData, setUserData] = useState(null); // 유저 데이터 상태
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [stocks, setStocks] = useState([]); // 주식 데이터 상태

  useEffect(() => {
    const user = auth.currentUser;

    if (user) {
      fetchUserData(user.uid).then((fetchedData) => {
        setUserData(fetchedData);
        setLoading(false);
      });
    } else {
      console.error("No user is currently logged in.");
      setLoading(false);
    }

    // stock.json 데이터를 가져오는 함수
    const fetchStocks = async () => {
      try {
        const response = await fetch('/stocks.json');
        const data = await response.json();
        setStocks(data);
      } catch (err) {
        console.error('Error fetching stock data:', err);
      }
    };

    // stock.json 파일을 가져오는 함수 호출
    fetchStocks();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!userData) {
    return <p>User not found!</p>;
  }

  // 자산의 각 주식에 대해 최신 가격을 찾아 업데이트하는 과정
  const updatedAssets = userData.assets.map((asset) => {
    const latestPrice = getLatestPrice(asset.stockName, stocks);
    return {
      ...asset,
      price: latestPrice !== null ? latestPrice : asset.price, // 최신 가격을 찾으면 업데이트, 없으면 기존 가격 유지
    };
  });

  return (
    <div>
      <h1>Welcome, {userData.username}!</h1>
      <p>Email: {userData.email}</p>
      <p>Cash: ${userData.cash}</p>

      <h2>Your Assets:</h2>
      {updatedAssets && updatedAssets.length > 0 ? (
        <ul>
          {updatedAssets.map((asset, index) => (
            <li key={index}>
              {asset.stockName}: {asset.quantity} shares at ${asset.price} each
            </li>
          ))}
        </ul>
      ) : (
        <p>No assets available</p>
      )}
    </div>
  );
};

export default Dashboard;
