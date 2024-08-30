import axios from 'axios';
import {Member} from "@/(types)/types";

const API_URL = 'http://localhost:8000/api/member';

// Axios 인스턴스 생성
const axiosInstance = axios.create({
  withCredentials: true,
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


export const login = async (username: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:8000/api/login', 
        { username, password },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw error;
      } else {
        throw new Error('An unknown error occurred');
      }
    }
};

export const checkAuth = async () => {
  try {
    const response = await axios.get(`${API_URL}/check_auth`, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const refreshAccessToken = async () => {
  try {
    const response = await axios.post(`${API_URL}/check_auth/refresh`, {}, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw new Error('Failed to refresh token');
  }
};

export const logout = async () => {
  try {
    await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

// profile 유저 정보 가져오기
    export const getMemberDetails = async (): Promise<Member> => {
      try {
        const response = await axios.get('/api/member/profile', {
          baseURL: 'http://localhost:8000',
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        });
        console.log(response);
        return response.data;
  } catch (error) {
    console.error('프로필 정보 가져오기 실패:', error);
    throw error;
  }
};

// profile 정보수정 할 때 입력된 '현재 비밀번호' 서버에 보내서 실제 로그인한 사람의 비밀번호가 맞는지 검증하기.
export const verifyPassword = async (password: string): Promise<boolean> => {
  try {
    const response = await axios.post(
        "api/member/verifyPw",
        { password },
        {
          baseURL: "http://localhost:8000",
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
    );
    return response.data.isValid;
  } catch (error) {
    console.error("Password verification failed", error);
    return false;
  }
};


// 닉네임 중복체크를 위해 입력된 '닉네임' 서버에 보내서 중복되는지 검증
export const checkNicknameDuplicate = async (nickname: string): Promise<boolean> => {
  try {
    const response = await axios.get(`/api/member/checkNickname`, {
      params: { nickname },
      baseURL: "http://localhost:8000",
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
    return response.data.isDuplicate;
  } catch (error) {
    console.error("닉네임 중복 체크 실패", error);
    return false;
  }
};

// otherProfile 유저 정보 가져오기
export const getOtherMemberDetails = async (nickname: string | null | undefined): Promise<Member> => {
  try {
    const response = await axios.get('/api/member/otherProfile', {
      params: { nickname },
      baseURL: 'http://localhost:8000',
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });
    console.log(response);
    return response.data;
  } catch (error) {
    console.error('남의 프로필 정보 가져오기 실패:', error);
    throw error;
  }
};