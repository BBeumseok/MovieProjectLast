import React, {useState, useEffect, useRef, useCallback} from "react";
import { FaStar, FaRegStar } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./PostList.module.css";
import { PostDetails } from "@/(types)/types";
import { useAuth } from "@/(context)/AuthContext";
import { deletePost } from "@/_Service/PostService";
import { useRouter } from 'next/navigation';
import {getMemberImage} from "@/_Service/MemberService";

interface PostListProps {
  posts: PostDetails[];
  setPosts: React.Dispatch<React.SetStateAction<PostDetails[]>>; // 부모 컴포넌트로부터 setPosts 받기
  onDeletePost: () => void;
  closeModal: () => void;
}

const PostList: React.FC<PostListProps> = ({
  posts,
  setPosts,
  onDeletePost,
  closeModal
}) => {
  const { memberNo } = useAuth();
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [displayedPosts, setDisplayedPosts] = useState<PostDetails[]>([]);
  const [postIndex, setPostIndex] = useState(5);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<{ [key: number]: string | null }>({});

  const handleClick = useCallback(async (post: PostDetails) => {
    console.log('포스트멤버닉'+post.memberNick);
    await closeModal();
    setTimeout(() => {
      router.push(`/member/otherProfile?otherNick=${post.memberNick}`);
    }, 100)
  }, [closeModal]);

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

  const fetchProfileImages = async (posts) => {
    const images = await Promise.all(
        posts.map(async (post) => {
          if (post.memberNo) {
            try {
              const image = await getMemberImage(post.memberNo);
              return { postId: post.postId, image };
            } catch (error) {
              console.error(`Error fetching profile image for postId ${post.postId}:`, error);
              return { postId: post.postId, image: null };
            }
          }
          return { postId: post.postId, image: null };
        })
    );

    return images.reduce((acc, { postId, image }) => {
      acc[postId] = image;
      return acc;
    }, {} as { [key: number]: string | null });
  };

  useEffect(() => {
    const loadImages = async () => {
      const imageMap = await fetchProfileImages(posts);
      setProfileImage(imageMap);
    };

    if (displayedPosts.length === 0) {
      const initialPosts = posts.slice(0, postIndex);
      setDisplayedPosts(initialPosts);
      loadImages();
    } else {
      loadImages();
    }
  }, [posts]);

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
            <div className={styles.profileImage}>
              <img
                src={profileImage[post.postId] || '/profile/basic.png'}
                alt="Profile Image"
                className={styles.profileImage}
                layout="responsive" // 이 속성은 필요에 따라 조절
                width={100} // 적절한 너비
                height={100} // 적절한 높이
              />
            </div>
            <button onClick={() => handleClick(post)} className={styles.postNickButton}>{post.memberNick}</button>
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
