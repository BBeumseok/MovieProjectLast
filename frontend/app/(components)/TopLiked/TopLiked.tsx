// components/TopLikedMovies/TopLikedMovies.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { IoIosArrowDropleft, IoIosArrowDropright } from "react-icons/io";
import { FaHeart, FaRegHeart, FaStar } from "react-icons/fa"; // 평점 및 좋아요 아이콘 추가
import styles from "@/(components)/TopLiked/TopLiked.module.css";
import { getTopLiked, getMovieByMovieId } from "@/_Service/MovieService";
import {
  fetchLikeStatus,
  updateLikeStatus,
  fetchLikeCounts,
} from "@/_Service/LikeService"; // 좋아요 관련 서비스 추가
import { getPostsByMovieId } from "@/_Service/PostService"; // 포스트 가져오는 서비스 추가
import { useAuth } from "@/(context)/AuthContext"; // 회원 정보 가져오기

type Movie = {
  id: string;
  title: string;
  poster_path: string;
  averageRating: number; // 평균 평점 필드 추가
  likesCount: number; // 좋아요 수 필드 추가
  userHasLiked: boolean; // 사용자 좋아요 여부 필드 추가
};

export default function TopLikedMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(0);
  const [loadedImages, setLoadedImages] = useState<number>(0);
  const { memberNo } = useAuth(); // 회원 정보 가져오기

  const MOVIES_PER_PAGE = 5;
  const POSTER_WIDTH = 200;
  const POSTER_MARGIN = 20;

  useEffect(() => {
    fetchMovies();

    const handleRefreshMovies = () => {
      fetchMovies();
    };

    window.addEventListener("refreshMovies", handleRefreshMovies);

    return () => {
      window.removeEventListener("refreshMovies", handleRefreshMovies);
    };
  }, [memberNo]); // 의존성에 memberNo 추가

  const fetchMovies = async () => {
    try {
      const movieIds = await getTopLiked();
      const movieDetails: Movie[] = [];

      for (const id of movieIds) {
        const details = await getMovieByMovieId(id);

        const likedStatus = memberNo
          ? await fetchLikeStatus(memberNo, id)
          : false;
        const likeCount = await fetchLikeCounts(id);
        const posts = await getPostsByMovieId(id);
        const averageRating = calculateAverageRating(posts);

        movieDetails.push({
          ...details,
          userHasLiked: likedStatus,
          likesCount: likeCount,
          averageRating: averageRating || 0,
        });
      }

      setMovies(movieDetails);
    } catch (error) {
      console.error("Error fetching movies:", error);
    }
  };

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

  const handleLikeClick = async (movieId: string, liked: boolean) => {
    if (!memberNo) {
      console.warn("You must be logged in to like a movie.");
      return;
    }

    try {
      await updateLikeStatus(memberNo, movieId, !liked);
      setMovies((prevMovies) =>
        prevMovies.map((movie) =>
          movie.id === movieId
            ? {
                ...movie,
                userHasLiked: !liked,
                likesCount: movie.likesCount + (liked ? -1 : 1),
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
                  className={`${styles.movieImg}`}
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
                  onClick={() => handleLikeClick(movie.id, movie.userHasLiked)}
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
