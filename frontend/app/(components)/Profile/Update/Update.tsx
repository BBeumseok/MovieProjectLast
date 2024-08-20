import React, { useState, useRef, ChangeEvent, FormEvent, useEffect } from 'react';
import axios from "axios";
import styles from "./Update.module.css";
import { Member, Errors, UpdateForm } from "@/(types)/types";
import { checkNicknameDuplicate, verifyPassword } from "@/_Service/MemberService";
import {useAuth} from "@/(context)/AuthContext";

interface UpdateProps {
    member: Member;
    setMember: React.Dispatch<React.SetStateAction<Member>>;
    fetchImage: (memberNo: number) => Promise<string>;
    profileImageUrl: string;
    setProfileImageUrl: React.Dispatch<React.SetStateAction<string>>;
    updateProfileImage: (memberNo: number) => Promise<void>;
}

const Update: React.FC<UpdateProps> = ({ member, setMember,
                                           fetchImage, profileImageUrl,
                                           setProfileImageUrl,
                                       updateProfileImage}) => {
    console.log("업데이트 시작!! memberNo : "+member.memberNo)
    const [updateForm, setUpdateForm] = useState<UpdateForm>({
        memberEmail: member.memberEmail,
        memberName: member.memberName,
        memberPhone: member.memberPhone,
        memberNick: member.memberNick,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
    });

    const [errors, setErrors] = useState<Errors>({});
    const [isEditing, setIsEditing] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [profileImagePath, setProfileImagePath] = useState("/profile/basic.png");
    const [isNicknameChecked, setIsNicknameChecked] = useState(true);
    const [isNicknameDuplicate, setIsNicknameDuplicate] = useState(false);
    const { logout } = useAuth(); // useAuth에서 logout 함수를 가져옵니다

    useEffect(() => {
        setUpdateForm(prevForm => ({
            ...prevForm,
            memberEmail: member.memberEmail,
            memberName: member.memberName,
            memberPhone: member.memberPhone,
            memberNick: member.memberNick,
        }));
        fetchImage(member.memberNo).then(() => {
            setProfileImagePath(`/profile/${member.memberNo}.png`);
        });
    }, [member, fetchImage, setProfileImageUrl]);

    useEffect(() => {
            setIsNicknameChecked(updateForm.memberNick === member.memberNick);
    }, [updateForm.memberNick, member.memberNick]);

    const handleProfileImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFile(file);

            const formData = new FormData();
            formData.append("file", file);
            formData.append("memberNo", member?.memberNo?.toString() || "");

            try {
                await handleProfileImageDelete();
                await axios.post("/api/image/upload", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                await updateProfileImage(member.memberNo);
            } catch (error) {
                console.error("이미지 업로드 실패", error);
            }
        }
    };

    const handleProfileImageDelete = async () => {
        try {
            await axios.delete(`/api/image/delete/${member?.memberNo}`);
            setProfileImagePath("/profile/basic.png");
        } catch (error) {
            console.error("이미지 삭제 실패", error);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUpdateForm((prevForm) => ({ ...prevForm, [name]: value }));
    };

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

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const validationErrors = validateForm();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        if (!isNicknameChecked || isNicknameDuplicate) {
            alert("닉네임 중복 체크를 해주세요.");
            return;
        }
        try {
            const isPasswordValid = await verifyPassword(updateForm.currentPassword);
            if (!isPasswordValid) {
                setErrors({ currentPassword: "현재 비밀번호가 올바르지 않습니다." });
                return;
            }

            const { currentPassword, confirmNewPassword, newPassword, ...updateData } = updateForm;

            const updatePayload = {
                ...updateData,
                memberPw: newPassword || currentPassword
            };

            const { data } = await axios.put<{ message: string; member: Member }>(
                "/api/member/update",
                updatePayload,
                {
                    headers: { "Content-Type": "application/json" },
                    withCredentials: true,
                    credentials: "include",
                    }
                );

            alert(data.message);
            setMember(data.member);
            setIsEditing(false);

            // 비밀번호 필드 초기화
            setUpdateForm({
                memberEmail: data.member.memberEmail,
                memberName: data.member.memberName,
                memberPhone: data.member.memberPhone,
                memberNick: data.member.memberNick,
                currentPassword: '',
                newPassword: '',
                confirmNewPassword: '',
            });

            setErrors({});

            setIsEditing(false);

        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                console.error("서버 응답 에러:", error.response.data);
                alert("프로필 업데이트 중 오류가 발생했습니다.");
                } else {
                console.error("예상치 못한 에러:", error);
                alert("예상치 못한 오류가 발생했습니다.");
            }
        }
    };

    const handleDelete = async (memberNo: number) => {
        try {
            const isConfirmed = window.confirm("정말로 회원정보를 삭제하시겠습니까?");
            if (!isConfirmed) return;

            await axios.delete<{ message:string }>(
                `/api/member/delete/${memberNo}`,
                {
                    headers: { "Content-Type": "application/json" },
                    withCredentials: true,
                    credentials: "include",
                }
            );
            alert("회원 탈퇴가 완료되었습니다.");
            logout();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    console.error("서버 응답 에러:", error.response.data);
                    alert(error.response.data.message || "멤버 삭제 중 오류가 발생했습니다.");
                } else {
                    console.error("요청 에러:", error.message);
                    alert("요청 중 오류가 발생했습니다.");
                }
            } else {
                console.error("예상치 못한 에러:", error);
                alert("예상치 못한 오류가 발생했습니다.");
            }
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const handleNicknameCheck = async () => {
        if (updateForm.memberNick !== member.memberNick) {
            const isDuplicate = await checkNicknameDuplicate(updateForm.memberNick);
            setIsNicknameDuplicate(isDuplicate);
            setIsNicknameChecked(true);
        }
    };
    const handleDeleteClick = () => {
        handleDelete(member.memberNo);
    };

    return (
        <div className={styles.profileSection}>
            <div className={styles.profileImage}>
                <img
                    src={profileImageUrl}
                    alt="Profile"
                    className={styles.profileImageContent}
                    onError={(e) => {
                        e.currentTarget.src = "/profile/basic.png";
                    }}
                />
            </div>

            <div className={styles.nickname}>{member.memberNick}님</div>

            <input
                type="file"
                ref={fileInputRef}
                style={{display: "none"}}
                onChange={handleProfileImageChange}
            />

            <button className={styles.button} onClick={() => fileInputRef.current?.click()}>
                프로필 사진 변경
            </button>

            {!isEditing && (
                <button className={styles.button} onClick={handleUpdateProfile}>
                    개인정보 수정
                </button>
            )}

            <form onSubmit={handleSubmit} className={`${styles.editForm} ${isEditing ? styles.visible : ""}`}>

                <input type="password" name="currentPassword" value={updateForm.currentPassword} placeholder="현재 비밀번호"
                       onChange={handleChange} required className={styles.input}/>

                {errors.currentPassword && (
                    <span style={{color: "red"}}>{errors.currentPassword}</span>
                )}

                <input type="password" name="newPassword" value={updateForm.newPassword} placeholder="새 비밀번호 (변경 시에만 입력)"
                       onChange={handleChange} className={styles.input}/>

                {errors.newPassword && (
                    <span style={{color: "red"}}>{errors.newPassword}</span>
                )}

                <input
                    type="password" name="confirmNewPassword" value={updateForm.confirmNewPassword} placeholder="새 비밀번호 확인"
                    onChange={handleChange} className={styles.input}/>

                {errors.confirmNewPassword && (
                    <span style={{color: "red"}}>{errors.confirmNewPassword}</span>)}

                <input type="text" name="memberName" value={updateForm.memberName}
                       onChange={handleChange} placeholder="이름" className={styles.input} required/>

                <input type="text" name="memberNick" value={updateForm.memberNick}
                       onChange={handleChange} placeholder="닉네임" className={styles.input} required/>

                <button type="button" onClick={handleNicknameCheck} className={styles.button}>
                    닉네임 중복 체크
                </button>

                {isNicknameChecked && (
                    <span style={{color: isNicknameDuplicate ? "red" : "green"}}>
                {isNicknameDuplicate
                    ? "이미 사용 중인 닉네임입니다." : "사용 가능한 닉네임입니다."}
              </span>)}

                <input
                    type="text" name="memberPhone" value={updateForm.memberPhone}
                    onChange={handleChange} placeholder="전화번호" className={styles.input} required/>

                <button className={styles.button} type="submit">
                    수정 완료
                </button>
            </form>

            {isEditing && (
                <button className={styles.button} onClick={handleCancelEdit}>
                    닫기
                </button>
            )}
            <button className={styles.button} onClick={handleDeleteClick}>
                회원 탈퇴
            </button>
        </div>
    );
};

export default Update;