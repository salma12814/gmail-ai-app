package com.agent.gmailai.gmail.controller;

import com.agent.gmailai.common.dto.ApiResponse;
import com.agent.gmailai.gmail.dto.SendReplyRequest;
import com.agent.gmailai.gmail.model.Email;
import com.agent.gmailai.gmail.service.GmailService;
import com.google.api.services.gmail.model.Message;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/gmail")
@Slf4j
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class GmailController {

    private final GmailService gmailService;

    /**
     * Synchroniser les emails pour un utilisateur
     */
    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<List<Email>>> syncEmails(@RequestParam Long userId) {
        try {
            log.info("📧 Synchronisation Gmail pour userId: {}", userId);
            List<Email> emails = gmailService.syncEmails(userId);
            log.info("✅ Synchronisation reussie: {} emails", emails.size());
            return ResponseEntity.ok(
                    ApiResponse.success(emails, emails.size() + " emails synchronises")
            );
        } catch (Exception e) {
            log.error("❌ Erreur synchronisation: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("SYNC_ERROR", "Erreur lors de la synchronisation: " + e.getMessage()));
        }
    }

    /**
     * Recuperer tous les emails d'un utilisateur
     */
    @GetMapping("/emails")
    public ResponseEntity<ApiResponse<List<Email>>> getUserEmails(@RequestParam Long userId) {
        try {
            log.info("📧 Recuperation emails pour userId: {}", userId);
            List<Email> emails = gmailService.getUserEmails(userId);
            log.info("✅ {} emails trouves", emails.size());
            return ResponseEntity.ok(
                    ApiResponse.success(emails, emails.size() + " emails trouves")
            );
        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("GET_EMAILS_ERROR", "Erreur: " + e.getMessage()));
        }
    }

    /**
     * Recuperer les emails non traites
     */
    @GetMapping("/unreplied")
    public ResponseEntity<ApiResponse<List<Email>>> getUnrepliedEmails(@RequestParam Long userId) {
        try {
            log.info("📧 Recuperation emails non repondus pour userId: {}", userId);
            List<Email> emails = gmailService.getUnrepliedEmails(userId);
            log.info("✅ {} emails non repondus trouves", emails.size());
            return ResponseEntity.ok(
                    ApiResponse.success(emails, emails.size() + " emails sans reponse")
            );
        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("GET_UNREPLIED_ERROR", "Erreur: " + e.getMessage()));
        }
    }

    /**
     * Marquer un email comme repondu
     */
    @PostMapping("/mark-replied")
    public ResponseEntity<ApiResponse<Void>> markAsReplied(@RequestParam Long emailId) {
        try {
            log.info("✏️ Marquage email {} comme repondu", emailId);
            gmailService.markAsReplied(emailId);
            log.info("✅ Email marque comme repondu");
            return ResponseEntity.ok(
                    ApiResponse.success(null, "Email marque comme repondu")
            );
        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("MARK_REPLIED_ERROR", "Erreur: " + e.getMessage()));
        }
    }

    /**
     * 🚀 NOUVEAU: Envoyer une réponse générée
     * ==========================================
     *
     * Endpoint pour envoyer les réponses générées par l'IA
     *
     * Paramètres:
     * - emailId: L'ID de l'email auquel on répond
     * - userId: L'ID de l'utilisateur
     * - requestBody: SendReplyRequest contenant le texte de la réponse
     *
     * Exemple d'utilisation:
     * POST /api/gmail/send-reply?emailId=123&userId=1
     * {
     *   "replyText": "Merci pour votre email, nous y répondrons bientôt",
     *   "markAsRead": true,
     *   "autoSend": true
     * }
     */
    @PostMapping("/send-reply")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendReply(
            @RequestParam Long emailId,
            @RequestParam Long userId,
            @RequestBody SendReplyRequest request) {

        try {
            log.info("🚀 ========== DÉBUT ENVOI RÉPONSE ==========");
            log.info("📧 EmailID: {}, UserID: {}", emailId, userId);
            log.info("📝 Contenu: {} caractères", request.getReplyText().length());

            // Vérifier que la réponse n'est pas vide
            if (request.getReplyText() == null || request.getReplyText().trim().isEmpty()) {
                log.warn("⚠️ Réponse vide!");
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("EMPTY_REPLY", "La réponse ne peut pas être vide"));
            }

            // Envoyer la réponse
            log.info("📤 Envoi de la réponse via Gmail API...");
            Message sentMessage = gmailService.sendReply(emailId, request.getReplyText(), userId);

            // Préparer la réponse
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("success", true);
            responseData.put("messageId", sentMessage.getId());
            responseData.put("threadId", sentMessage.getThreadId());
            responseData.put("timestamp", System.currentTimeMillis());
            responseData.put("message", "✅ Réponse envoyée avec succès!");

            log.info("✅ ========== RÉPONSE ENVOYÉE AVEC SUCCÈS ==========");
            log.info("📧 MessageID: {}", sentMessage.getId());

            return ResponseEntity.ok(
                    ApiResponse.success(responseData, "Réponse envoyée avec succès")
            );

        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Erreur validation: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("VALIDATION_ERROR", e.getMessage()));
        } catch (Exception e) {
            log.error("❌ ========== ERREUR LORS DE L'ENVOI ==========");
            log.error("❌ Message: {}", e.getMessage());
            log.error("❌ Cause: {}", e.getCause());
            e.printStackTrace();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(
                            "SEND_REPLY_ERROR",
                            "Erreur lors de l'envoi de la réponse: " + e.getMessage()
                    ));
        }
    }

    /**
     * 🚀 BONUS: Générer + Envoyer automatiquement (Mode Auto)
     * ========================================================
     *
     * Pour les cas avancés où tu veux générer et envoyer en une seule requête
     * (À implémenter une fois que Gemini AI est configuré)
     */
    @PostMapping("/generate-and-send")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateAndSendReply(
            @RequestParam Long emailId,
            @RequestParam Long userId,
            @RequestParam(defaultValue = "professional") String tone) {

        try {
            log.info("🚀 ========== MODE AUTO: GÉNÉRER + ENVOYER ==========");
            log.info("📧 EmailID: {}, UserID: {}, Tone: {}", emailId, userId, tone);

            // TODO: Appeler GeminiAIService pour générer la réponse
            // String generatedReply = geminiAIService.generateReply(emailId, tone);

            // Pour maintenant, retourner une erreur informative
            return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                    .body(ApiResponse.error(
                            "NOT_IMPLEMENTED",
                            "Mode Auto (Générer + Envoyer) - À implémenter avec Gemini AI"
                    ));

        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("AUTO_SEND_ERROR", "Erreur: " + e.getMessage()));
        }
    }
}