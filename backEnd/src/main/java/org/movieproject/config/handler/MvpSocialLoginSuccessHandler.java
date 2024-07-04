package org.movieproject.config.handler;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.movieproject.member.dto.MemberSecurityDTO;
import org.movieproject.security.util.JwtLoginUtil;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

import java.io.IOException;

@Log4j2
@RequiredArgsConstructor
public class MvpSocialLoginSuccessHandler implements AuthenticationSuccessHandler {

    private final JwtLoginUtil jwtLoginUtil;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        log.info("소셜 로그인 석세스 핸들러");
        log.info(authentication.getPrincipal());

        MemberSecurityDTO memberSecurityDTO = (MemberSecurityDTO) authentication.getPrincipal();

        // JWT 생성 및 전송
        jwtLoginUtil.generateAndSendTokens(response, authentication);

        // 임시 비밀번호 사용자 여부에 따라 다른 URL로 리디렉트
        if (memberSecurityDTO.isSocial() && memberSecurityDTO.getMemberPw().length() == 8) {
            log.info("임시 비밀번호 사용자");
            response.sendRedirect("http://localhost:3000/");
        } else {
            response.sendRedirect("http://localhost:3000/");
        }
    }
}
