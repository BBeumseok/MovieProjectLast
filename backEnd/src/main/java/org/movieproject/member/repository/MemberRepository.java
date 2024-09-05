package org.movieproject.member.repository;


import org.movieproject.member.entity.Member;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, Integer> {
    @EntityGraph(attributePaths = "roleSet")
    @Query("select m from Member m where m.memberEmail = :memberEmail")
    Optional<Member> findByMemberEmailWithRoles(String memberEmail);

    @Query("select m from Member m left join fetch m.posts p left join p.movie where m.memberNo = :memberNo")
    Member findMemberWithPostsAndMovies(@Param("memberNo") Integer memberNo);

    @EntityGraph(attributePaths = "roleSet")
    Optional<Member> findByMemberEmail(String memberEmail);

    @EntityGraph(attributePaths = "roleSet")
    Optional<Member> findByMemberNick(String memberNick);

    // 아이디 중복 확인
    @Transactional(readOnly = true)
    boolean existsByMemberEmail(String memberEmail);

    // 닉네임 중복 확인
    @Transactional(readOnly = true)
    boolean existsByMemberNick(String memberNick);

    // 회원 정보 수정
    @Modifying
    @Transactional
    @Query("UPDATE Member m SET m.memberPw = :re_pw, m.memberName = :re_name, " +
            "m.memberPhone = :re_phone, m.memberNick = :re_nick WHERE m.memberEmail = :member_email")
    void updateMember(@Param("re_pw") String pw, @Param("re_name") String name,
                     @Param("re_phone") String phone, @Param("re_nick") String nick,
                     @Param("member_email") String email);

    // 소셜 회원가입
    @Modifying
    @Transactional
    @Query("UPDATE Member m SET m.memberName = :re_name, " +
            "m.memberPhone = :re_phone, m.memberNick = :re_nick WHERE m.memberEmail = :member_email")
    void socialMember(@Param("re_name") String name, @Param("re_phone") String phone,
                      @Param("re_nick") String nick, @Param("member_email") String email);
}