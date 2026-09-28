package com.agent.gmailai.auth.controller;

import com.agent.gmailai.auth.model.UserAccount;
import com.agent.gmailai.auth.service.GoogleOAuthService;
import com.agent.gmailai.auth.service.OAuthService;
import com.agent.gmailai.common.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private OAuthService oAuthService;

    @Autowired
    private GoogleOAuthService googleOAuthService;

    /**
     * Créer ou mettre à jour un compte
     */
    @PostMapping("/accounts/add")
    public ResponseEntity<ApiResponse<UserAccount>> addAccount(
            @RequestParam String email,
            @RequestParam String password,
            @RequestParam String googleId) {
        try {
            UserAccount account = oAuthService.createOrUpdateAccount(email, googleId);
            return ResponseEntity.ok(
                    ApiResponse.success(account, "Compte ajouté")
            );
        } catch (Exception e) {
            log.error("❌ Erreur lors de la création du compte: {}", e.getMessage());
            return ResponseEntity.status(500).body(
                    ApiResponse.error("ACCOUNT_ERROR", e.getMessage())
            );
        }
    }

    /**
     * Sauvegarder le token d'accès
     */
    @PostMapping("/token/save")
    public ResponseEntity<ApiResponse<String>> saveToken(
            @RequestParam Long userId,
            @RequestParam String accessToken,
            @RequestParam(required = false) String refreshToken) {
        try {
            oAuthService.saveAccessToken(userId, accessToken, refreshToken);
            return ResponseEntity.ok(
                    ApiResponse.success("OK", "Token sauvegardé")
            );
        } catch (Exception e) {
            log.error("❌ Erreur lors de la sauvegarde du token: {}", e.getMessage());
            return ResponseEntity.status(500).body(
                    ApiResponse.error("TOKEN_ERROR", e.getMessage())
            );
        }
    }

    /**
     * Health check
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(
                ApiResponse.success("OK", "Auth running")
        );
    }

    /**
     * Obtenir l'URL de login Google OAuth
     */
    @GetMapping("/google/auth-url")
    public ResponseEntity<ApiResponse<String>> getGoogleAuthUrl() {
        try {
            String authUrl = googleOAuthService.getGoogleAuthUrl();
            log.info("✅ URL d'authentification Google générée");
            return ResponseEntity.ok(ApiResponse.<String>builder()
                    .success(true)
                    .message("URL d'authentification Google")
                    .data(authUrl)
                    .build());
        } catch (Exception e) {
            log.error("❌ Erreur lors de la génération de l'URL: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.<String>builder()
                            .success(false)
                            .message("Erreur: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Callback Google OAuth - Redirige vers /auth/callback du frontend
     */
    @GetMapping("/google/callback")
    public RedirectView googleCallback(@RequestParam String code) {
        try {
            log.info("🔐 Traitement du callback Google avec code: {}", code);

            // Authentifie l'utilisateur et récupère ses données
            UserAccount user = googleOAuthService.handleGoogleCallback(code);

            // Récupère l'ID de l'utilisateur
            String userId = String.valueOf(user.getId());

            log.info("✅ Authentification réussie pour l'utilisateur: {}", userId);

            // Redirige vers le callback page du frontend
            String redirectUrl = "http://localhost:5173/auth/callback?userId=" + userId;
            return new RedirectView(redirectUrl);

        } catch (Exception e) {
            log.error("❌ Erreur lors du callback Google: {}", e.getMessage());

            // En cas d'erreur, redirige vers le login
            String errorMessage = java.net.URLEncoder.encode(e.getMessage(), java.nio.charset.StandardCharsets.UTF_8);
            String redirectUrl = "http://localhost:5173/login?error=" + errorMessage;
            return new RedirectView(redirectUrl);
        }
    }
}