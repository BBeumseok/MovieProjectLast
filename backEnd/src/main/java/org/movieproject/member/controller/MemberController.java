package org.movieproject.member.controller;

import io.jsonwebtoken.JwtException;
import io.swagger.v3.core.jackson.ModelResolver;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.modelmapper.ModelMapper;
import org.movieproject.likes.entity.Likes;
import org.movieproject.member.dto.MemberDTO;
import org.movieproject.member.entity.Member;
import org.movieproject.member.repository.MemberRepository;
import org.movieproject.member.service.MemberService;
import org.movieproject.post.dto.PostDTO;
import org.movieproject.security.JwtProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/member")
@Log4j2
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final ModelMapper modelMapper;
    private final JwtProvider jwtProvider;

    // 회원가입
    @PostMapping("/join")
    public ResponseEntity<?> join(@Valid @RequestBody MemberDTO memberDTO) {

        log.info("회원가입 시작 !!!!!!!!!!!!!!!");
        log.info(memberDTO);

        try{
            memberService.memberJoin(memberDTO);
        } catch (MemberService.MemberExistException e) {
            return ResponseEntity.badRequest().body("중복된 아이디 입니다 !!!");
        }
        return ResponseEntity.ok("회원가입에 성공하였습니다 !!!");
    }

    // 프로필
    @GetMapping("/profile")
    public ResponseEntity<?> getMemberDetails() {
        log.info("프로필 입장 !!!!!!!!!!!!!!!");
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            log.info("프린서펄 값 !!!: {}", username);

            Optional<Member> memberOptional = memberRepository.findByMemberEmailWithRoles(username);

            if (memberOptional.isPresent()) {
                Member member = memberOptional.get();
                log.info(member);
                MemberDTO profileDTO = modelMapper.map(member, MemberDTO.class);
                log.info("멤버 정보 DTO: {}", profileDTO);
                return ResponseEntity.ok(profileDTO);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("멤버를 찾을 수 없습니다.");
            }
        } catch (Exception e) {
            log.error("멤버 디테일에 문제가 발생했습니다.", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("서버 오류가 발생했습니다.");
        }
    }

    // 프로필 찜 목록
    @GetMapping("/likes")
    public List<Likes> getLikeMovies(@AuthenticationPrincipal UserDetails userDetails) {
        Optional<Member> member = memberRepository.findByMemberEmailWithRoles(userDetails.getUsername());
        return member.orElseThrow().getLikeMovies();
    }

    // 비밀번호 검증(회원정보 수정 중에)
    @PostMapping("/verifyPw")
    public ResponseEntity<Map<String, Object>> verifyPassword(@RequestBody Map<String, String> request) {
        log.info("비밀번호 검증 시작 !!!!!!!!!!!!!!!");
        log.info("리퀘스트 !!! : " + request);
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();

            log.info("프린서펄 값 !!!: {}", username);

            Optional<Member> memberOptional = memberRepository.findByMemberEmailWithRoles(username);

            log.info("멤버 옵셔널 !!! : " + memberOptional);
            if (memberOptional.isPresent()) {
                Member member = memberOptional.get();
                log.info("멤버 !!! : "+ member);
                boolean isPasswordValid = passwordEncoder.matches(request.get("password"), member.getMemberPw());
                log.info("isPasswordValid !!! : " + isPasswordValid);
                return ResponseEntity.ok(Map.of("isValid", (Object) isPasswordValid));
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "사용자를 찾을 수 없습니다."));
            }
        } catch (JwtException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid token"));
        }
    }

    // 중복된 닉네임 체크(회원정보 수정 중에)
    @GetMapping("/checkNickname")
    public ResponseEntity<?> checkNickname(@RequestParam String nickname) throws MemberService.MemberExistException {

        log.info("닉네임 체크 시작 !!!!!!!!!!!!!!!");

        boolean isDuplicate = memberRepository.existsByMemberNick(nickname);

        Map<String, Boolean> response = new HashMap<>();

        response.put("isDuplicate", isDuplicate);
        log.info("닉네임이 중복 돼었나요 ? : " + isDuplicate);
        return ResponseEntity.ok(response);
    }

    // 회원정보 수정
    @PutMapping("/update")
    public ResponseEntity<?> update(@Valid @RequestBody MemberDTO memberDTO) {
        log.info("회원 정보 업데이트 시작 !!!!!!!!!!!!, memberDTO : "+memberDTO);

        try{
            memberRepository.updateMember(passwordEncoder.encode(memberDTO.getMemberPw()),
                    memberDTO.getMemberName(), memberDTO.getMemberPhone(),
                    memberDTO.getMemberNick(), memberDTO.getMemberEmail());

            Map<String, Object> response = new HashMap<>();
            response.put("message", "회원 정보 업데이트가 성공하였습니다 !!!");
            response.put("member", memberDTO);

            return ResponseEntity.ok(response);
        }catch(Exception e){
            return ResponseEntity.badRequest().body("업데이트 실패하였습니다. !!!");
        }
    }

    // 회원 삭제
    @DeleteMapping("/delete/{memberNo}")
    public ResponseEntity<String> deleteMember(@PathVariable("memberNo") Integer memberNo){
            try {
                memberService.deleteMember(memberNo);
                return ResponseEntity.ok("회원정보 삭제에 성공 했습니다.");
            }catch (MemberService.MemberExistException e) {
                return ResponseEntity.badRequest().body("회원정보 삭제에 실패하였습니다. !!!");
            }catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("서버 오류가 발생했습니다.");
            }
        }

    @GetMapping("/check_auth")
    public ResponseEntity<?> checkAuth() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("인증되지 않은 사용자입니다.");
            }

            String username = null;
            if (authentication.getPrincipal() instanceof UserDetails userDetails) {
                username = userDetails.getUsername(); // 일반적으로 이메일이나 ID를 반환
            }

            Set<String> roles = authentication.getAuthorities().stream()
                    .map(grantedAuthority -> grantedAuthority.getAuthority().replace("ROLE_", ""))
                    .collect(Collectors.toSet());

            String memberNick = null;
            Integer memberNo = null;
            if (username != null) {
                Member member = memberRepository.findByMemberEmail(username)
                        .orElseThrow(() -> new RuntimeException("Member not found"));
                memberNick = member.getMemberNick();
                memberNo = member.getMemberNo(); // memberNo 추가
            }

            Map<String, Object> authInfo = new HashMap<>();
            authInfo.put("roles", roles);
            authInfo.put("memberNick", memberNick);
            authInfo.put("memberNo", memberNo); // memberNo 추가
            log.info("멤버닉 from 서버 : " + memberNick);
            log.info("멤버노 from 서버 : " + memberNo);

            return ResponseEntity.ok(authInfo);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("체크어쓰 실패");
        }
    }


    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {

        // 쿠키에 저장된 토큰들을 블랙리스트에 등록
        String accessToken = null;
        String refreshToken = null;

        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("accessToken".equals(cookie.getName())) {
                    accessToken = cookie.getValue();
                }
                if ("refreshToken".equals(cookie.getName())) {
                    refreshToken = cookie.getValue();
                }
            }
        }

        jwtProvider.invalidateToken(accessToken);
        jwtProvider.invalidateToken(refreshToken);

        // accessToken 쿠키 삭제
        Cookie accessTokenCookie = new Cookie("accessToken", null);
        accessTokenCookie.setHttpOnly(true);
        accessTokenCookie.setPath("/");
        accessTokenCookie.setMaxAge(0); // 쿠키 만료
        response.addCookie(accessTokenCookie);

        // refreshToken 쿠키 삭제
        Cookie refreshTokenCookie = new Cookie("refreshToken", null);
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge(0); // 쿠키 만료
        response.addCookie(refreshTokenCookie);

        return ResponseEntity.ok().build();
    }
}