package org.movieproject.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@Entity
@ToString(exclude = "roleSet")
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer memberNo;

    @Column(nullable = false)
    private String memberEmail;

    @Column(nullable = false)
    private String memberPw;

    @Column(nullable = false)
    private String memberName;

    @Column(nullable = false)
    private String memberPhone;

    @Column(nullable = false)
    private String memberNick;

    @ElementCollection(targetClass = Role.class, fetch = FetchType.LAZY)
    @Enumerated(EnumType.STRING)
    private Set<Role> roleSet = new HashSet<>();

    public void addRole(Role role) {
        this.roleSet.add(role);
    }

    //Member < - > Post One To Many
    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Posts> posts = new ArrayList<>();

    //Member < - > Post One To Many END


    ///좋아요 (like) 참조
    //다대일 정의/매핑, 역방향 관계 / member 엔티티의 변경이 like엔티티에도 전파되도록 설정한것
    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL,orphanRemoval = true)
    private List<Like> likes = new ArrayList<>();
    //////좋아요 (like) 참조 END


    ///comment 내가 쓴 댓글
    @OneToMany(mappedBy = "member",cascade =  CascadeType.ALL,orphanRemoval = true)
    private List<Comment> comments = new ArrayList<>();
    ///comment 내가 쓴 댓글END
}