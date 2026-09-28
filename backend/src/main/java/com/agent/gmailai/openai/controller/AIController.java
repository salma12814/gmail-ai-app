package com.agent.gmailai.openai.controller;

import com.agent.gmailai.common.dto.ApiResponse;
import com.agent.gmailai.openai.service.AIService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@Slf4j
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;

    /**
     * Analyser un email avec Gemini (100% GRATUIT)
     */
    @PostMapping("/analyze")
    public ResponseEntity<ApiResponse<Map<String, Object>>> analyzeEmail(
            @RequestParam Long emailId,
            @RequestParam(defaultValue = "professional") String tone) {
        try {
            Map<String, Object> result = aiService.analyzeEmail(emailId, tone);

            // ✅ CORRECTION: Spécifier explicitement le type
            return ResponseEntity.ok(
                    ApiResponse.<Map<String, Object>>builder()  // ← Ajouter .<Map<String, Object>>
                            .success(true)
                            .message("Email analysé avec succès (Gemini - GRATUIT)")
                            .data(result)
                            .build()
            );
        } catch (Exception e) {
            log.error("❌ Erreur analyse: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.<Map<String, Object>>builder()  // ← Idem ici
                            .success(false)
                            .message("Erreur: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Générer une réponse automatique (100% GRATUIT)
     */
    @PostMapping("/generate-reply")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateReply(
            @RequestParam Long emailId,
            @RequestParam(defaultValue = "professional") String tone,
            @RequestParam(defaultValue = "fr") String language) {
        try {
            Map<String, Object> result = aiService.generateReply(emailId, tone, language);

            // ✅ CORRECTION
            return ResponseEntity.ok(
                    ApiResponse.<Map<String, Object>>builder()
                            .success(true)
                            .message("Réponse générée avec succès (Gemini - GRATUIT)")
                            .data(result)
                            .build()
            );
        } catch (Exception e) {
            log.error("❌ Erreur génération: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.<Map<String, Object>>builder()
                            .success(false)
                            .message("Erreur: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Analyser ET générer réponse en une seule requête (100% GRATUIT)
     */
    @PostMapping("/analyze-and-reply")
    public ResponseEntity<ApiResponse<Map<String, Object>>> analyzeAndReply(
            @RequestParam Long emailId,
            @RequestParam(defaultValue = "professional") String tone,
            @RequestParam(defaultValue = "fr") String language) {
        try {
            Map<String, Object> result = aiService.analyzeAndReply(emailId, tone, language);

            // ✅ CORRECTION
            return ResponseEntity.ok(
                    ApiResponse.<Map<String, Object>>builder()
                            .success(true)
                            .message("Email analysé et réponse générée (Gemini - GRATUIT)")
                            .data(result)
                            .build()
            );
        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.<Map<String, Object>>builder()
                            .success(false)
                            .message("Erreur: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Analyser plusieurs emails en batch
     */
    @PostMapping("/batch-analyze")
    public ResponseEntity<ApiResponse<Map<String, Object>>> batchAnalyze(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "10") Integer limit,
            @RequestParam(defaultValue = "professional") String tone) {
        try {
            // TODO: Implémenter batch analysis
            return ResponseEntity.ok(
                    ApiResponse.<Map<String, Object>>builder()
                            .success(true)
                            .message("Batch analysis initiated")
                            .build()
            );
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.<Map<String, Object>>builder()
                            .success(false)
                            .message("Erreur: " + e.getMessage())
                            .build());
        }
    }
}