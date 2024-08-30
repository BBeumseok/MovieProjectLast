import React, {useState, useEffect, useCallback, useRef} from "react";
import axios from "axios";
import styles from "./OtherProfile.module.css";
import { MovieDetails, PostDetails} from "@/(types)/types";
import {useAuth} from '@/(context)/AuthContext';
import {getOtherMemberDetails} from "@/_Service/MemberService";
import {getLikedMovies, getMovieByMovieId} from "@/_Service/MovieService";
import {getPostsByMemberNo} from "@/_Service/PostService";
import OtherLikeList from "@/(components)/OtherProfile/OtherLikeList/OtherLikeList";
import OtherPostList from "@/(components)/OtherProfile/OtherPostList/OtherPostList";
import Modal from "@/(components)/OtherProfile/ImageModal/ImageModal";

interface OtherProfileProps {
    otherNick?: string | null
}

const OtherProfile: React.FC = ({otherNick}: OtherProfileProps) => {
    const {isLoggedIn} = useAuth();
    const [posts, setPosts] = useState<PostDetails[]>([]);
    const [movies, setMovies] = useState<MovieDetails[]>([]);
    const [profileImageUrl, setProfileImageUrl] = useState<string>("/profile/basic.png");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchImage = useCallback(async (memberNo: number): Promise<string> => {
        try {
            const response = await axios.get(`/api/image/read/${memberNo}`, {
                responseType: "blob",
            });

            if (response.data) {
                return URL.createObjectURL(response.data);
            }
        } catch (error: any) {
            if (error.response?.status === 404) {
                // 파일이 없어서 발생한 에러인 경우 무시
                console.log("프로필 사진이 존재하지 않습니다.");
            } else {
                console.error("이미지 조회 실패", error);
            }
        }
        return "/profile/basic.png";
    }, []);

    useEffect(() => {
        let isCancelled = false;
        // OtherProfile 데이터 서버에서 가져오기
        const fetchMemberDetails = async () => {
            if (!isLoggedIn) {
                return;
            }
            try {
                const otherData = await getOtherMemberDetails(otherNick);
                const likedMovies = await getLikedMovies(otherData.memberNo);
                const postData = await getPostsByMemberNo(otherData.memberNo);

                if (!isCancelled) {
                    setPosts(postData);
                    const imageUrl = await fetchImage(otherData.memberNo);
                    setProfileImageUrl(imageUrl);
                    const movieDetailsPromises = likedMovies.map((movieId: number) => getMovieByMovieId(movieId));
                    const movieDetails = await Promise.all(movieDetailsPromises);
                    if (!isCancelled) {
                        setMovies(movieDetails.filter((movie): movie is MovieDetails => movie !== null));
                    }
                }
            } catch (error) {
                console.error('데이터 가져오기 실패', error);
            }
        };

        fetchMemberDetails();

        return () => {
            isCancelled = true;
        };
    }, [isLoggedIn, fetchImage, otherNick]);

    const handleImageClick = () => {
        setIsModalOpen(true); // 모달 열기
    };

    const handleCloseModal = () => {
        setIsModalOpen(false); // 모달 닫기
    };

    if (!isLoggedIn) {
        return null;
    }

    return (
        <div className={styles.container}>
            <div className={styles.topSection}>
                <div className={styles.profileSection}>
                    <div className={styles.profileImage}>
                        <img
                            src={profileImageUrl}
                            alt="Profile"
                            className={styles.profileImageContent}
                            onError={(e) => {
                                e.currentTarget.src = "/profile/basic.png";
                            }}
                            onClick={handleImageClick} // 이미지 클릭 핸들러 추가
                        />
                    </div>
                    <div className={styles.nickname}>{otherNick}님</div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{display: "none"}}
                    />
                </div>
                <OtherPostList posts={posts}/>
            </div>
            <div className={styles.bottomSection}>
                <OtherLikeList movies={movies}/>
            </div>
            {isModalOpen && (
                <Modal imageUrl={profileImageUrl} onClose={handleCloseModal}/>
            )}
        </div>
    );
};


export default OtherProfile;