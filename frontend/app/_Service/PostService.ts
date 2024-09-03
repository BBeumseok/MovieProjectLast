import axios from 'axios';
import { PostDetails } from '../(types)/types';
import {axiosInstance} from "@/(axiosInstance)/api";

export const getPostsByMovieId = async (movieId: number): Promise<PostDetails[]> => {
    try {
        const response = await axiosInstance.get(`/posts/movie/${movieId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching posts by movie ID:", error);
        return [];
    }
};

export const regPost = async (content: string, rating: number, movieId: number, memberNick: string): Promise<void> => {
    try {
        const postData = {
            postContent: content,
            ratingStar: rating,
            movieId: movieId,
            memberNick: memberNick
        };
        console.log("Sending post data:", postData);
        await axiosInstance.post('/posts/register', postData);
        console.log("Post submitted successfully");
    } catch (error) {
        console.error("Error submitting post:", error);
        throw error;
    }
};

export const deletePost = async (postId: number) => {
    try {
      await axiosInstance.delete(`/posts/delete/${postId}`);
    } catch (error) {
      console.error("Failed to delete post:", error);
      throw error;
    }
};

export const getAverageRatingByMovieId = async (movieId: number) => {
    try {
        const response = await axiosInstance.get(`/posts/average-rating/${movieId}`);
        return response.data;
      } catch (error) {
        console.error("Error fetching average rating:", error);
        throw error;
      }
};

// memberNo 으로 posts 데이터 서버에서 가져오기.
export const getPostsByMemberNo = async (memberNo: number) => {
    try{
        const response = await axiosInstance.get(`/posts/${memberNo}`);
        return response.data;
    }catch(error){
        console.log("Error getting posts by memberNo:", error);
        return [];
    }
}