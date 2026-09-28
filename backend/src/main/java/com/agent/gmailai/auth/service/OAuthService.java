package com.agent.gmailai.auth.service;

import com.agent.gmailai.auth.model.UserAccount;
import com.agent.gmailai.auth.repository.UserAccountRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import java.util.Date;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class OAuthService {

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private EncryptionService encryptionService;

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    public String getAccessToken(Long userId) throws Exception {
        UserAccount account = userAccountRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Compte non trouvé"));

        String cacheKey = "token:" + userId;
        String cachedToken = redisTemplate.opsForValue().get(cacheKey);

        if (cachedToken != null) {
            return encryptionService.decrypt(cachedToken);
        }

        String decrypted = encryptionService.decrypt(account.getEncryptedAccessToken());
        redisTemplate.opsForValue().set(cacheKey, account.getEncryptedAccessToken(),
                1, TimeUnit.HOURS);

        return decrypted;
    }

    public void saveAccessToken(Long userId, String accessToken, String refreshToken)
            throws Exception {
        String encryptedAccess = encryptionService.encrypt(accessToken);
        String encryptedRefresh = refreshToken != null
                ? encryptionService.encrypt(refreshToken)
                : null;

        UserAccount account = userAccountRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Compte non trouvé"));

        account.setEncryptedAccessToken(encryptedAccess);
        account.setEncryptedRefreshToken(encryptedRefresh);
        account.setTokenExpiresAt(System.currentTimeMillis() + 3600000);

        userAccountRepository.save(account);

        String cacheKey = "token:" + userId;
        redisTemplate.delete(cacheKey);

        log.info("Token sauvegardé pour l'utilisateur: {}", userId);
    }

    public UserAccount createOrUpdateAccount(String email, String googleId) {
        return userAccountRepository.findByGoogleId(googleId)
                .map(account -> {
                    account.setLastLogin(new Date());
                    return userAccountRepository.save(account);
                })
                .orElseGet(() -> {
                    UserAccount newAccount = new UserAccount();
                    newAccount.setEmail(email);
                    newAccount.setGoogleId(googleId);
                    newAccount.setEnabled(true);
                    newAccount.setLastLogin(new Date());
                    return userAccountRepository.save(newAccount);
                });
    }
}