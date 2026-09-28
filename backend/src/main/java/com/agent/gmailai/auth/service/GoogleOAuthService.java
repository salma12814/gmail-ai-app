package com.agent.gmailai.auth.service;

import com.agent.gmailai.auth.model.UserAccount;
import com.agent.gmailai.auth.repository.UserAccountRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.FormHttpMessageConverter;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class GoogleOAuthService {

    @Value("${google.client.id}")
    private String clientId;

    @Value("${google.client.secret}")
    private String clientSecret;

    @Value("${google.redirect.uri:http://localhost:8081/api/auth/google/callback}")
    private String redirectUri;

    private final UserAccountRepository userAccountRepository;
    private final OAuthService oAuthService;

    private static final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

    /**
     * Créer un RestTemplate avec les converters appropriés
     */
    private RestTemplate createRestTemplateWithConverters() {
        RestTemplate restTemplate = new RestTemplate();

        List<HttpMessageConverter<?>> converters = new ArrayList<>();

        // ✅ IMPORTANT: Ajouter FormHttpMessageConverter pour form-urlencoded
        converters.add(new FormHttpMessageConverter());
        converters.add(new StringHttpMessageConverter());
        converters.add(new MappingJackson2HttpMessageConverter());

        restTemplate.setMessageConverters(converters);

        log.debug("✅ RestTemplate initialisé avec converters");
        return restTemplate;
    }

    /**
     * Générer l'URL de redirection Google OAuth
     * ✅ FIX: Ajouter les scopes openid, email, profile pour récupérer les infos utilisateur
     */
    public String getGoogleAuthUrl() {
        try {
            // ✅ IMPORTANT: Ajouter openid email profile + scopes Gmail
            String scope = "openid email profile " +
                    "https://www.googleapis.com/auth/gmail.readonly " +
                    "https://www.googleapis.com/auth/gmail.send";

            String encodedScope = URLEncoder.encode(scope, StandardCharsets.UTF_8);
            String encodedRedirectUri = URLEncoder.encode(redirectUri, StandardCharsets.UTF_8);

            String authUrl = "https://accounts.google.com/o/oauth2/auth" +
                    "?client_id=" + clientId +
                    "&redirect_uri=" + encodedRedirectUri +
                    "&response_type=code" +
                    "&scope=" + encodedScope +
                    "&access_type=offline" +
                    "&prompt=consent";

            log.info("✅ URL d'authentification Google générée avec scopes: openid, email, profile, gmail.readonly, gmail.send");
            return authUrl;

        } catch (Exception e) {
            log.error("❌ Erreur lors de la génération de l'URL: {}", e.getMessage());
            throw new RuntimeException("Erreur lors de la génération de l'URL OAuth", e);
        }
    }

    /**
     * Échanger le code d'autorisation pour un token d'accès
     * FIX: Utiliser MultiValueMap pour form-urlencoded
     */
    public String getAccessToken(String authCode) {
        try {
            log.info("🔐 Échange du code d'autorisation pour un token...");

            // ✅ FIX: Utiliser MultiValueMap au lieu de HashMap
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("code", authCode);
            params.add("client_id", clientId);
            params.add("client_secret", clientSecret);
            params.add("redirect_uri", redirectUri);
            params.add("grant_type", "authorization_code");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(params, headers);

            // ✅ Utiliser RestTemplate avec converters
            RestTemplate restTemplate = createRestTemplateWithConverters();

            log.debug("📤 Envoi de la requête POST à: {}", GOOGLE_TOKEN_URL);
            ResponseEntity<String> response = restTemplate.exchange(
                    GOOGLE_TOKEN_URL,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            log.debug("📥 Réponse reçue avec status: {}", response.getStatusCode());

            if (response.getBody() == null) {
                throw new RuntimeException("Réponse vide de Google OAuth");
            }

            ObjectMapper mapper = new ObjectMapper();
            JsonNode jsonNode = mapper.readTree(response.getBody());

            // Vérifier les erreurs dans la réponse
            if (jsonNode.has("error")) {
                String error = jsonNode.get("error").asText();
                String errorDescription = jsonNode.has("error_description")
                        ? jsonNode.get("error_description").asText()
                        : "Unknown error";
                log.error("❌ Erreur OAuth de Google: {} - {}", error, errorDescription);
                throw new RuntimeException("Erreur Google OAuth: " + error + " - " + errorDescription);
            }

            String accessToken = jsonNode.get("access_token").asText();
            log.info("✅ Token d'accès obtenu avec succès (longueur: {})", accessToken.length());

            return accessToken;

        } catch (Exception e) {
            log.error("❌ Erreur lors de l'échange du code: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de l'obtention du token: " + e.getMessage(), e);
        }
    }

    /**
     * Récupérer les infos utilisateur Google
     * Nécessite les scopes: openid, email, profile
     */
    public JsonNode getUserInfo(String accessToken) {
        try {
            log.info("👤 Récupération des infos utilisateur...");

            RestTemplate restTemplate = createRestTemplateWithConverters();
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(headers);

            log.debug("📤 Envoi GET à: {}", GOOGLE_USERINFO_URL);
            log.debug("🔐 Authorization header: Bearer {}", accessToken.substring(0, Math.min(20, accessToken.length())) + "...");

            ResponseEntity<String> response = restTemplate.exchange(
                    GOOGLE_USERINFO_URL,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            log.debug("📥 Réponse reçue avec status: {}", response.getStatusCode());

            if (response.getBody() == null) {
                throw new RuntimeException("Réponse vide de Google Userinfo API");
            }

            ObjectMapper mapper = new ObjectMapper();
            JsonNode userInfo = mapper.readTree(response.getBody());

            // Vérifier les erreurs
            if (userInfo.has("error")) {
                log.error("❌ Erreur Google Userinfo: {}", userInfo);
                throw new RuntimeException("Erreur lors de la récupération des infos: " + userInfo.toString());
            }

            String email = userInfo.has("email") ? userInfo.get("email").asText() : "unknown";
            String id = userInfo.has("id") ? userInfo.get("id").asText() : "unknown";
            String name = userInfo.has("name") ? userInfo.get("name").asText() : "unknown";

            log.info("✅ Infos utilisateur récupérées: email={}, id={}, name={}", email, id, name);
            return userInfo;

        } catch (Exception e) {
            log.error("❌ Erreur lors de la récupération des infos: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la récupération des infos utilisateur: " + e.getMessage(), e);
        }
    }

    /**
     * Gérer le callback Google OAuth complet
     */
    public UserAccount handleGoogleCallback(String authCode) {
        try {
            log.info("🔐 ========== TRAITEMENT DU CALLBACK GOOGLE ==========");
            log.info("Code reçu: {}", authCode.substring(0, Math.min(20, authCode.length())) + "...");

            // 1. Obtenir le token d'accès
            log.info("📍 Étape 1/4: Échange du code pour un token...");
            String accessToken = getAccessToken(authCode);

            // 2. Récupérer les infos utilisateur
            log.info("📍 Étape 2/4: Récupération des infos utilisateur...");
            JsonNode userInfo = getUserInfo(accessToken);

            String email = userInfo.get("email").asText();
            String googleId = userInfo.get("id").asText();

            log.info("📍 Étape 3/4: Création/Mise à jour du compte utilisateur...");
            log.info("📧 Email: {}, GoogleID: {}", email, googleId);

            // 3. Créer ou récupérer l'utilisateur
            UserAccount user = oAuthService.createOrUpdateAccount(email, googleId);
            log.info("👤 Utilisateur créé/mis à jour: ID={}, Email={}", user.getId(), user.getEmail());

            // 4. Sauvegarder le token d'accès chiffré
            log.info("📍 Étape 4/4: Chiffrement et stockage du token...");
            oAuthService.saveAccessToken(user.getId(), accessToken, null);
            log.info("🔐 Token chiffré et sauvegardé pour l'utilisateur ID={}", user.getId());

            log.info("✅ ========== AUTHENTIFICATION RÉUSSIE! ==========");
            log.info("✅ Utilisateur authentifié: {} (ID: {})", email, user.getId());
            return user;

        } catch (Exception e) {
            log.error("❌ ========== ERREUR LORS DE L'AUTHENTIFICATION ==========");
            log.error("❌ Message: {}", e.getMessage());
            log.error("❌ Cause: {}", e.getCause());
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de l'authentification Google: " + e.getMessage(), e);
        }
    }
}