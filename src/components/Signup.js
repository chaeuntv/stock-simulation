import React, { useState, useEffect } from 'react';
import { auth, createUserWithEmailAndPassword } from '../firebase';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [username, setUsername] = useState(''); // 아이디
    const [stocks, setStocks] = useState([]); // 주식 정보 상태
    const db = getFirestore(); // Firestore 초기화
    const navigate = useNavigate();

    // stocks.json 파일을 불러오는 함수
    const fetchStocksData = async () => {
        try {
            const response = await fetch('/stocks.json');
            const data = await response.json();
            setStocks(data); // 주식 데이터를 상태에 저장
        } catch (error) {
            console.error('주식 데이터를 불러오는 데 실패했습니다:', error);
            setError('주식 데이터를 불러오는 데 실패했습니다.');
        }
    };

    // 회원가입 처리 함수
    const handleSignup = async (e) => {
        e.preventDefault();
        setError(''); // 기존 오류 메시지 초기화

        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        if (stocks.length === 0) {
            setError('주식 정보를 불러오는 데 실패했습니다.');
            return;
        }

        try {
            // Firebase v9 문법: 계정 생성
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 주식 정보를 기반으로 기본 자산 설정
            const initialAssets = Array.from(new Set(stocks.map(stock => stock.symbol))) // 주식 심볼 중복 제거
                .map(symbol => {
                    const stockData = stocks.filter(stock => stock.symbol === symbol); // 각 주식의 가격 데이터 찾기
                    const initialPrice = stockData[stockData.length - 1].price; // 가장 최근 가격을 초기 가격으로 설정
                    return {
                        stockName: symbol,
                        quantity: 0, // 초기 보유 수량
                        cumulativeBuyPrice: 0, // 초기 누적 구매 가격
                        cumulativeSellPrice: 0, // 초기 누적 판매 가격
                    };
                });

            // Firestore에 사용자 데이터 저장
            const userRef = doc(db, 'users', username);
            await setDoc(userRef, {
                uid: user.uid,
                email: email,
                username: username,
                assets: initialAssets, // 주식 정보를 포함한 기본 자산 정보
                cash: 100000, // 기본 현금
            });

            alert('회원가입 성공! 로그인해주세요.');
            navigate('/Login');
        } catch (err) {
            console.error('Signup Error:', err.message);
            setError(`회원가입 실패: ${err.message}`);
        }
    };

    // 컴포넌트가 마운트될 때 주식 정보 불러오기
    useEffect(() => {
        fetchStocksData(); // stocks.json 데이터를 불러옴
    }, []);

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
