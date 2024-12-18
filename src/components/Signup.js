import React, { useState } from 'react';
import { auth, createUserWithEmailAndPassword } from '../firebase';
import { doc, setDoc, updateDoc, getFirestore } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { FieldValue } from 'firebase/firestore';

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

            // 기본 자산 정보 설정 (주식 정보는 삭제)
            const initialAssets = ['AAPL', 'GOOG', 'AMZN', 'TSLA', 'MSFT', 'META'].map(symbol => {
                return {
                    stockName: symbol,
                    quantity: 0,
                    // price 필드 삭제
                };
            });

            // Firestore에 사용자 데이터 저장
            const userRef = doc(db, 'users', username);
            await setDoc(userRef, {
                uid: user.uid,
                email: email,
                username: username,
                assets: initialAssets, // 기본 자산 정보
                cash: 100000, // 기본 현금
            });


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
