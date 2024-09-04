import axios from "axios";
import {logout} from "@/_Service/MemberService";

const API_URL = 'http://localhost:8000/api';

// Axios 인스턴스 생성
export const axiosInstance = axios.create({
    withCredentials: true,
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// 응답 인터셉터 설정
axiosInstance.interceptors.response.use(
    response => response,
    async error => {
        if (error.response && error.response.status === 401 && error.response.data.msg.includes('블랙리스트')) {
            console.error('Access token is blacklisted. Logging out...');
            try {
                await logout();
            } catch (logoutError) {
                console.error('Error logging out:', logoutError);
            }
        }
        return Promise.reject(error);
    }
);