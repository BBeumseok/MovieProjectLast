import React, {
  useState,
  useEffect,
  useRef,
  ChangeEvent,
  FormEvent,
} from "react";
import axios from "axios";
import styles from "./profile.module.css";

import {Member, Errors, UpdateForm, Posts, Likes} from "@/(types)/types";
import { useAuth } from '@/(context)/AuthContext';
import {checkNicknameDuplicate, getMemberDetails, verifyPassword} from "@/_Service/MemberService";
import {Simulate} from "react-dom/test-utils";
import error = Simulate.error;
import {List} from "lucide-react";

// 프로필 컴포넌트!
const Profile: React.FC = () => {
    const { isLoggedIn } = useAuth();
    const [member, setMember] = useState<Member>({
        memberNo: 0,
        memberEmail: '',
        memberName: '',
        memberPhone: '',
        memberNick: '',
    });
    const [posts, setPosts] = useState<Posts[]>([]);
    const [likedMovies, setLikedMovies] = useState<List<Likes>[]>([]);
    const [updateForm, setUpdateForm] = useState<UpdateForm>({
        memberEmail: '',
        memberName: '',
        memberPhone: '',
        memberNick: '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
    });
    const [errors, setErrors] = useState<Errors>({});
    const [isEditing, setIsEditing] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [profileImagePath, setProfileImagePath] = useState("/profile/basic.png"); // 이미지 경로 상태 관리
    let [isNicknameChecked, setIsNicknameChecked] = useState(false);
    let [isNicknameDuplicate, setIsNicknameDuplicate] = useState(false);


  useEffect(() => {
    const fetchMemberDetails = async () => {

        try {
            const data = await getMemberDetails();

            setMember(data);
            console.error("멤버 데이터 !!!", data);


            await fetchLikedMovies(data.memberNo);
            await fetchImage(); // 이미지 불러오기 추가

            if (!data || data.memberNo == null) {
                console.error('memberNo가 응답에 포함되지 않음 : ', data);
                return;
            }

            console.error("멤버 데이터 !!!" + data);

          setUpdateForm((prevForm) => ({
              ...prevForm,
              memberEmail: data.memberEmail || '',
              memberName: data.memberName || '',
              memberNick: data.memberNick || '',
              memberPhone: data.memberPhone || '',
              currentPassword: '',
              newPassword: '',
              confirmNewPassword: '',
          }));

          if(!data.memberNo){
              console.error('memberNo가 응답에 포함되지 않음 : ',data);
              return;
          }

          setMember(data);
          console.log("설정된 멤버 데이터 : ",data)

          await fetchLikedMovies(data.memberNo);
      } catch (error) {
          console.error('데이터 가져오기 실패', error);
      }
    };


        const fetchLikedMovies = async (memberNo: number) => {
            try {
                console.log("멤버 번호 : "+memberNo)
                const response = await axios.get(`/api/movies/likes/${memberNo}`);
                setLikedMovies(response.data);
                console.log("리스폰스 데이터 !!!!!" + response);
            } catch (error) {
                console.error('좋아요 누른 영화 가져오기 실패 !!!', error);
            }
    };
    if (isLoggedIn) {
      fetchMemberDetails();
    }
  }, [isLoggedIn]);

  // 정보수정 성공시 페이지에 나타나는 정보도 같이 바뀌도록 설정
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUpdateForm({ ...updateForm, [name]: value });
  };

  // 프로필 이미지 업로드
    const handleProfileImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFile(file);
            const formData = new FormData();
            formData.append("file", file);
            formData.append("memberNo", member?.memberNo?.toString() || "");

            try {
                await axios.post("/api/image/upload", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                await fetchImage(); // 이미지 업로드 후 이미지 다시 불러오기
            } catch (error) {
                console.error("이미지 업로드 실패", error);
            }
        }
    };

// 이미지 조회
    const fetchImage = async () => {
        try {
            const response = await axios.get(`/api/image/read/${member?.memberNo}`, {
                responseType: "blob",
            });

            if (response.data) {
                const imageUrl = URL.createObjectURL(response.data);
                setProfileImagePath(imageUrl);
            } else {
                setProfileImagePath("/profile/basic.png"); // 이미지가 없을 경우 기본 이미지로 설정
            }
        } catch (error) {
            console.error("이미지 조회 실패", error);
            setProfileImagePath("/profile/basic.png"); // 에러 발생 시에도 기본 이미지로 설정
        }
    };

  // 이미지 수정
  const updateImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("memberNo", member?.memberNo?.toString() || "");

    try {
        await axios.put(`/api/image/update/${member?.memberNo}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    } catch (error) {
        console.error("이미지 수정 실패", error);
    }
  };

    // 프로필 이미지 삭제
    const handleProfileImageDelete = async () => {
        try {
            await axios.delete(`/api/image/delete/${member?.memberNo}`);
            setProfileImagePath("/profile/basic.png"); // 삭제 후 프로필 이미지 경로 업데이트
        } catch (error) {
            console.error("이미지 삭제 실패", error);
        }
    };

  // 비밀번호 미/오입력시 에러를 나타내는 함수
  const validateForm = (): Errors => {
    const newErrors: Errors = {};
    if (!updateForm.currentPassword) {
      newErrors.currentPassword = "현재 비밀번호를 입력해주세요.";
    }
    if (updateForm.newPassword !== updateForm.confirmNewPassword) {
      newErrors.confirmNewPassword = "새 비밀번호가 일치하지 않습니다.";
    }
    return newErrors;
  };
  const handleUpdateProfile = () => {
    setIsEditing(true);
  };

  // 회원정보 수정!!!
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();

    // 닉네임을 수정하지 않았다면 닉네임 중복 체크를 하지 않습니다!
    if (updateForm.memberNick == member.memberNick) {
      isNicknameChecked = true;
      isNicknameDuplicate = false;
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
    } else if (!isNicknameChecked || isNicknameDuplicate) {
      setErrors({
        ...validationErrors,
        memberNick: "닉네임 중복 체크를 해주세요.",
      });
    } else {
      try {
        const isPasswordValid = await verifyPassword(
          updateForm.currentPassword
        );
        if (!isPasswordValid) {
          setErrors({ currentPassword: "현재 비밀번호가 올바르지 않습니다." });
          return;
        }

        const { currentPassword, confirmNewPassword, ...updateData } =
          updateForm;

        if (
          updateForm.newPassword === undefined ||
          updateForm.newPassword === null ||
          updateForm.newPassword === ""
        ) {
          updateForm.newPassword = updateForm.currentPassword;
        }

        const { data } = await axios.put<{ message: string; member: Member }>(
          "/api/member/update",
          {
            ...updateData,
            memberPw: updateForm.newPassword,
          },
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
            credentials: "include",
          }
        );
        alert(data.message);
        setMember(data.member);
        setErrors({});
        setIsEditing(false);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          alert(error.response.data);
        } else {
          alert("An unexpected error occurred");
        }
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // 닉네임 중복체크 버튼
  const handleNicknameCheck = async () => {
    if (updateForm.memberNick != member.memberNick) {
      const isDuplicate = await checkNicknameDuplicate(updateForm.memberNick);
      setIsNicknameDuplicate(isDuplicate);
      setIsNicknameChecked(true);
    } else {
      setIsNicknameChecked(true);
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <div className={styles.profileSection}>
            <div className={styles.profileImage}>
                <img
                    src={profileImagePath}
                    alt="Profile"
                    className={styles.profileImageContent}
                    onError={(e) => {
                        e.currentTarget.src = "/profile/basic.png"; // 이미지 로드 실패 시 기본 이미지로 대체
                    }}
                />

            </div>
            <div className={styles.nickname}>{member.memberNick}님</div>
            <input
                type="file"
                ref={fileInputRef}
                onClick={() => fileInputRef.current?.click()}
                style={{ display: "none" }}
            onChange={handleProfileImageChange}
          />
          <button
            className={styles.button}
            onClick={() => {
              // click 메서드를 호출하기 전에 null 체크를 수행합니다.
              if (fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
          >
            프로필 사진 변경
          </button>
          <button 
          className={styles.button}
          onClick={handleProfileImageDelete}>
            프로필 사진 삭제
          </button>
          {!isEditing && (
            <button className={styles.button} onClick={handleUpdateProfile}>
              개인정보 수정
            </button>
          )}
          <form
            onSubmit={handleSubmit}
            className={`${styles.editForm} ${isEditing ? styles.visible : ""}`}
          >
            <input
              type="password"
              name="currentPassword"
              placeholder="현재 비밀번호"
              onChange={handleChange}
              required
              className={styles.input}
            />
            {errors.currentPassword && (
              <span style={{ color: "red" }}>{errors.currentPassword}</span>
            )}

            <input
              type="password"
              name="newPassword"
              placeholder="새 비밀번호 (변경 시에만 입력)"
              onChange={handleChange}
              className={styles.input}
            />
            {errors.newPassword && (
              <span style={{ color: "red" }}>{errors.newPassword}</span>
            )}

            <input
              type="password"
              name="confirmNewPassword"
              placeholder="새 비밀번호 확인"
              onChange={handleChange}
              className={styles.input}
            />
            {errors.confirmNewPassword && (
              <span style={{ color: "red" }}>{errors.confirmNewPassword}</span>
            )}

            <input
              type="text"
              name="memberName"
              value={updateForm.memberName}
              onChange={handleChange}
              placeholder="이름"
              className={styles.input}
              required
            />

            <input
              type="text"
              name="memberNick"
              value={updateForm.memberNick}
              onChange={handleChange}
              placeholder="닉네임"
              className={styles.input}
              required
            />

            <button
              type="button"
              onClick={handleNicknameCheck}
              className={styles.button}
            >
              닉네임 중복 체크
            </button>

            {isNicknameChecked && (
              <span style={{ color: isNicknameDuplicate ? "red" : "green" }}>
                {isNicknameDuplicate
                  ? "이미 사용 중인 닉네임입니다."
                  : "사용 가능한 닉네임입니다."}
              </span>
            )}

            {errors.memberNick && (
              <span style={{ color: "red" }}>{errors.memberNick}</span>
            )}

            <input
              type="text"
              name="memberPhone"
              value={updateForm.memberPhone}
              onChange={handleChange}
              placeholder="전화번호"
              className={styles.input}
              required
            />

            <button className={styles.button} type="submit">
              수정 완료
            </button>
          </form>
          {isEditing && (
            <button className={styles.button} onClick={handleCancelEdit}>
              닫기
            </button>
          )}
        </div>
        <div className={styles.contentSection}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>내가 남긴 리뷰</h2>
            {/* 리뷰 내용 */}
            {/*  {posts}*/}
          </div>
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>좋아요 누른 영화</h2>
                {likedMovies}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
