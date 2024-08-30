import React, {useCallback, useEffect, useRef, useState} from "react";
import {FaRegStar, FaStar} from "react-icons/fa";
import styles from "./OtherPostList.module.css";
import {PostDetails} from "@/(types)/types";
import Link from "next/link";

// OtherProfile.tsx 에서 상속받은 것
interface PostListProps {
    posts: PostDetails[],
}

const POSTS_PER_PAGE = 10;
const POST_HEIGHT = 55;
const POST_MARGIN = 16;

const OtherPostList: React.FC<PostListProps> = ({posts}) => {
    const [visiblePosts, setVisiblePosts] = useState<PostDetails[]>([]);
    const [startIndex, setStartIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // 스크롤 관련 -
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

    // 별점 표기
    const renderStars = useCallback((ratingStar: number) => {
        return Array.from({length: 5}, (_, i) =>
            i < ratingStar ? <FaStar key={i} className={styles.star}/> : <FaRegStar key={i} className={styles.star}/>
        );
    }, []);

    return (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Review</h2>
            <div
                className={styles.postsList}
                ref={containerRef}
                onScroll={handleScroll}
            >
                <div style={{height: `${posts.length * (POST_HEIGHT + POST_MARGIN)}px`, position: 'relative'}}>

                    {/*상속받은 post.movieId 기준으로 나열*/}
                    {visiblePosts.map((post, index) => (
                        <div key={post.postId}
                             className={`${styles.post}`}
                             style={{
                                 position: 'absolute',
                                 top: `${(startIndex + index) * (POST_HEIGHT + POST_MARGIN)}px`,
                                 height: `${POST_HEIGHT}px`,
                                 width: 'calc(100%)',
                                 flex: 1
                             }}
                        >
                            <Link href={`/movies/details/${post.movieId}`}
                                  className={styles.postMovieTitle}>
                                <span>{post.movieTitle}</span>
                            </Link>

                            <Link href={`/movies/details/${post.movieId}`}
                                  className={styles.postHeader}>
                                {renderStars(post.ratingStar)}
                            </Link>

                            <Link href={`/movies/details/${post.movieId}`}
                                  className={styles.postContent}>
                                {post.postId
                                    ? post.postContent
                                    : post.postContent
                                        ? post.postContent.split("\n")[0]
                                        : ""}
                            </Link>

                            <Link href={`/movies/details/${post.movieId}`}
                                  className={styles.postDate}>
                                {post.regDate}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default React.memo(OtherPostList);