import { useState, useEffect } from "react";
import { auth, db } from "../firebase";  // Firebase 설정을 임포트
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// Firebase에서 유저 데이터 가져오는 함수
const fetchUserData = async (uid) => {
  try {
    const q = query(collection(db, "users"), where("uid", "==", uid));
    const querySnapshot = await getDocs(q);
    

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0]; // 첫 번째 일치하는 문서
      const userData = userDoc.data(); // 문서 데이터
      console.log("Fetched user data:", userData);
      return userData; // 모든 데이터를 반환
    } else {
      console.error("No matching user found!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

// 주식 가격 가져오기
const fetchStockPrices = async () => {
  try {
    const response = await fetch('/stocks.json'); // public 폴더에서 stocks.json 파일을 가져옵니다
    const data = await response.json(); // JSON 형식으로 변환
    return data; // 주식 가격 데이터를 반환
  } catch (error) {
    console.error("Error fetching stock data:", error);
    return []; // 에러 발생 시 빈 배열 반환
  }
};

const Dashboard = () => {
  const [userData, setUserData] = useState(null); // 유저 데이터 상태
  const [stockData, setStockData] = useState([]); // 주식 데이터 상태
  const [totalAssets, setTotalAssets] = useState(0); // 총 자산 상태
  const [loading, setLoading] = useState(true); // 로딩 상태
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;

    if (user) {
      fetchUserData(user.uid).then((fetchedData) => {
        setUserData(fetchedData); // 유저 데이터 상태 업데이트
      });

      fetchStockPrices().then((data) => {
        setStockData(data); // 주식 가격 데이터 상태 업데이트
      }).finally(() => {
        setLoading(false); // 로딩 완료 처리
      });
    } else {
      console.error("No user is currently logged in.");
      setLoading(false);
    }
  }, []);

  // 총 자산 계산
  useEffect(() => {
    if (userData && stockData.length > 0) {
      let total = 0;

      // userData.assets에 있는 주식과 stockData에서 가격을 찾아 곱해 총 자산 계산
      userData.assets.forEach((asset) => {
        const stock = stockData.find((stock) => stock.symbol === asset.stockName);

        if (stock) {
          total += asset.quantity * stock.price; // 자산 계산
        }
      });

      setTotalAssets(total); // 총 자산 상태 업데이트
    }
  }, [userData, stockData]);

  if (loading) {
    return <p>Loading...</p>; // 로딩 중 표시
  }

  if (!userData) {
    return <p>User not found!</p>; // 데이터가 없을 때 표시
  }

  return (
    <div>
      <h1>Welcome, {userData.username}!</h1>
      <p>Cash: {userData.cash}</p>
      <h2>Your Assets:</h2>
      {userData.assets && userData.assets.length > 0 ? (
        <ul>
          {userData.assets.map((asset, index) => (
            <li key={index}>
              {asset.stockName}: {asset.quantity} shares at ${asset.price} each
            </li>
          ))}
        </ul>
      ) : (
        <p>No assets available</p>
      )}
      <h2>Total Assets: ${totalAssets.toFixed(2)}</h2> {/* 총 자산 표시 */}
      <button onClick={() => navigate('/ranking')}>View Ranking</button>
    </div>
  );
};

export default Dashboard;
