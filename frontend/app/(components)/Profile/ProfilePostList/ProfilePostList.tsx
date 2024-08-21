import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaRegStar, FaStar } from "react-icons/fa";
import styles from "./ProfilePostList.module.css";
import { PostDetails } from "@/(types)/types";
import Link from "next/link";

interface PostListProps {
    posts: PostDetails[];
}

const POSTS_PER_PAGE = 10;
const POST_HEIGHT = 55;
const POST_MARGIN = 16;

const ProfilePostList: React.FC<PostListProps> = ({ posts }) => {
    const [visiblePosts, setVisiblePosts] = useState<PostDetails[]>([]);
    const [startIndex, setStartIndex] = useState(0);
    const [expandedPost, setExpandedPost] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const updateVisiblePosts = useCallback(() => {
        if (containerRef.current) {
            const scrollTop = containerRef.current.scrollTop;
            const newStartIndex = Math.floor(scrollTop / (POST_HEIGHT + POST_MARGIN));
            setStartIndex(newStartIndex);
            setVisiblePosts(posts.slice(newStartIndex, newStartIndex + POSTS_PER_PAGE));
        }
    }, [posts]);

    useEffect(() => {
        updateVisiblePosts();
    }, [updateVisiblePosts]);

    const handleScroll = useCallback(() => {
        updateVisiblePosts();
    }, [updateVisiblePosts]);

    const renderStars = useCallback((ratingStar: number) => {
        return Array.from({ length: 5 }, (_, i) =>
            i < ratingStar ? <FaStar key={i} className={styles.star} /> : <FaRegStar key={i} className={styles.star} />
        );
    }, []);

    const toggleExpand = useCallback((postId: number) => {
        setExpandedPost(prevId => prevId === postId ? null : postId);
    }, []);

    return (
        <div
            className={styles.postsList}
            ref={containerRef}
            onScroll={handleScroll}
        >
            <div style={{ height: `${posts.length * (POST_HEIGHT + POST_MARGIN)}px`, position: 'relative' }}>

                {visiblePosts.map((post, index) => (
                    <Link href={`/movies/details/${post.movieId}`}
                        key={post.postId}
                        className={`${styles.post} ${expandedPost === post.postId ? styles.expanded : ""}`}
                        onClick={() => toggleExpand(post.postId)}
                        style={{
                            position: 'absolute',
                            top: `${(startIndex + index) * (POST_HEIGHT + POST_MARGIN)}px`,
                            height: `${POST_HEIGHT}px`,
                            width: 'calc(100%)',
                            flex: 1
                        }}
                    >
                        <div className={styles.postMovieTitle}>
                            <span>{post.movieTitle}</span>
                        </div>

                        <div className={styles.postHeader}>
                            {renderStars(post.ratingStar)}
                            <div className={styles.postNick}>
                                {post.memberNick}
                            </div>
                        </div>
                        <div className={styles.postContent}>
                            {expandedPost === post.postId
                                ? post.postContent
                                : post.postContent
                                    ? post.postContent.split("\n")[0]
                                    : ""}
                        </div>
                        <div className={styles.postDate}>
                            {post.regDate}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default React.memo(ProfilePostList);