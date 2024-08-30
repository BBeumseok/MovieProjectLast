'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../(context)/AuthContext';
import Loading from './loading';
import {useTheme} from "@/(components)/DarkModToggle/ThemeContext";
import MatrixRainEffect from "@/(components)/RainEffect/MatrixRainEffect";
import RainEffect from "@/(components)/RainEffect/RainEffect";
import OtherProfile from "@/(components)/OtherProfile/OtherProfile";

const ProfilePage: React.FC = () => {
    const { isLoggedIn, checkAuth } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const otherNick = searchParams.get('otherNick');
    const [loading, setLoading] = useState(true);
    const {theme} = useTheme();

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

    return (
        <div>
            {theme === 'dark' ? <MatrixRainEffect/> : <RainEffect/>}
            <OtherProfile
                otherNick={otherNick}
            />

        </div>
    );
};

export default ProfilePage;
