import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const fetchUserData = async (uid) => {
  try {
    // Firestore 쿼리: UID로 문서 검색
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

const Dashboard = () => {
  const [userData, setUserData] = useState(null); // 유저 데이터 상태
  const [loading, setLoading] = useState(true); // 로딩 상태

  useEffect(() => {
    const user = auth.currentUser;

    if (user) {
      fetchUserData(user.uid).then((fetchedData) => {
        setUserData(fetchedData); // 유저 데이터 상태 업데이트
        setLoading(false);
      });
    } else {
      console.error("No user is currently logged in.");
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <p>Loading...</p>; // 로딩 중일 때 표시
  }

  if (!userData) {
    return <p>User not found!</p>; // 데이터가 없을 때 표시
  }

  return (
    <div>
      <h1>Welcome, {userData.username}!</h1>
      <p>Email: {userData.email}</p>
      <p>Cash: {userData.cash}</p>
    </div>
  );
};

export default Dashboard;