package com.agent.gmailai.gmail.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "emails")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class Email {

    // ===== CHAMPS EXISTANTS =====

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, unique = true)
    private String gmailId;

    @Column(nullable = false)
    private String senderEmail;

    private String senderName;

    @Column(nullable = false)
    private String subject;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(columnDefinition = "TEXT")
    private String htmlBody;

    private LocalDateTime receivedAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    // ✅ NOUVEAU CHAMP - ÉTAT LU/NON LU
    @Column(name = "is_read")
    private Boolean isRead = false;  // Par défaut: non lu


    // ===== NOUVEAUX CHAMPS - PHASE 2 (ANALYSE IA) =====

    /**
     * Timestamp quand l'email a été analysé
     */
    private LocalDateTime analysedAt;

    /**
     * Résultat de l'analyse IA (JSON)
     * Format: {
     *   "sentiment": "positive|negative|neutral",
     *   "priority": "high|medium|low",
     *   "category": "invoice|feedback|greeting|...",
     *   "summary": "résumé 2-3 lignes",
     *   "confidence": 0.95,
     *   "reasoning": "explication"
     * }
     */
    @Column(columnDefinition = "TEXT")
    private String aiAnalysis;

    /**
     * Réponse générée automatiquement
     */
    @Column(columnDefinition = "TEXT")
    private String aiGeneratedReply;

    /**
     * Timestamp quand la réponse a été générée
     */
    private LocalDateTime repliedAt;

    /**
     * Confiance de l'analyse IA (0.0 à 1.0)
     */
    @Column(columnDefinition = "DECIMAL(3,2)")
    private Float aiConfidence;

    /**
     * L'utilisateur a approuvé la réponse auto-générée
     */
    private Boolean autoReplyApproved;

    /**
     * Quel modèle IA a été utilisé
     * Valeurs: "gemini-2.0-flash", "gpt-4-turbo", etc
     */
    private String aiModel;

    /**
     * Nombre de tokens consommés par l'API IA
     */
    private Integer tokensUsed;

    /**
     * Email a été marqué comme répondu
     */
    private Boolean isReplied;


    // ===== LIFECYCLE HOOKS =====

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (isRead == null) {
            isRead = false;
        }
        if (isReplied == null) {
            isReplied = false;
        }
        if (autoReplyApproved == null) {
            autoReplyApproved = false;
        }
    }


    // ===== HELPER METHODS =====

    /**
     * Vérifier si l'email a été analysé
     */
    public boolean isAnalyzed() {
        return aiAnalysis != null && analysedAt != null;
    }

    /**
     * Vérifier si une réponse a été générée
     */
    public boolean hasGeneratedReply() {
        return aiGeneratedReply != null && !aiGeneratedReply.isEmpty();
    }

    /**
     * Obtenir la confiance en pourcentage
     */
    public String getConfidencePercentage() {
        if (aiConfidence == null) return "N/A";
        return String.format("%.0f%%", aiConfidence * 100);
    }


    // ===== GETTERS/SETTERS PERSONNALISÉS =====

    public void setIsReplied(boolean isReplied) {
        this.isReplied = isReplied;
    }

    public Boolean getIsReplied() {
        return isReplied != null ? isReplied : false;
    }

    public Boolean getAutoReplyApproved() {
        return autoReplyApproved != null ? autoReplyApproved : false;
    }

    public Boolean getIsRead() {
        return isRead != null ? isRead : false;

    }




    // ===== TOSTRING =====

    @Override
    public String toString() {
        return "Email{" +
                "id=" + id +
                ", userId=" + userId +
                ", gmailId='" + gmailId + '\'' +
                ", senderEmail='" + senderEmail + '\'' +
                ", senderName='" + senderName + '\'' +
                ", subject='" + subject + '\'' +
                ", isRead=" + isRead +
                ", isReplied=" + isReplied +
                ", isAnalyzed=" + isAnalyzed() +
                ", aiModel='" + aiModel + '\'' +
                ", aiConfidence=" + aiConfidence +
                ", createdAt=" + createdAt +
                ", analysedAt=" + analysedAt +
                '}';
    }
}