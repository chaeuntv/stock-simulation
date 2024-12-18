import React, { useState } from 'react';
import { auth, createUserWithEmailAndPassword } from '../firebase';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [username, setUsername] = useState(''); // 아이디
    const db = getFirestore(); // Firestore 초기화
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError(''); // 기존 오류 메시지 초기화

        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            // Firebase v9 문법: 계정 생성
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await setDoc(doc(db, 'users', username), {
                uid: user.uid,
                email: email,
                username: username,
                assets: [
                    { stockName: 'Apple', quantity: 0, price: 0 },  // 기본 자산 정보 추가
                    { stockName: 'Tesla', quantity: 0, price: 0 }
                ], 
                cash: 100000,
            })
            alert('회원가입 성공! 로그인해주세요.');
            navigate('/Login');
        } catch (err) {
            console.error('Signup Error:', err.message);
            setError(`회원가입 실패: ${err.message}`);
        }
    };

    return (
        <div>
            <h2>회원가입</h2>
            <form onSubmit={handleSignup}>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Id:</label>
                    <input
                        type="text"
                        placeholder="아이디"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Confirm Password:</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">회원가입</button>
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </form>
        </div>
    );
};

export default Signup;
