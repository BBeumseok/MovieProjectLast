import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import styles from "./profile.module.css";
import { Member, MovieDetails, PostDetails } from "@/(types)/types";
import { useAuth } from '@/(context)/AuthContext';
import { getMemberDetails } from "@/_Service/MemberService";
import { getLikedMovies, getMovieByMovieId } from "@/_Service/MovieService";
import { getPostsByMemberNo } from "@/_Service/PostService";
import Update from "@/(components)/Profile/Update/Update";
import LikeList from "@/(components)/Profile/LikeList/LikeList";
import ProfilePostList from "@/(components)/Profile/ProfilePostList/ProfilePostList";

const Profile: React.FC = () => {
    const { isLoggedIn } = useAuth();
    const [member, setMember] = useState<Member>({
        memberNo: 0,
        memberEmail: '',
        memberName: '',
        memberPhone: '',
        memberNick: '',
    });
    const [posts, setPosts] = useState<PostDetails[]>([]);
    const [movies, setMovies] = useState<MovieDetails[]>([]);
    const [profileImageUrl, setProfileImageUrl] = useState<string>("/profile/basic.png");
    const [triggerReload, setTriggerReload] = useState(false); // 리렌더링을 위한 상태

    const updateProfileImage = useCallback(async (memberNo: number) => {
        const newImageUrl = await fetchImage(memberNo);
        setProfileImageUrl(newImageUrl);
    }, []);

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
        const fetchMemberDetails = async () => {
            try {
                const data = await getMemberDetails();
                setMember(data);

                const likedMovies = await getLikedMovies(data.memberNo);

                const postData = await getPostsByMemberNo(data.memberNo);
                setPosts(postData);

                const imageUrl = await fetchImage(data.memberNo);
                setProfileImageUrl(imageUrl);

                const movieDetailsPromises = likedMovies.map(movieId => getMovieByMovieId(movieId));
                const movieDetails = await Promise.all(movieDetailsPromises);
                setMovies(movieDetails.filter((movie): movie is MovieDetails => movie !== null));

            } catch (error) {
                console.error('데이터 가져오기 실패', error);
            }
        };

        if (isLoggedIn) {
            fetchMemberDetails();
        }
    }, [isLoggedIn, fetchImage, triggerReload]);

    if (!isLoggedIn) {
        return null;
    }

    const handleReload = () => {
        setTriggerReload(prev => !prev); // 상태를 변경하여 리렌더링을 트리거
    };

    return (
        <div className={styles.container}>
            <div className={styles.mainContent}>
                <Update
                    member={member}
                    setMember={setMember}
                    fetchImage={fetchImage}
                    profileImageUrl={profileImageUrl}
                    setProfileImageUrl={setProfileImageUrl}
                    updateProfileImage={updateProfileImage}
                />
                <div className={styles.contentSection}>
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>나의 리뷰</h2>
                            <ProfilePostList posts={posts}
                                             onProfileUpdate={handleReload}/>
                    </div>
                    <LikeList movies={movies}
                              onProfileUpdate={handleReload}
                    />
                </div>
            </div>
        </div>
    );
};

export default Profile;