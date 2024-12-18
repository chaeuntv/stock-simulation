// src/components/Login.js
import React, { useState } from 'react';
import { auth, signInWithEmailAndPassword } from '../firebase'; // firebase.js에서 가져오기
import { useNavigate, Link } from 'react-router-dom';
import { collection, getDocs, getFirestore } from 'firebase/firestore';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const db = getFirestore();

  // handleLogin 함수 정의
    const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); // 오류 초기화

        try {
            // Firestore에서 입력한 아이디로 이메일 검색
            const usersRef = collection(db, 'users');
            const querySnapshot = await getDocs(usersRef);

            let email = null;
            querySnapshot.forEach((doc) => {
                if (doc.data().username === username) {
                    email = doc.data().email;
                }
            });

            if (!email) {
                alert('아이디가 존재하지 않습니다.');
                return;
            }

            // 이메일과 비밀번호로 로그인
            await signInWithEmailAndPassword(auth, email, password);
            alert('로그인 성공!');
            navigate('/dashboard'); // 로그인 성공 후 이동
        } catch (error) {
            console.error('Login error:', error.message);
            alert('로그인 실패: ' + error.message);
        }
    };

    return (
      <div>
          <h2>로그인</h2>
          <form onSubmit={handleLogin}>
              <input
                  type="text"
                  placeholder="아이디"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
              />
              <input
                  type="password"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
              />
              <button type="submit">로그인</button>
          </form>
          {/* 회원가입 페이지로 이동하는 링크 */}
          <p>
              아직 회원이 아니신가요? <Link to="/signup">회원가입</Link>
          </p>
      </div>
  );
}

export default Login;
