package org.movieproject.post.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.movieproject.post.dto.PageRequestDTO;
import org.movieproject.post.dto.PageResponseDTO;
import org.movieproject.post.dto.PostDTO;
import org.movieproject.post.service.PostService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/posts")
@Log4j2
public class PostController {

    private final PostService postService;


    @PostMapping(value = "/register", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> register(@RequestBody PostDTO postsDTO) {
        log.info("컨트롤러 포스트디티오" + postsDTO.toString());
        postService.regPost(postsDTO);

        return ResponseEntity.ok(Map.of("message", "포스트 작성 완료"));
    }

    //  삭제
    @DeleteMapping(value = "/{postId}")
    public Map<String, String> remove(@PathVariable("postId") Integer postId) {
        postService.removePost(postId);
        return Map.of("result", "success");
    }

    //  검색 조건과 페이징 처리
//    @GetMapping(value = "/list", produces = MediaType.APPLICATION_JSON_VALUE)
//    public PageResponseDTO<PostDTO> list(PageRequestDTO pageRequestDTO) {return postsService.list(pageRequestDTO);}

    @GetMapping("/movie/{movieId}")
    public List<PostDTO> getPostByMovieId(@PathVariable("movieId") Integer movieId) {
        return postService.getPostByMovieId(movieId);
    }
}
