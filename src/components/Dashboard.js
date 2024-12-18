import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

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
  const [userRank, setUserRank] = useState(null); 
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;

      if (user) {
        const users = await fetchAllUsers(); 
        const currentUser = users.find((u) => u.uid === user.uid); 

        if (currentUser) {
          setUserData(currentUser);

          const rankedUsers = users
            .map((u) => ({ ...u, totalAssets: u.totalAssets || 0 }))
            .sort((a, b) => b.totalAssets - a.totalAssets);

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
      const calculateTotalAssets = () => {
        let total = 0;

        userData.assets.forEach((asset) => {
          const latestPrice = getLatestPrice(asset.stockName, stocks);
          if (latestPrice !== null) {
            total += asset.quantity * latestPrice;
          }
        });

        total += userData.cash || 0;

        setTotalAssets(total);
      };

      calculateTotalAssets();

      // Firebase에 총 자산 업데이트
      const updateUserAssets = async () => {
        const userDocRef = doc(db, "users", userData.id);
        try {
          await updateDoc(userDocRef, {
            totalAssets: totalAssets,
          });
          console.log("Total assets updated successfully in Firebase.");
        } catch (error) {
          console.error("Error updating total assets:", error);
        }
      };

      updateUserAssets();

      // 사용자 순위 업데이트
      const updateUserRank = async () => {
        const users = await fetchAllUsers();
        const rankedUsers = users
          .map((u) => ({ ...u, totalAssets: u.totalAssets || 0 }))
          .sort((a, b) => b.totalAssets - a.totalAssets);

        const rank = rankedUsers.findIndex((u) => u.uid === userData.uid) + 1;
        setUserRank(rank);
        console.log("User rank updated to:", rank);
      };

      // 총 자산 및 순위를 10초마다 업데이트
      const intervalId = setInterval(() => {
        calculateTotalAssets();  // 총 자산 계산
        updateUserAssets();      // Firebase에 자산 업데이트
        updateUserRank();        // 사용자 순위 업데이트
      }, 10000); // 10초마다 호출

      // 컴포넌트 언마운트 시 setInterval 종료
      return () => clearInterval(intervalId);
    }
  }, [userData, stocks, totalAssets]);

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
      {userRank && <h3>당신의 순위: #{userRank}</h3>}
      <button onClick={() => navigate("/ranking")}>순위 보기</button>
    </div>
  );
};

export default Dashboard;
