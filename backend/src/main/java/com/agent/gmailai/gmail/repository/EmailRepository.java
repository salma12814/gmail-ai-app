package com.agent.gmailai.gmail.repository;

import com.agent.gmailai.gmail.model.Email;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmailRepository extends JpaRepository<Email, Long> {
    Optional<Email> findByGmailId(String gmailId);
    List<Email> findByUserIdOrderByReceivedAtDesc(Long userId);
    List<Email> findByUserIdAndIsRepliedFalse(Long userId);
}