"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { MovieDetails } from "@/(types)/types";
import styles from "./Search.module.css";
import Link from "next/link";
import { FaHeart, FaRegHeart, FaStar } from "react-icons/fa"; // 평점 및 좋아요 아이콘 추가
import RainEffect from "@/(components)/RainEffect/RainEffect";
import {
  fetchLikeStatus,
  updateLikeStatus,
  fetchLikeCounts,
} from "@/_Service/LikeService"; // 좋아요 관련 서비스 추가
import { getPostsByMovieId } from "@/_Service/PostService"; // 포스트 가져오는 서비스 추가
import { useAuth } from "@/(context)/AuthContext"; // 회원 정보 가져오기

const Search = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const searchTerm = searchParams.get("keyword") || "";
  const [initialSearchTerm, setInitialSearchTerm] = useState(searchTerm); // 초기 검색어 상태 저장
  const [results, setResults] = useState<MovieDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const prevSearchTermRef = useRef<string | null>(null);
  const initialFetchRef = useRef<boolean>(false);
  const { memberNo } = useAuth(); // 회원 정보 가져오기

  const fetchResults = async (searchTerm: string, page: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/movies/search?keyword=${encodeURIComponent(
          searchTerm
        )}&page=${page}`
      );
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          const moviesWithDetails = await Promise.all(
            data.map(async (movie: MovieDetails) => {
              const likedStatus = memberNo
                ? await fetchLikeStatus(memberNo, movie.id)
                : false;
              const likeCount = await fetchLikeCounts(movie.id);
              const posts = await getPostsByMovieId(movie.id);
              const averageRating = calculateAverageRating(posts);
              return {
                ...movie,
                userHasLiked: likedStatus,
                likesCount: likeCount,
                averageRating: averageRating || 0,
              };
            })
          );

          setResults((prevResults) => [...prevResults, ...moviesWithDetails]);
          setHasMore(data.length > 0);
        } else {
          console.error("Unexpected response format:", data);
          setHasMore(false);
        }
      } else {
        console.error("검색 결과를 가져오는 데 실패했습니다");
      }
    } catch (error) {
      console.error("검색 결과를 가져오는 중 오류가 발생했습니다:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageRating = (posts: { ratingStar: number }[]) => {
    if (posts.length === 0) return 0;

    const totalRating = posts.reduce((sum, post) => sum + post.ratingStar, 0);
    return totalRating / posts.length;
  };

  const resetSearch = useCallback(() => {
    setResults([]);
    setPage(1);
    setHasMore(true);
    fetchResults(searchTerm, 1);
  }, [searchTerm]);

  useEffect(() => {
    const currentURL = window.location.href;
    const expectedURL = `http://localhost:3000/movies/search?keyword=${encodeURIComponent(
      searchTerm
    )}`;

    if (
      currentURL === expectedURL &&
      (prevSearchTermRef.current !== searchTerm || !initialFetchRef.current)
    ) {
      resetSearch();
      prevSearchTermRef.current = searchTerm;
      initialFetchRef.current = true;
    }
  }, [searchTerm, resetSearch, pathname]);

  useEffect(() => {
    if (page > 1) {
      fetchResults(searchTerm, page);
    }
  }, [page]);

  const lastPosterElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setPage((prevPage) => prevPage + 1);
      }
    });

    if (lastPosterElementRef.current) {
      observer.current.observe(lastPosterElementRef.current);
    }
  }, [loading, hasMore]);

  useEffect(() => {
    // pathname이 /movies/search 일 때만 초기 검색어 설정
    if (pathname === "/movies/search") {
      setInitialSearchTerm(searchTerm);
    }
  }, [pathname, searchTerm]);

  const handleLikeClick = async (movieId: string, liked: boolean) => {
    if (!memberNo) {
      console.warn("You must be logged in to like a movie.");
      return;
    }

    try {
      await updateLikeStatus(memberNo, movieId, !liked);
      setResults((prevResults) =>
        prevResults.map((movie) =>
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
    <div className={styles.main}>
      <div className={styles.description}>
        <div className={styles.searchText}>
          Search results for "{initialSearchTerm}"{" "}
        </div>
      </div>
      <div className={styles.posterSection}>
        <div className={styles["movie-items"]}>
          {results.map((movie, index) => {
            const isLastElement = results.length === index + 1;
            return (
              <div
                key={movie.id}
                className={styles["movie-item"]}
                ref={isLastElement ? lastPosterElementRef : null}
              >
                <Link href={`/movies/details/${movie.id}`}>
                  <img
                    src={`https://image.tmdb.org/t/p/w300/${movie.poster_path}`}
                    alt={`Poster for ${movie.title}`}
                    className={styles["movie-img"]}
                  />
                </Link>
                <div className={styles.ratingLikeSection}>
                  <div className={styles.averageRating}>
                    <FaStar />{" "}
                    {movie.averageRating ? movie.averageRating.toFixed(1) : "0"}
                  </div>
                  <button
                    className={`${styles.likeButton} ${
                      movie.userHasLiked ? styles.liked : ""
                    }`}
                    onClick={() =>
                      handleLikeClick(movie.id, movie.userHasLiked)
                    }
                  >
                    {movie.userHasLiked ? <FaHeart /> : <FaRegHeart />}
                    <span className={styles.likesCount}>
                      {movie.likesCount}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className={styles.searchText}>{loading && <p>Loading...</p>}</div>
        <div className={styles.searchText}>
          {!hasMore && <p>No more results</p>}
        </div>
      </div>
    </div>
  );
};

export default Search;
