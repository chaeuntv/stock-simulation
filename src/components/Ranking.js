import { useState, useEffect } from "react";
import { auth, db } from "../firebase"; // auth 추가
import { collection, getDocs } from "firebase/firestore";

const Ranking = () => {
  const [users, setUsers] = useState([]); // 유저 데이터 상태
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [currentUserUid, setCurrentUserUid] = useState(null); // 현재 로그인된 유저의 UID

  useEffect(() => {
    // 현재 로그인된 유저 UID를 가져오기
    const fetchCurrentUser = () => {
      const user = auth.currentUser;
      if (user) {
        setCurrentUserUid(user.uid);
      }
    };

    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            uid: data.uid, // 유저 UID 추가
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

    fetchCurrentUser();
    fetchUsers();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h1>Asset Rankings</h1>
      <ul>
        {users.map((user, index) => {
          // 현재 로그인된 유저인지 확인
          const isCurrentUser = user.uid === currentUserUid;

          return (
            <li
              key={user.id}
              style={{
                margin: isCurrentUser ? "20px 0" : "5px 0", // 여백 조정
                fontSize: isCurrentUser ? "1.2rem" : "1rem", // 폰트 크기 조정
                fontWeight: isCurrentUser ? "bold" : "normal", // 강조
                color: isCurrentUser ? "blue" : "black", // 강조 색상
              }}
            >
              {index + 1}. {user.username} - ${user.totalAssets.toFixed(2)}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Ranking;
