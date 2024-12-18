import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; // Firebase 설정

const Ranking = () => {
  const [stockPrices, setStockPrices] = useState([]); // 주식 가격 상태
  const [userRankings, setUserRankings] = useState([]); // 사용자 순위 상태
  const [loading, setLoading] = useState(true); // 로딩 상태

  // 주식 가격을 fetch로 가져오는 함수
  const fetchStockPrices = async () => {
    try {
      const response = await fetch('/stocks.json'); // public 폴더에서 JSON 파일을 가져옴
      const data = await response.json(); // JSON 데이터를 파싱
      setStockPrices(data); // 주식 가격 데이터를 상태에 저장
    } catch (error) {
      console.error('Error fetching stock prices:', error);
    }
  };

  // 사용자 데이터를 가져오는 함수 (Firebase에서)
  const fetchUserRankings = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users')); // 모든 유저 데이터를 가져옴
      const userData = querySnapshot.docs.map(doc => doc.data()); // 유저 데이터 배열로 변환

      // 총 자산 계산
      const rankings = userData.map(user => {
        const totalAssets = calculateTotalAssets(user.assets);
        return { username: user.username, totalAssets }; // 사용자 이름과 자산 합계
      });

      // 자산 합계로 내림차순 정렬
      rankings.sort((a, b) => b.totalAssets - a.totalAssets);

      setUserRankings(rankings); // 정렬된 사용자 데이터 상태에 저장
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
    }
  };

  // 자산 계산 함수
  const calculateTotalAssets = (assets) => {
    if (!assets || assets.length === 0 || stockPrices.length === 0) return 0;

    let totalAssets = 0;
    assets.forEach(asset => {
      const stockPrice = stockPrices.find(price => price.symbol === asset.stockName);
      if (stockPrice) {
        totalAssets += asset.quantity * stockPrice.price; // 자산 계산
      }
    });
    return totalAssets;
  };

  useEffect(() => {
    fetchStockPrices(); // 주식 가격을 가져옴
  }, []);

  useEffect(() => {
    if (stockPrices.length > 0) {
      fetchUserRankings(); // 주식 가격을 가져온 후 사용자 데이터 가져옴
    }
  }, [stockPrices]); // stockPrices가 변경될 때마다 사용자 데이터를 가져옴

  if (loading) {
    return <p>Loading...</p>; // 로딩 중일 때 표시
  }

  return (
    <div>
      <h1>User Rankings</h1>
      <ul>
        {userRankings.map((user, index) => (
          <li key={index}>
            {index + 1}. {user.username} - ${user.totalAssets.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Ranking;
