import {axiosInstance} from "@/(axiosInstance)/api";

export const fetchLikeStatus = async (memberNo: number, movieId: number) => {
    try {
        const response = await axiosInstance.get('/likes/status', {
            params: {
                memberNo,
                movieId,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching like status:", error);
        throw error;
    }
};

export const fetchLikeCounts = async (movieId: number) => {
    try {
        const response = await axiosInstance.get('/likes/likesMovie', {
            params: {
                movieId: movieId
            }
        });
        return response.data;
    } catch (error) {
        console.error("like 가져오기 from 영화 실패");
        throw error;
    }
};


export const updateLikeStatus = async (memberNo: number, movieId: number, liked: boolean) => {
    try {
        await axiosInstance.post('/likes/update', {
            memberNo,
            movieId,
            liked,
        });
    } catch (error) {
        console.error("Error updating like status:", error);
        throw error;
    }
};

export const fetchAverageRating = async (movieId: number): Promise<number> => {
  try {
    const response = await axios.get(`/api/movies/${movieId}/averageRating`);
    console.log("API Response for Average Rating:", response.data); // 응답 확인 로그 추가
    return response.data.averageRating;
  } catch (error) {
    console.error("Error fetching average rating:", error);
    throw error;
  }
};
