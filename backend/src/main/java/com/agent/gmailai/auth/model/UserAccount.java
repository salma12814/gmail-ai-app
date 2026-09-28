package com.agent.gmailai.auth.model;

import lombok.*;
import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "user_accounts")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(unique = true)
    private String googleId;

    @Lob
    @Column(columnDefinition = "text")
    private String encryptedAccessToken;

    @Lob
    @Column(columnDefinition = "text")
    private String encryptedRefreshToken;

    private Long tokenExpiresAt;

    @Column(nullable = false)
    private Boolean enabled = true;

    private Date createdAt;
    private Date lastLogin;

    @PrePersist
    protected void onCreate() {
        createdAt = new Date();
    }
}