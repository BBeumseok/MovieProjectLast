'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../(context)/AuthContext';
import Loading from './loading';
import SocialJoin from "@/(components)/Join/SocialJoin";

const JoinPage: React.FC = () => {
    const { isLoggedIn, checkAuth } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyLoginStatus = async () => {
            await checkAuth(); // 로그인 상태 확인
            setLoading(false); // 로딩 상태 해제
        };

        verifyLoginStatus();
    }, [checkAuth]);

    useEffect(() => {
        if (!loading && !isLoggedIn) {
            router.back(); // 로그인 상태가 아니면 이전 페이지로 이동
        }
    }, [isLoggedIn, loading, router]);

    if (loading) {
        return <Loading />; // 로딩 중에는 로딩 컴포넌트 렌더링
    }

    if (!isLoggedIn) {
        return null; // 로그인 상태가 아니면 프로필 페이지 렌더링 안 함
    }

    return <SocialJoin />;
};

export default JoinPage;
