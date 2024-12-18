import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

const Ranking = () => {
  const [users, setUsers] = useState([]); // 유저 데이터 상태
  const [loading, setLoading] = useState(true); // 로딩 상태

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            username: data.username,
            totalAssets: data.totalAssets || 0, // totalAssets가 없으면 0으로 설정
          };
        });

        // totalAssets 기준으로 내림차순 정렬 (내림차순으로 가장 큰 자산을 첫 번째로)
        usersData.sort((a, b) => b.totalAssets - a.totalAssets);
        
        setUsers(usersData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h1>Asset Rankings</h1>
      <ul>
        {users.map((user, index) => (
          <li key={user.id}>
            {index + 1}. {user.username} - ${user.totalAssets.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Ranking;
