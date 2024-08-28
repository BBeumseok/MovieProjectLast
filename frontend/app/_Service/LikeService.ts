import axios from "axios";

export const fetchLikeStatus = async (memberNo: number, movieId: number) => {
  try {
    const response = await axios.get("/api/likes/status", {
      params: {
        memberNo,
        movieId,
      },
    });
    console.log("Like Status Response:", response.data); // 추가된 로그
    return response.data;
  } catch (error) {
    console.error("Error fetching like status:", error);
    throw error;
  }
};

export const fetchLikeCounts = async (movieId: number) => {
  try {
    const response = await axios.get("/api/likes/likesMovie", {
      params: {
        movieId: movieId,
      },
    });
    console.log("Like Counts Response:", response.data); // 추가된 로그
    return response.data;
  } catch (error) {
    console.error("Error fetching like counts:", error);
    throw error;
  }
};

export const updateLikeStatus = async (
  memberNo: number,
  movieId: number,
  liked: boolean
) => {
  try {
    await axios.post("/api/likes/update", {
      memberNo,
      movieId,
      liked,
    });
    console.log("Like status updated successfully"); // 업데이트 성공 시 로그
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
