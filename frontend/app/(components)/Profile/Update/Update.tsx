import React, { useState, useRef, ChangeEvent, FormEvent, useEffect } from 'react';
import axios from "axios";
import styles from "./Update.module.css";
import { Member, Errors, UpdateForm } from "@/(types)/types";
import {
    checkNicknameDuplicate,
    deleteMember,
    deleteMemberImage,
    updateMember,
    verifyPassword
} from "@/_Service/MemberService";
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

    // 정보수정 후 프로필페이지 내에서 바뀌는 정보
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
    const [isNicknameChecked, setIsNicknameChecked] = useState(false);
    const [isNicknameDuplicate, setIsNicknameDuplicate] = useState(true);
    const { logout } = useAuth(); // useAuth 에서 logout 함수를 가져옵니다

    // 서버에서 받아오는 사용자 정보
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

    // 프사 변경
    const handleProfileImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
        console.log("프로필 사진 변경 시작 !!!");
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFile(file);

            const formData = new FormData();
            formData.append("file", file);
            formData.append("memberNo", member?.memberNo?.toString() || "");

            try {
                await handleProfileImageDelete(member);
                await axios.post("/api/image/upload", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                await updateProfileImage(member.memberNo);
                console.log("프로필 사진 변경 성공 !!!")
            } catch (error) {
                console.error("프로필 사진 변경 실패 ...", error);
            }
        }
    };
    // 프사 삭제
    const handleProfileImageDelete = async (member: Member) => {
        console.log("기존 프로필 사진 삭제 시작 !!!");
        await deleteMemberImage(member);
        setProfileImagePath("/profile/basic.png");
    };
    // form 입력 값 처리
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUpdateForm((prevForm) => ({ ...prevForm, [name]: value }));
    };

    // 비밀번호 오/미입력 에러 메시지
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
    // '개인정보 수정' 버튼
    const handleUpdateProfile = () => {
        console.log("개인정보 수정 시작 !!! memberNo : "+member.memberNo);
        setIsEditing(true);
    };
    // '수정 완료' 버튼
    const handleSubmit = async (e: FormEvent) => {
        console.log("개인정보 수정 입력 값 받았다 !!!");
        e.preventDefault();
        const validationErrors = validateForm();
        // 현재 비밀번호 입력 했니?
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            console.log("현재 비밀번호 입력 안함 !!!");
            return;
        }
        // 닉네임 안건들었으면 중복체크 안해도 걍 넘어가도록 설정
        if(updateForm.memberNick === member.memberNick){
            console.log("닉네임 바꾸지 않음 !!!");
            setIsNicknameChecked(true);
            setIsNicknameDuplicate(false);
        }else {
            if (!isNicknameChecked || isNicknameDuplicate) {
                console.log("닉네임 바꿨으면 중복 체크 필요 !!!");
                alert("닉네임 중복 체크를 해주세요.");
                return;
            }
        }
        try {
            const isPasswordValid = await verifyPassword(updateForm.currentPassword);
            // 현재 비밀번호 틀렸을 시
            if (!isPasswordValid) {
                setErrors({ currentPassword: "현재 비밀번호가 올바르지 않습니다." });
                return;
            }

            const { currentPassword, confirmNewPassword, newPassword, ...updateData } = updateForm;

            const updatePayload = {
                ...updateData,
                memberPw: newPassword || currentPassword
            };
            console.log("서버로 데이터 보내기 !!! : ");
            // 앞에 다 정상이면 백엔드 서버로 보내서 수정
            const data = await updateMember(updatePayload);

            console.log(data.message);
            alert(data.message); // 서버에서 오는 완료 or 실패 메시지

            // 수정 후 입력칸 디폴트 값을 변경된 값으로 변경, 패스워드는 빈칸 유지
            setUpdateForm({
                memberEmail: data.member.memberEmail,
                memberName: data.member.memberName,
                memberPhone: data.member.memberPhone,
                memberNick: data.member.memberNick,
                currentPassword: '',
                newPassword: '',
                confirmNewPassword: '',
            });
            console.log("개인정보 수정 끝 !!! ");

            // 수정 끝
            setErrors({});
            setIsEditing(false);
            setIsNicknameChecked(false);
            setMember(prevForm => ({
                ...prevForm,
                memberNick: data.member.memberNick
            }));

        // 업데이트 실패시
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                console.error("서버 응답 에러:", error.response.data);
                alert("개인정보 수정 중 오류가 발생했습니다.");
                } else {
                console.error("예상치 못한 에러:", error);
                alert("예상치 못한 오류가 발생했습니다.");
            }
        }
    };
    // 회원 탈퇴 기능
    const handleDelete = async () => {
        console.log("회원 탈퇴 시작 !!!")
        try {
            const isConfirmed = window.confirm("정말로 회원정보를 삭제하시겠습니까?");
            if (!isConfirmed) {console.log("회원 탈퇴 취소 !!!"); return;}

            const memberNo = member.memberNo;

            const data = await deleteMember(memberNo);

            console.log("회원 탈퇴 완료 !!!");
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
    // '닫기' 버튼, 누르면 초기화
    const handleCancelEdit = () => {
        console.log("개인정보 수정 취소 !!!")
        setUpdateForm({
            memberEmail: member.memberEmail,
            memberName: member.memberName,
            memberPhone: member.memberPhone,
            memberNick: member.memberNick,
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: '',
        });
        setErrors({});
        setIsEditing(false);
        setIsNicknameChecked(false);
    };
    // '닉네임 중복 체크' 버튼
    const handleNicknameCheck = async () => {
        console.log("닉네임 중복 체크 !!!")
        // 안바꿨으면 넘어감
        if (updateForm.memberNick === member.memberNick){
            console.log("닉네임 변경하지 않음 !!!")
            setIsNicknameChecked(true);
            setIsNicknameDuplicate(false);
        }
        if (updateForm.memberNick !== member.memberNick) {
            // 백엔드 서버에서 확인
            const isDuplicate = await checkNicknameDuplicate(updateForm.memberNick);
            setIsNicknameDuplicate(isDuplicate);
            setIsNicknameChecked(true);
            if(isDuplicate){console.log("닉네임 중복됨");}
            else{console.log("닉네임 사용 가능");}
        }
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
            <button className={styles.button} onClick={handleDelete}>
                회원 탈퇴
            </button>
        </div>
    );
};

export default Update;