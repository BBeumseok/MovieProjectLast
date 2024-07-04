package org.movieproject.like.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.movieproject.like.dto.LikeDTO;
import org.movieproject.like.entity.Like;
import org.movieproject.like.repository.LikeRepository;
import org.movieproject.member.Entity.Member;
import org.movieproject.member.repository.MemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class LikeServiceImpl implements LikeService {

    private final LikeRepository likeRepository;
    private final MemberRepository memberRepository;
    private final ModelMapper modelMapper;

    public LikeServiceImpl(LikeRepository likeRepository, MemberRepository memberRepository, ModelMapper modelMapper) {
        this.likeRepository = likeRepository;
        this.memberRepository = memberRepository;
        this.modelMapper = modelMapper;
    }


    @Override
    @Transactional
    public Like addLike(LikeDTO likeDTO) {
        Optional<Member> memberOptional = memberRepository.findById(likeDTO.getMemberNo());
        if (memberOptional.isPresent()) {
            Member member = memberOptional.get();
            Like like = modelMapper.map(likeDTO, Like.class);
            like.setMember(member);
            return likeRepository.save(like);
        } else {
            throw new IllegalArgumentException("맴버를 찾을수 없습니다.");
        }
    }

    @Override
    public List<Like> getLikesByMember(int memberNo) {
        return likeRepository.findByMember_MemberNo(memberNo);
    }

    @Override
    public void removeLike(int likeId) {
        if(likeRepository.existsById(likeId)){
            likeRepository.deleteById(likeId);
        }else {
            throw new IllegalArgumentException("해당 좋아요는 없다"+likeId);
        }

    }
}
