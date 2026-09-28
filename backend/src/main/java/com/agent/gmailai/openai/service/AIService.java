package com.agent.gmailai.openai.service;

import com.agent.gmailai.gmail.model.Email;
import com.agent.gmailai.gmail.repository.EmailRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class AIService {

    // ✅ SEULE CLÉ LUE DU PROPERTIES
    @Value("${gemini.api.key}")
    private String geminiApiKey;

    // ✅ VALEURS HARDCODÉES (pas dans properties)
    private static final String MODEL = "gemini-3.6-flash";
    private static final Float TEMPERATURE = 0.7f;
    private static final Integer MAX_TOKENS = 1000;

    private final EmailRepository emailRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Analyser un email avec Google Gemini (100% GRATUIT)
     */
    public Map<String, Object> analyzeEmail(Long emailId, String tone) {
        try {
            log.info("🤖 Analyse de l'email ID: {} avec Gemini", emailId);
            long startTime = System.currentTimeMillis();

            Email email = emailRepository.findById(emailId)
                    .orElseThrow(() -> new RuntimeException("Email non trouvé"));

            // Préparer le prompt
            String prompt = buildAnalysisPrompt(email, tone);

            // Appeler Gemini via REST
            Map<String, Object> geminiResponse = callGeminiAPI(prompt);
            String analysis = (String) geminiResponse.get("content");
            Integer tokensUsed = (Integer) geminiResponse.get("tokens");

            log.info("✅ Réponse brute de Gemini: {}", analysis.substring(0, Math.min(150, analysis.length())));

            // Parser la réponse JSON
            JsonNode analysisJson = objectMapper.readTree(analysis);

            // ✅ VÉRIFICATIONS ROBUSTES
            String sentiment = "neutral";
            String priority = "medium";
            String category = "other";
            String summary = analysis;
            Float confidence = 0.8f;

            if (analysisJson.has("sentiment") && !analysisJson.get("sentiment").isNull()) {
                sentiment = analysisJson.get("sentiment").asText();
            }
            if (analysisJson.has("priority") && !analysisJson.get("priority").isNull()) {
                priority = analysisJson.get("priority").asText();
            }
            if (analysisJson.has("category") && !analysisJson.get("category").isNull()) {
                category = analysisJson.get("category").asText();
            }
            if (analysisJson.has("summary") && !analysisJson.get("summary").isNull()) {
                summary = analysisJson.get("summary").asText();
            }
            if (analysisJson.has("confidence") && !analysisJson.get("confidence").isNull()) {
                confidence = analysisJson.get("confidence").floatValue();
            }

            // Sauvegarder l'analyse
            email.setAiAnalysis(analysis);
            email.setAnalysedAt(LocalDateTime.now());
            email.setAiConfidence(confidence);
            email.setTokensUsed(tokensUsed);
            email.setAiModel(MODEL);
            emailRepository.save(email);

            long processingTime = System.currentTimeMillis() - startTime;
            log.info("✅ Email analysé en {}ms (Gemini - GRATUIT)", processingTime);

            return Map.of(
                    "success", true,
                    "emailId", emailId,
                    "analysis", Map.of(
                            "sentiment", sentiment,
                            "priority", priority,
                            "category", category,
                            "summary", summary,
                            "confidence", confidence
                    ),
                    "processingTimeMs", processingTime,
                    "tokensUsed", tokensUsed,
                    "model", MODEL,
                    "cost", 0.0
            );

        } catch (Exception e) {
            log.error("❌ Erreur analyse email: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de l'analyse: " + e.getMessage(), e);
        }
    }

    /**
     * Générer une réponse automatique avec Gemini (100% GRATUIT) - ✅ CORRIGÉE
     */
    public Map<String, Object> generateReply(Long emailId, String tone, String language) {
        try {
            log.info("✍️ Génération de réponse pour email ID: {} avec Gemini", emailId);
            long startTime = System.currentTimeMillis();

            Email email = emailRepository.findById(emailId)
                    .orElseThrow(() -> new RuntimeException("Email non trouvé"));

            // Préparer le prompt
            String prompt = buildReplyPrompt(email, tone, language);

            // Appeler Gemini via REST
            Map<String, Object> geminiResponse = callGeminiAPI(prompt);
            String reply = (String) geminiResponse.get("content");
            Integer tokensUsed = (Integer) geminiResponse.get("tokens");

            log.info("✅ Réponse brute de Gemini: {}", reply.substring(0, Math.min(150, reply.length())));

            // Parser la réponse
            JsonNode replyJson = objectMapper.readTree(reply);

            // ✅ VÉRIFICATIONS ROBUSTES
            String replyText = "";
            Float confidence = 0.8f;

            if (replyJson.has("text") && !replyJson.get("text").isNull()) {
                replyText = replyJson.get("text").asText();
                log.info("✅ Clé 'text' trouvée: {} chars", replyText.length());
            } else {
                log.warn("⚠️ Clé 'text' non trouvée, cherchant alternatives...");
                // Fallback: chercher d'autres clés possibles
                if (replyJson.isTextual()) {
                    replyText = replyJson.asText();
                } else {
                    replyText = reply;
                }
            }

            if (replyJson.has("confidence") && !replyJson.get("confidence").isNull()) {
                confidence = replyJson.get("confidence").floatValue();
            }

            // Vérification finale
            if (replyText == null || replyText.isEmpty()) {
                throw new RuntimeException("Réponse générée vide");
            }

            // Sauvegarder la réponse générée
            Integer currentTokens = email.getTokensUsed() != null ? email.getTokensUsed() : 0;
            email.setAiGeneratedReply(replyText);
            email.setAiConfidence(confidence);
            email.setTokensUsed(currentTokens + tokensUsed);
            email.setAiModel(MODEL);
            emailRepository.save(email);

            long processingTime = System.currentTimeMillis() - startTime;
            log.info("✅ Réponse générée en {}ms (Gemini - GRATUIT)", processingTime);

            return Map.of(
                    "success", true,
                    "emailId", emailId,
                    "aiGeneratedReply", replyText,  // ✅ CLÉ IMPORTANTE
                    "processingTimeMs", processingTime,
                    "tokensUsed", tokensUsed,
                    "model", MODEL,
                    "cost", 0.0
            );

        } catch (Exception e) {
            log.error("❌ Erreur génération réponse: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la génération: " + e.getMessage(), e);
        }
    }

    /**
     * Analyser ET générer réponse en une seule requête
     */
    public Map<String, Object> analyzeAndReply(Long emailId, String tone, String language) {
        try {
            // Analyser
            Map<String, Object> analysis = analyzeEmail(emailId, tone);

            // Générer réponse
            Map<String, Object> reply = generateReply(emailId, tone, language);

            // Combiner
            return Map.of(
                    "success", true,
                    "emailId", emailId,
                    "analysis", analysis.get("analysis"),
                    "aiGeneratedReply", reply.get("aiGeneratedReply"),
                    "totalProcessingTimeMs",
                    (Long) analysis.get("processingTimeMs") + (Long) reply.get("processingTimeMs"),
                    "totalTokensUsed",
                    (Integer) analysis.get("tokensUsed") + (Integer) reply.get("tokensUsed"),
                    "model", MODEL,
                    "totalCost", 0.0
            );

        } catch (Exception e) {
            log.error("❌ Erreur analyse+réponse: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur: " + e.getMessage(), e);
        }
    }

    /**
     * Appeler l'API Gemini via REST (100% GRATUIT) - VERSION CORRIGÉE ✅
     */
    private Map<String, Object> callGeminiAPI(String prompt) {
        try {
            log.info("📡 Appel Gemini API REST...");
            long startTime = System.currentTimeMillis();

            // URL complète avec clé API - ✅ UTILISE MODEL CONSTANT
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent?key=" + geminiApiKey;
            log.info("🔗 URL: {}...{}", url.substring(0, 80), url.substring(url.length() - 20));

            // Headers
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");

            // Body request
            ObjectNode requestBody = objectMapper.createObjectNode();

            // Ajouter le contenu
            var contentsArray = requestBody.putArray("contents");
            var contentObj = contentsArray.addObject();
            var partsArray = contentObj.putArray("parts");
            partsArray.addObject().put("text", prompt);

            // Ajouter la configuration - ✅ UTILISE CONSTANTS
            var generationConfig = requestBody.putObject("generationConfig");
            generationConfig.put("temperature", TEMPERATURE);
            generationConfig.put("maxOutputTokens", MAX_TOKENS);

            HttpEntity<String> entity = new HttpEntity<>(requestBody.toString(), headers);

            log.info("🔄 Envoi requête à Gemini (Model: {})...", MODEL);
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Erreur Gemini: " + response.getStatusCode());
            }

            // Parser la réponse
            JsonNode responseJson = objectMapper.readTree(response.getBody());

            // Extraire le texte généré
            JsonNode candidates = responseJson.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                throw new RuntimeException("Pas de réponse de Gemini");
            }

            String generatedText = candidates.get(0)
                    .get("content")
                    .get("parts")
                    .get(0)
                    .get("text")
                    .asText();

            // ✅ NETTOYER LA RÉPONSE
            String cleanedText = generatedText
                    .replaceAll("```json", "")  // Enlever ```json
                    .replaceAll("```", "")      // Enlever ```
                    .trim();                     // Enlever espaces

            log.info("✅ Texte brut reçu de Gemini: {}", cleanedText.substring(0, Math.min(100, cleanedText.length())));

            // Estimer les tokens (approximation: 4 chars = 1 token)
            int estimatedTokens = (prompt.length() + generatedText.length()) / 4;

            long duration = System.currentTimeMillis() - startTime;
            log.info("✅ Gemini répondu en {}ms - Tokens estimés: {}", duration, estimatedTokens);

            return Map.of(
                    "content", cleanedText,
                    "tokens", estimatedTokens,
                    "duration", duration
            );

        } catch (Exception e) {
            log.error("❌ Erreur appel Gemini: {}", e.getMessage(), e);

            if (e.getMessage().contains("429")) {
                throw new RuntimeException("⚠️ Limite Gemini atteinte (60 req/min). Réessayez dans 1 minute.");
            } else if (e.getMessage().contains("401")) {
                throw new RuntimeException("❌ Clé API Gemini invalide. Vérifiez GEMINI_API_KEY.");
            } else if (e.getMessage().contains("403")) {
                throw new RuntimeException("❌ Accès refusé. Vérifiez les permissions Gemini API.");
            }

            throw new RuntimeException("Erreur Gemini API: " + e.getMessage(), e);
        }
    }

    /**
     * Construire le prompt pour l'analyse
     */
    private String buildAnalysisPrompt(Email email, String tone) {
        return String.format("""
                Analyse cet email et réponds EN JSON VALIDE:
                
                De: %s (%s)
                Sujet: %s
                Contenu:
                %s
                
                Tone: %s
                
                Réponds EXACTEMENT avec ce JSON (PAS DE BACKTICKS, PAS DE MARKDOWN):
                {
                  "sentiment": "positive|negative|neutral",
                  "priority": "high|medium|low",
                  "category": "invoice|feedback|greeting|question|complaint|other",
                  "summary": "résumé 2-3 lignes",
                  "confidence": 0.95,
                  "reasoning": "brève explication"
                }
                """,
                email.getSenderEmail(),
                email.getSenderName() != null ? email.getSenderName() : "Unknown",
                email.getSubject(),
                email.getBody().substring(0, Math.min(500, email.getBody().length())),
                tone
        );
    }

    /**
     * Construire le prompt pour la génération de réponse
     */
    private String buildReplyPrompt(Email email, String tone, String language) {
        String langDisplay = language.equals("french") || language.equals("fr") ? "français" : "anglais";

        return String.format("""
                Génère une réponse professionnelle et concise à cet email EN %s.
                
                De: %s (%s)
                Sujet: %s
                Contenu:
                %s
                
                Tone: %s
                
                Réponds EXACTEMENT avec ce JSON (PAS DE BACKTICKS, PAS DE MARKDOWN):
                {
                  "text": "réponse courte et professionnelle (2-3 phrases max) en %s",
                  "confidence": 0.85
                }
                """,
                langDisplay,
                email.getSenderEmail(),
                email.getSenderName() != null ? email.getSenderName() : "Unknown",
                email.getSubject(),
                email.getBody().substring(0, Math.min(500, email.getBody().length())),
                tone,
                langDisplay
        );
    }
}