"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { IoIosArrowDropleft, IoIosArrowDropright } from "react-icons/io";
import { FaHeart, FaRegHeart, FaStar } from "react-icons/fa";
import styles from "./NowPlayingMovies.module.css";
import { getNowPlaying } from "@/_Service/MovieService";
import {
  fetchLikeStatus,
  updateLikeStatus,
  fetchLikeCounts,
} from "@/_Service/LikeService";
import { getPostsByMovieId } from "@/_Service/PostService"; // [1] 포스트 가져오는 API 함수 추가
import { useAuth } from "@/(context)/AuthContext";

type Movie = {
  id: string;
  title: string;
  poster_path: string;
  averageRating: number;
  likesCount: number;
  userHasLiked: boolean;
};

export default function NowPlayingMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(0);
  const [loadedImages, setLoadedImages] = useState<number>(0);
  const { memberNo } = useAuth();

  const MOVIES_PER_PAGE = 5;
  const POSTER_WIDTH = 200;
  const POSTER_MARGIN = 20;

  useEffect(() => {
    async function fetchMovies() {
      try {
        const data = await getNowPlaying();
        const moviesWithDetails = await Promise.all(
          data.map(async (movie) => {
            const likedStatus = memberNo
              ? await fetchLikeStatus(memberNo, movie.id)
              : false;
            const likeCount = await fetchLikeCounts(movie.id);
            const posts = await getPostsByMovieId(movie.id); // [2] 각 영화의 포스트 가져오기
            const averageRating = calculateAverageRating(posts); // [3] 포스트로부터 평균 평점 계산
            return {
              ...movie,
              userHasLiked: likedStatus,
              likesCount: likeCount,
              averageRating: averageRating || 0, // [4] 계산된 평균 평점 사용
            };
          })
        );
        setMovies(moviesWithDetails);
      } catch (error) {
        console.error("Error fetching movies:", error);
      }
    }
    fetchMovies();
  }, [memberNo]);

  // [5] 포스트로부터 평균 평점을 계산하는 함수 추가
  const calculateAverageRating = (posts: { ratingStar: number }[]) => {
    if (posts.length === 0) return 0;

    const totalRating = posts.reduce((sum, post) => sum + post.ratingStar, 0);
    return totalRating / posts.length;
  };

  const handlePrevClick = () => {
    setPage((prevPage) => Math.max(prevPage - 1, 0));
  };

  const handleNextClick = () => {
    setPage((prevPage) => {
      const maxPage = Math.ceil(movies.length / MOVIES_PER_PAGE) - 1;
      return Math.min(prevPage + 1, maxPage);
    });
  };

  const translateX =
    -page * (POSTER_WIDTH + POSTER_MARGIN * 2) * MOVIES_PER_PAGE;

  const handleImageLoad = () => {
    setLoadedImages((prevCount) => prevCount + 1);
  };

  // [6] 좋아요 버튼 클릭 핸들러 수정
  const handleLikeClick = async (movieId: string, liked: boolean) => {
    if (!memberNo) {
      console.warn("You must be logged in to like a movie.");
      return;
    }

    try {
      await updateLikeStatus(memberNo, movieId, !liked); // 좋아요 상태 업데이트
      setMovies((prevMovies) =>
        prevMovies.map((movie) =>
          movie.id === movieId
            ? {
                ...movie,

                userHasLiked: !liked, // 좋아요 상태 반전
                likesCount: movie.likesCount + (liked ? -1 : 1), // 좋아요 수 업데이트
              }
            : movie
        )
      );
    } catch (error) {
      console.error("좋아요 상태 업데이트 실패:", error);
    }
  };

  return (
    <div className={styles.container}>
      <button
        onClick={handlePrevClick}
        className={`${styles.navButton} ${page === 0 ? styles.hidden : ""}`}
        disabled={page === 0}
      >
        <IoIosArrowDropleft />
      </button>
      <div className={styles.sliderWrapper}>
        <div
          className={styles.movieItems}
          style={{ transform: `translateX(${translateX}px)` }}
        >
          {movies.map((movie, index) => (
            <div
              key={movie.id}
              className={`${styles.movieItem} ${
                index < MOVIES_PER_PAGE
                  ? loadedImages > index
                    ? styles.loaded
                    : styles.loading
                  : ""
              }`}
            >
              <Link href={`/movies/details/${movie.id}`}>
                <img
                  src={`https://image.tmdb.org/t/p/w300/${movie.poster_path}`}
                  alt={`Poster for ${movie.title}`}
                  className={styles.movieImg}
                  onLoad={handleImageLoad}
                />
              </Link>
              <div className={styles.ratingLikeSection}>
                <div className={styles.averageRating}>
                  <FaStar />{" "}
                  {movie.averageRating && movie.averageRating > 0
                    ? movie.averageRating.toFixed(1)
                    : "0"}
                </div>
                <button
                  className={`${styles.likeButton} ${
                    movie.userHasLiked ? styles.liked : ""
                  }`}

                  onClick={() => handleLikeClick(movie.id, movie.userHasLiked)} // [7] 좋아요 버튼 클릭 핸들러 적용
                >
                  {movie.userHasLiked ? <FaHeart /> : <FaRegHeart />}
                  <span className={styles.likesCount}>{movie.likesCount}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={handleNextClick}
        className={`${styles.navButton} ${
          (page + 1) * MOVIES_PER_PAGE >= movies.length ? styles.hidden : ""
        }`}
        disabled={(page + 1) * MOVIES_PER_PAGE >= movies.length}
      >
        <IoIosArrowDropright />
      </button>
    </div>
  );
}
