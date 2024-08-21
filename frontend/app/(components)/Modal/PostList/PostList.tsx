import React, { useState, useEffect, useRef } from "react";
import { FaStar, FaRegStar } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./PostList.module.css";
import { PostDetails } from "@/(types)/types";
import { useAuth } from "@/(context)/AuthContext";
import { deletePost } from "@/_Service/PostService";

interface PostListProps {
  posts: PostDetails[];
  setPosts: React.Dispatch<React.SetStateAction<PostDetails[]>>; // 부모 컴포넌트로부터 setPosts 받기
  onDeletePost: () => void;
}

const PostList: React.FC<PostListProps> = ({
  posts,
  setPosts,
  onDeletePost,
}) => {
  const { memberNo } = useAuth();
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [displayedPosts, setDisplayedPosts] = useState<PostDetails[]>([]);
  const [postIndex, setPostIndex] = useState(5);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const initialPosts = posts.slice(0, postIndex);
    setDisplayedPosts(initialPosts);
  }, [posts, postIndex]);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePosts();
        }
      },
      { threshold: 1.0 }
    );

    if (observerRef.current) {
      observer.current.observe(observerRef.current);
    }

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [displayedPosts]);

  const loadMorePosts = () => {
    const newPosts = posts.slice(postIndex, postIndex + 5);
    setDisplayedPosts((prevPosts) => [...prevPosts, ...newPosts]);
    setPostIndex((prevIndex) => prevIndex + 5);
  };

  const renderStars = (ratingStar: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= ratingStar) {
        stars.push(<FaStar key={i} className={styles.star} />);
      } else {
        stars.push(<FaRegStar key={i} className={styles.star} />);
      }
    }
    return stars;
  };

  const toggleExpand = (postId: number) => {
    setExpandedPost(expandedPost === postId ? null : postId);
  };

  // 수정된 부분 start
  const removeBasePath = (filePath: string) => {
    const basePathToRemove =
      "C:\\teamproject\\MovieProjectLast\\frontend\\public\\profile\\";
    console.log("Original path:", filePath);
    const newPath = filePath.replace(basePathToRemove, "");
    console.log("New path:", newPath);
    return newPath;
  };
  // 수정된 부분 end

  const handleDeletePost = async (postId: number) => {
    try {
      await deletePost(postId);
      const updatedPosts = posts.filter((post) => post.postId !== postId);
      setPosts(updatedPosts);
      onDeletePost();
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  return (
    <div className={styles.postsList}>
      <AnimatePresence>
        {displayedPosts.map((post) => (
          <motion.div
            key={post.postId}
            className={`${styles.post} ${
              expandedPost === post.postId ? styles.expanded : ""
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <div className={styles.postHeader}>
              {renderStars(post.ratingStar)}
            </div>
            {/* 추가한 부분 start */}
            <div className={styles.profileImage}>
              {console.log(
                "Image path:",
                `/profile/${removeBasePath(post.filePath)}`
              )}
              <img
                src={`/profile/${removeBasePath(post.filePath)}`}
                alt="Profile Image"
                className={styles.profileImage}
              />
            </div>
            {/* 추가한 부분 end */}
            <div className={styles.postNick}>{post.memberNick}</div>
            <div
              className={`${styles.postContent} ${styles.cursorPointer}`}
              onClick={() => toggleExpand(post.postId)}
            >
              {expandedPost === post.postId
                ? post.postContent
                : post.postContent
                ? post.postContent.split("\n")[0]
                : ""}
            </div>
            <div className={styles.postFooter}>
              <div>{post.regDate}</div>
              {memberNo === post.memberNo && (
                <MdDelete
                  onClick={() => handleDeletePost(post.postId)}
                  className={`${styles.deleteButton} ${styles.cursorPointer}`}
                />
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={observerRef} className={styles.observer} />
    </div>
  );
};

export default PostList;
