'use client'

import React, { useState, useEffect, useRef, type ElementRef, useCallback } from "react";
import styles from '@/@modal/(.)movies/details/[movieId]/MovieModal.module.css';
import { motion } from 'framer-motion';
import { getMovieByMovieId } from "@/_Service/MovieService";
import { getPostsByMovieId, getAverageRatingByMovieId } from "@/_Service/PostService";
import MovieHeader from '@/(components)/Modal/MovieHeader/MovieHeader';
import PostList from '@/(components)/Modal/PostList/PostList';
import PostForm from '@/(components)/Modal/PostForm/PostForm';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { MovieDetails, PostDetails } from "@/(types)/types";

const MovieModal: React.FC<{ movieId: string }> = ({ movieId }) => {
  const numericMovieId = parseInt(movieId, 10);
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostDetails[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const router = useRouter();
  const dialogRef = useRef<ElementRef<'dialog'>>(null);
  const [isClient, setIsClient] = useState(false);
  const scrollPosition = useRef(0);

  useEffect(() => {
    if (isClient) {
      scrollPosition.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPosition.current}px`;
      document.body.style.width = '100%';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        window.scrollTo(0, scrollPosition.current);
      };
    }
  }, [isClient]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [isClient]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const closeModal = () => {
    if (dialogRef.current) {
      dialogRef.current.close();
    }
    router.back();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const fetchMovieDetails = useCallback(async () => {
    try {
      setError(null);
      const details = await getMovieByMovieId(numericMovieId);
      setMovie(details);
      const fetchedPosts = await getPostsByMovieId(numericMovieId);
      setPosts(fetchedPosts);
      const averageRating = await getAverageRatingByMovieId(numericMovieId);
      setAverageRating(averageRating || 0);
  
      // CustomEvent 디스패치
      const event = new CustomEvent('refreshMovies');
      window.dispatchEvent(event);
    } catch (error) {
      console.error("Error fetching movie details:", error);
      setError("Failed to load movie details. Please try again.");
    }
  }, [numericMovieId]);

  useEffect(() => {
    fetchMovieDetails();
  }, [fetchMovieDetails]);

  if (error) {
    return <div className={styles.modalOverlay}>{error}</div>;
  }

  if (!movie) {
    return <div className={styles.modalOverlay}>Loading movie information...</div>;
  }

  if (!isClient) {
    return null;
  }

  return createPortal(
    <div className={styles.modalBackdrop} onClick={handleOverlayClick}>
      <dialog ref={dialogRef} className={styles.dialog} style={{ display: 'block' }}>
        <motion.div
          className={styles.modalContent}
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.content}>
            <MovieHeader movie={movie} averageRating={averageRating} />
            <PostForm movieId={numericMovieId} setPosts={setPosts} setAverageRating={setAverageRating} />
            <div className={styles.postListWrapper}>
              <PostList posts={posts} setPosts={setPosts} onDeletePost={fetchMovieDetails} closeModal={closeModal} />
            </div>
          </div>
        </motion.div>
      </dialog>
    </div>,
    document.getElementById('modal-root')!
  );
};

export default MovieModal;
