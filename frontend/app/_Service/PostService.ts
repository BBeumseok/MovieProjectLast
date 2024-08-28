import axios from "axios";
import { PostDetails } from "../(types)/types";

export const getPostsByMovieId = async (
  movieId: number
): Promise<PostDetails[]> => {
  try {
    const response = await axios.get(`/api/posts/movie/${movieId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching posts by movie ID:", error);
    return [];
  }
};

export const regPost = async (
  content: string,
  rating: number,
  movieId: number,
  memberNick: string
): Promise<void> => {
  try {
    const postData = {
      postContent: content,
      ratingStar: rating,
      movieId: movieId,
      memberNick: memberNick,
    };
    console.log("Sending post data:", postData);
    await axios.post("/api/posts/register", postData);
    console.log("Post submitted successfully");
  } catch (error) {
    console.error("Error submitting post:", error);
    throw error;
  }
};

export const deletePost = async (postId: number) => {
  try {
    await axios.delete(`/api/posts/delete/${postId}`);
  } catch (error) {
    console.error("Failed to delete post:", error);
    throw error;
  }
};

export const getAverageRatingByMovieId = async (movieId: number) => {
  try {
    const response = await axios.get(`/api/posts/average-rating/${movieId}`);
    console.log("API Response for Average Rating:", response.data); // 응답 확인을 위한 로그 추가
    return response.data;
  } catch (error) {
    console.error("Error fetching average rating:", error);
    throw error;
  }
};

// memberNo 으로 posts 데이터 서버에서 가져오기.
export const getPostsByMemberNo = async (memberNo: number) => {
  try {
    const response = await axios.get(`/api/posts/${memberNo}`);
    return response.data;
  } catch (error) {
    console.log("Error getting posts by memberNo:", error);
    return [];
  }
};
