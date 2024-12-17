// src/components/Login.js
import React, { useState } from 'react';
import { auth, signInWithEmailAndPassword } from '../firebase'; // firebase.js에서 가져오기

function Login() {
  const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // handleLogin 함수 정의
    const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); // 오류 초기화

        try {
            // 이메일과 비밀번호로 로그인 시도
            await signInWithEmailAndPassword(auth, email, password);
            alert('로그인 성공!');
        } catch (err) {
            console.error('Login Error:', err.message);
            setError(`로그인 실패: ${err.message}`);
        }
    };

  return (
    <div>
      <h2>로그인</h2>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호"
      />
      <button onClick={handleLogin}>로그인</button>
    </div>
  );
}

export default Login;
