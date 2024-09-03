import axios from 'axios';
import {Member} from "@/(types)/types";
import {axiosInstance} from "@/(axiosInstance)/api";

export const login = async (username: string, password: string) => {
  try {
    const response = await axiosInstance.post('/login', { username, password });
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
    const response = await axiosInstance.get(`/member/check_auth`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const refreshAccessToken = async () => {
  try {
    const response = await axiosInstance.post('/member/check_auth/refresh');
    return response.data;
  } catch (error) {
    throw new Error('Failed to refresh token');
  }
};

export const logout = async () => {
  try {
    await axiosInstance.post('/member/logout');
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

// profile 유저 정보 가져오기
    export const getMemberDetails = async (): Promise<Member> => {
      try {
        const response = await axiosInstance.get('/member/profile');
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
    const response = await axiosInstance.post('/member/verifyPw', { password });
    return response.data.isValid;
  } catch (error) {
    console.error("Password verification failed", error);
    return false;
  }
};

// 닉네임 중복체크를 위해 입력된 '닉네임' 서버에 보내서 중복되는지 검증
export const checkNicknameDuplicate = async (nickname: string): Promise<boolean> => {
  try {
    const response = await axiosInstance.get('/member/checkNickname', { params: { nickname } });
    return response.data.isDuplicate;
  } catch (error) {
    console.error("닉네임 중복 체크 실패", error);
    return false;
  }
};

// 서버로 데이터 보내서 회원정보 업데이트
export const updateMember = async (updatePayload: any) => {
  try {
    const { data } = await axiosInstance.put<{ message: string; member: Member }>(
        "/member/update",
        updatePayload,
    );
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("서버 응답 에러:", error.response.data);
      throw new Error("개인정보 수정 중 오류가 발생했습니다.");
    } else {
      console.error("예상치 못한 에러:", error);
      throw new Error("예상치 못한 오류가 발생했습니다.");
    }
  }
};

// 서버로 회원 삭제 요청을 보내는 함수
export const deleteMember = async (memberNo: number) => {
  try {
    const response = await axiosInstance.delete<{ message: string }>(`/member/delete/${memberNo}`,
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error("서버 응답 에러:", error.response.data);
        throw new Error(error.response.data.message || "멤버 삭제 중 오류가 발생했습니다.");
      } else {
        console.error("요청 에러:", error.message);
        throw new Error("요청 중 오류가 발생했습니다.");
      }
    } else {
      console.error("예상치 못한 에러:", error);
      throw new Error("예상치 못한 오류가 발생했습니다.");
    }
  }
};

// otherProfile 유저 정보 가져오기
export const getOtherMemberDetails = async (nickname: string | null | undefined): Promise<Member> => {
  try {
    const response = await axiosInstance.get('/member/otherProfile', { params: { nickname } });
    console.log(response);
    return response.data;
  } catch (error) {
    console.error('남의 프로필 정보 가져오기 실패:', error);
    throw error;
  }
};