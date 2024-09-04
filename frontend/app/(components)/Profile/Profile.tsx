import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import styles from "./Profile.module.css";
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
        // 입장한 사람 데이터 서버에서 가져오기
        const fetchMemberDetails = async () => {
            try {
                // 개인정보 가져오기
                const data = await getMemberDetails();
                setMember(data);
                // 찜한 영화 가져오기
                const likedMovies = await getLikedMovies(data.memberNo);
                // 내가 쓴 한 줄평 가져오기
                const postData = await getPostsByMemberNo(data.memberNo);
                setPosts(postData);
                // 프로필 사진 가져오기
                const imageUrl = await fetchImage(data.memberNo);
                setProfileImageUrl(imageUrl);
                // 찜한 영화 id 로 영화 정보 다 가져오기
                const movieDetailsPromises = likedMovies.map((movieId: number) => getMovieByMovieId(movieId));
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
    // 최신화하는 함수
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
                    <ProfilePostList posts={posts}
                                     onProfileUpdate={handleReload}/>
                    <LikeList movies={movies}
                              onProfileUpdate={handleReload}/>
                </div>
            </div>
        </div>
    );
};

export default Profile;