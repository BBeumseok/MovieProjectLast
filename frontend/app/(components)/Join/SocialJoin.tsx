import React, { useState, useRef, ChangeEvent, FormEvent, useEffect } from 'react';
import axios from "axios";
import styles from "./Join.module.css";
import { Member, SocialJoinForm} from "@/(types)/types";
import {checkNicknameDuplicate, getMemberDetails, socialMember} from "@/_Service/MemberService";
import {useAuth} from "@/(context)/AuthContext";
import Link from "next/link";

const SocialJoin: React.FC = () => {
    const { isLoggedIn } = useAuth();
    const joinButtonRef = useRef<HTMLButtonElement>(null);
    const [isNicknameChecked, setIsNicknameChecked] = useState(false);
    const [isNicknameDuplicate, setIsNicknameDuplicate] = useState(true);
    const [member, setMember] = useState<Member>({
        memberNo: 0,
        memberEmail: '',
        memberName: '',
        memberPhone: '',
        memberNick: '',
    });

    const [socialJoinForm, setSocialJoinForm] = useState<SocialJoinForm>({
        memberEmail: member.memberEmail,
        memberName: member.memberName,
        memberPhone: member.memberPhone,
        memberNick: member.memberNick,
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSocialJoinForm((prevForm) => ({ ...prevForm, [name]: value }));
    };

    useEffect(() => {
        // 입장한 사람 데이터 서버에서 가져오기
        const fetchMemberDetails = async () => {
            try {
                // 개인정보 가져오기
                const data = await getMemberDetails();
                setMember(data);
            } catch (error) {
                console.error('데이터 가져오기 실패', error);
            }
        };
        if (isLoggedIn) {
            fetchMemberDetails();
        }
    }, [isLoggedIn]);

    if (!isLoggedIn) {
        return null;
    }

    // '수정 완료' 버튼
    const handleSubmit = async (e: FormEvent) => {
        socialJoinForm.memberEmail = member.memberEmail;

        console.log("개인정보 수정 입력 값 받았다 !!!");
        e.preventDefault();

        if (!isNicknameChecked || isNicknameDuplicate) {
            console.log("닉네임 바꿨으면 중복 체크 필요 !!!");
            alert("닉네임 중복 체크를 해주세요.");
            return;
        }

        try {
            console.log("서버로 데이터 보내기 !!! : ");
            const data = await socialMember(socialJoinForm);

            console.log(data.message);
            alert(data.message); // 서버에서 오는 완료 or 실패 메시지
            joinButtonRef.current?.click();

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
    // '닉네임 중복 체크' 버튼
    const handleNicknameCheck = async () => {
        if(!socialJoinForm.memberNick){
            alert("닉네임을 입력해주세요.")
            return;
        }

        console.log("닉네임 중복 체크 !!!")
            const isDuplicate =
                await checkNicknameDuplicate(socialJoinForm.memberNick);
            setIsNicknameDuplicate(isDuplicate);
            setIsNicknameChecked(true);
            if(isDuplicate){console.log("닉네임 중복됨");}
            else{console.log("닉네임 사용 가능");}
    };

    return (
        <div className={styles.fullHeightContainer}>
            <form onSubmit={handleSubmit} className={styles.formContainer}>
                <h3>소셜 회원 등록</h3>
                <div>
                    <input type="text" name="memberEmail" value={member.memberEmail}
                           onChange={handleChange} readOnly/>
                </div>
                <div>
                    <input type="text" name="memberName" value={socialJoinForm.memberName}
                           onChange={handleChange} placeholder="이름" required/>
                </div>
                <div>
                    <input type="text" name="memberNick" value={socialJoinForm.memberNick}
                           onChange={handleChange} placeholder="닉네임" required/>
                </div>
                <div>
                <button type="button" onClick={handleNicknameCheck}>
                    닉네임 중복 체크
                </button>
                </div>
                {isNicknameChecked && (
                    <span style={{color: isNicknameDuplicate ? "red" : "green"}}>
                {isNicknameDuplicate
                    ? "이미 사용 중인 닉네임입니다." : "사용 가능한 닉네임입니다."}
              </span>)}
                <div>
                    <input
                        type="text" name="memberPhone" value={socialJoinForm.memberPhone} onChange={handleChange}
                        placeholder="전화번호" required/>
                </div>
                    <button type="submit">
                        소셜 회원가입
                    </button>
            </form>
            <Link href="/">
                <button ref={joinButtonRef} style={{ display: "none" }} />{" "}
                {/* 로그인 페이지로 이동하는 숨겨진 버튼 */}
            </Link>
        </div>
    );
};

export default SocialJoin;