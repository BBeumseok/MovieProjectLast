package org.movieproject.upload.entity;

import jakarta.persistence.*;
import lombok.*;
import org.movieproject.member.Entity.Member;

@Entity
@Builder
@Getter
@AllArgsConstructor
@NoArgsConstructor
@ToString(exclude = "member")
public class Image{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long imageId;

    private String fileName;

    //  프로필 이미지는 회원 당 1개만 가질 수 있으므로 @OneToOne 적용
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "memberNo")
    private Member member;

}
