import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom"; // react-router-dom 추가

// Firebase에서 모든 유저 데이터를 가져오는 함수
const fetchAllUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
};

// 현재 시간을 기준으로 가장 최신 가격을 찾는 함수
const getLatestPrice = (stockSymbol, stocks) => {
  const now = new Date();
  const formattedNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const filteredStocks = stocks.filter((stock) => stock.symbol === stockSymbol && stock.time <= formattedNow);
  if (filteredStocks.length === 0) return null;

  const latestStock = filteredStocks.reduce((latest, current) =>
    new Date(current.time) > new Date(latest.time) ? current : latest
  );

  return latestStock ? latestStock.price : null;
};

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stocks, setStocks] = useState([]);
  const [totalAssets, setTotalAssets] = useState(0);
  const [userRank, setUserRank] = useState(null); // 사용자의 순위를 저장
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;

      if (user) {
        const users = await fetchAllUsers(); // 모든 유저 데이터를 가져오기
        const currentUser = users.find((u) => u.uid === user.uid); // 현재 로그인된 유저 찾기

        if (currentUser) {
          setUserData(currentUser);

          // 총 자산이 계산된 순위 정렬
          const rankedUsers = users
            .map((u) => ({ ...u, totalAssets: u.totalAssets || 0 })) // totalAssets가 없으면 0으로 설정
            .sort((a, b) => b.totalAssets - a.totalAssets);

          // 현재 유저의 순위를 찾아 설정
          const rank = rankedUsers.findIndex((u) => u.uid === user.uid) + 1;
          setUserRank(rank);
        } else {
          console.error("No matching user found!");
        }
      } else {
        console.error("No user is currently logged in.");
      }

      setLoading(false);
    };

    const fetchStocks = async () => {
      try {
        const response = await fetch("/stocks.json");
        const data = await response.json();
        setStocks(data);
      } catch (err) {
        console.error("Error fetching stock data:", err);
      }
    };

    fetchUserData();
    fetchStocks();
  }, []);

  useEffect(() => {
    if (userData && stocks.length > 0) {
      let total = 0;

      // userData.assets에 있는 주식과 stocks에서 최신 가격을 찾아 곱해 총 자산 계산
      userData.assets.forEach((asset) => {
        const latestPrice = getLatestPrice(asset.stockName, stocks);
        if (latestPrice !== null) {
          total += asset.quantity * latestPrice;
        }
      });

      // 현금을 총 자산에 추가
      total += userData.cash || 0; // 현금이 없다면 0으로 처리

      setTotalAssets(total); // 총 자산 상태 업데이트
    }
  }, [userData, stocks]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!userData) {
    return <p>User not found!</p>;
  }

  return (
    <div>
      <h1>환영합니다!, {userData.username}!</h1>
      <h2>총 자산: ${totalAssets.toFixed(2)}</h2>
      {userRank && <h3>당신의 순위: #{userRank}</h3>} {/* 사용자의 순위를 표시 */}
      <button onClick={() => navigate("/ranking")}>순위 보기</button>
    </div>
  );
};

export default Dashboard;
