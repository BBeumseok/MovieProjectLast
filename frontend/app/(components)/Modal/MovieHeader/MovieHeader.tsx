import React, { useState, useEffect } from "react";
import styles from "./MovieHeader.module.css";
import { FaHeart, FaRegHeart, FaStar } from "react-icons/fa";
import { MovieDetails } from "@/(types)/types";
import { useAuth } from "@/(context)/AuthContext";
import {
  fetchLikeStatus,
  updateLikeStatus,
  fetchLikeCounts,
} from "@/_Service/LikeService";
import {
  getVideosByMovieId,
  getMoviesByMovieId,
} from "@/_Service/MovieService";

interface MovieHeaderProps {
  movie: MovieDetails;
  averageRating: number;
}

const MovieHeader: React.FC<MovieHeaderProps> = ({ movie, averageRating }) => {
  const { memberNo } = useAuth();
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingContent, setLoadingContent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [images, setImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchLikeStatusAndCounts = async () => {
      if (memberNo === null) return;

      try {
        const likedStatus = await fetchLikeStatus(memberNo, movie.id);
        setLiked(likedStatus);

        const count = await fetchLikeCounts(movie.id);
        setLikesCount(count);
      } catch (error) {
        console.error("Error fetching like status or likes count:", error);
      }
    };

    fetchLikeStatusAndCounts();
  }, [memberNo, movie.id]);

  useEffect(() => {
    const fetchVideoAndImages = async () => {
      setLoadingContent(true);
      try {
        const videoKey = await getVideosByMovieId(movie.id);
        if (videoKey) {
          setVideoKey(videoKey);
          console.log("Video Key: ", videoKey); // videoKey 확인
        } else {
          const imagesData = await getMoviesByMovieId(movie.id);
          setImages(imagesData);
        }
      } catch (error) {
        console.error("트레일러 요청 실패: ", error);
      } finally {
        setLoadingContent(false);
      }
    };

    fetchVideoAndImages();
  }, [movie.id]);

  useEffect(() => {
    if (images.length > 1) {
      const intervalId = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 3000);
      return () => clearInterval(intervalId);
    }
  }, [images]);

  const handleLikeClick = async () => {
    if (memberNo === null) {
      setError("로그인이 필요합니다.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await updateLikeStatus(memberNo, movie.id, !liked);
      setLiked(!liked);

      const count = await fetchLikeCounts(movie.id);
      setLikesCount(count);

      // CustomEvent 디스패치
      const event = new CustomEvent("refreshMovies");
      window.dispatchEvent(event);
    } catch (err) {
      setError("좋아요 상태 업데이트 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.header}>
      <div className={styles.topSection}>
        <div className={styles.posterWrapper}>
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={`Poster for ${movie.title}`}
            className={styles.poster}
          />
          <div className={styles.ratingLikeSection}>
            <span className={styles.averageRating}>
              <FaStar /> {averageRating.toFixed(1)}
            </span>
            <button
              className={`${styles.likeButton} ${liked ? styles.liked : ""}`}
              onClick={handleLikeClick}
              disabled={loading}
            >
              {liked ? <FaHeart /> : <FaRegHeart />}
              <span className={styles.likesCount}>{likesCount}</span>
            </button>
          </div>
        </div>
        {loadingContent ? (
          <div className={styles.loader}></div>
        ) : videoKey ? (
          <div className={styles.video}>
            <div className={styles.iframeContainer}>
              <iframe
                className={styles.iframe}
                src={`https://www.youtube.com/embed/${videoKey}`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        ) : images.length > 1 ? (
          <div className={styles.imageSlider}>
            {images.map((image, index) => (
              <img
                key={index}
                src={`https://image.tmdb.org/t/p/w500${image}`}
                alt="Movie backdrop"
                className={`${styles.sliderImage} ${
                  index === currentImageIndex ? styles.active : ""
                } ${
                  index ===
                  (currentImageIndex - 1 + images.length) % images.length
                    ? styles.prev
                    : ""
                } ${
                  index === (currentImageIndex + 1) % images.length
                    ? styles.next
                    : ""
                }`}
              />
            ))}
          </div>
        ) : images.length === 1 ? (
          <div className={styles.singleImageWrapper}>
            <img
              src={`https://image.tmdb.org/t/p/w500${images[0]}`}
              alt="Movie backdrop"
              className={styles.singleImage}
            />
          </div>
        ) : null}
      </div>
      <div className={styles.movieInfo}>
        <h1>{movie.title}</h1>
        <p>{movie.overview}</p>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
};

export default MovieHeader;
