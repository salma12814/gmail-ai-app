package com.agent.gmailai.gmail.service;

import com.agent.gmailai.auth.model.UserAccount;
import com.agent.gmailai.auth.repository.UserAccountRepository;
import com.agent.gmailai.auth.service.EncryptionService;
import com.agent.gmailai.gmail.model.Email;
import com.agent.gmailai.gmail.repository.EmailRepository;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.Base64;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.model.Message;
import com.google.api.services.gmail.model.MessagePart;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.mail.MessagingException;
import javax.mail.Session;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Properties;

@Service
@Slf4j
@RequiredArgsConstructor
public class GmailService {

    private final EmailRepository emailRepository;
    private final UserAccountRepository userAccountRepository;
    private final EncryptionService encryptionService;

    @Value("${google.client.id:}")
    private String clientId;

    @Value("${google.client.secret:}")
    private String clientSecret;

    private static final String APPLICATION_NAME = "Gmail AI Agent";
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();

    /**
     * Synchroniser les emails depuis Gmail
     * ✅ FIX: Récupérer et déchiffrer le token depuis la base
     */
    public List<Email> syncEmails(Long userId) {
        try {
            log.info("📧 ========== DÉBUT SYNCHRONISATION GMAIL ==========");
            log.info("📍 Étape 1/5: Récupération de l'utilisateur...");

            // 1. Récupérer l'utilisateur
            UserAccount user = userAccountRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec ID: " + userId));
            log.info("✅ Utilisateur trouvé: {} (ID: {})", user.getEmail(), user.getId());

            // 2. Récupérer le token chiffré
            log.info("📍 Étape 2/5: Récupération du token chiffré...");
            String encryptedToken = user.getEncryptedAccessToken();

            if (encryptedToken == null || encryptedToken.isEmpty()) {
                log.error("❌ Token chiffré non trouvé pour l'utilisateur: {}", user.getId());
                throw new RuntimeException("Token d'accès non trouvé. Veuillez vous reconnecter.");
            }
            log.info("✅ Token chiffré trouvé: {}...", encryptedToken.substring(0, Math.min(20, encryptedToken.length())));

            // 3. Déchiffrer le token
            log.info("📍 Étape 3/5: Déchiffrement du token...");
            String accessToken;
            try {
                accessToken = encryptionService.decrypt(encryptedToken);
                log.info("✅ Token déchiffré avec succès: {}...", accessToken.substring(0, Math.min(20, accessToken.length())));
            } catch (Exception e) {
                log.error("❌ Erreur déchiffrement: {}", e.getMessage(), e);
                throw new RuntimeException("Erreur déchiffrement du token: " + e.getMessage(), e);
            }

            // 4. Appeler Gmail API
            log.info("📍 Étape 4/5: Appel Gmail API...");
            List<Email> emails = syncEmailsWithToken(userId, accessToken);

            log.info("📍 Étape 5/5: Synchronisation terminée");
            log.info("✅ ========== SYNCHRONISATION RÉUSSIE! ({} emails) ==========", emails.size());
            return emails;

        } catch (Exception e) {
            log.error("❌ ========== ERREUR SYNCHRONISATION ==========");
            log.error("❌ Message: {}", e.getMessage());
            log.error("❌ Cause: {}", e.getCause());
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de la récupération des emails: " + e.getMessage(), e);
        }
    }

    /**
     * Synchroniser avec le token déchiffré
     */
    private List<Email> syncEmailsWithToken(Long userId, String accessToken) {
        try {
            log.info("🔐 Initialisation du service Gmail...");
            Gmail gmailService = getGmailService(accessToken);

            log.info("📤 Récupération des emails non lus depuis Gmail API...");
            List<Message> messages = gmailService.users().messages()
                    .list("me")
                    .setQ("is:unread")
                    .setMaxResults(50L)
                    .execute()
                    .getMessages();

            List<Email> emails = new ArrayList<>();

            if (messages != null && !messages.isEmpty()) {
                log.info("📥 {} messages reçus de Gmail API", messages.size());

                for (int i = 0; i < messages.size(); i++) {
                    Message message = messages.get(i);
                    log.debug("🔄 Traitement du message {}/{}", (i + 1), messages.size());

                    Email email = processMessage(gmailService, userId, message);
                    if (email != null) {
                        emails.add(email);
                    }
                }
                log.info("✅ {} emails traités et sauvegardés", emails.size());
            } else {
                log.info("ℹ️ Aucun email non lu trouvé");
            }

            return emails;

        } catch (Exception e) {
            log.error("❌ Erreur Gmail API: {}", e.getMessage(), e);
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de la synchronisation Gmail: " + e.getMessage(), e);
        }
    }

    /**
     * Traiter un message Gmail
     */
    private Email processMessage(Gmail gmailService, Long userId, Message message) {
        try {
            log.debug("📧 Récupération du message complet: {}", message.getId());

            Message fullMessage = gmailService.users().messages()
                    .get("me", message.getId())
                    .setFormat("full")
                    .execute();

            String from = getHeaderValue(fullMessage, "From");
            String subject = getHeaderValue(fullMessage, "Subject");

            log.debug("📨 Sujet: {}, De: {}", subject, from);

            // Vérifier si l'email existe déjà
            if (emailRepository.findByGmailId(message.getId()).isPresent()) {
                log.debug("⏭️ Email {} déjà existant, ignoré", message.getId());
                return null;
            }

            String body = getEmailBody(fullMessage);
            String htmlBody = getEmailHtmlBody(fullMessage);

            Email email = Email.builder()
                    .userId(userId)
                    .gmailId(message.getId())
                    .senderEmail(extractEmail(from))
                    .senderName(extractName(from))
                    .subject(subject)
                    .body(body)
                    .htmlBody(htmlBody)
                    .receivedAt(LocalDateTime.now())
                    .createdAt(LocalDateTime.now())
                    .isReplied(false)
                    .build();

            Email savedEmail = emailRepository.save(email);
            log.info("💾 Email sauvegardé: ID={}, De: {}", savedEmail.getId(), email.getSenderEmail());
            return savedEmail;

        } catch (Exception e) {
            log.error("❌ Erreur traitement du message {}: {}", message.getId(), e.getMessage(), e);
            return null;
        }
    }

    /**
     * 🚀 NOUVELLE FONCTION: Envoyer une réponse via Gmail API
     * ========================================================
     */
    public Message sendReply(Long emailId, String replyText, Long userId) {
        try {
            log.info("🚀 ========== ENVOI RÉPONSE ==========");
            log.info("📧 EmailID: {}, UserID: {}", emailId, userId);

            // 1. Récupérer l'email original
            log.info("📍 Étape 1/4: Récupération de l'email original...");
            Email originalEmail = emailRepository.findById(emailId)
                    .orElseThrow(() -> new RuntimeException("Email non trouvé avec ID: " + emailId));
            log.info("✅ Email trouvé: {}", originalEmail.getSubject());

            // 2. Récupérer l'utilisateur et déchiffrer le token
            log.info("📍 Étape 2/4: Récupération et déchiffrement du token...");
            UserAccount user = userAccountRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec ID: " + userId));

            String encryptedToken = user.getEncryptedAccessToken();
            if (encryptedToken == null || encryptedToken.isEmpty()) {
                throw new RuntimeException("Token d'accès non trouvé");
            }

            String accessToken = encryptionService.decrypt(encryptedToken);
            log.info("✅ Token déchiffré");

            // 3. Créer et envoyer le message
            log.info("📍 Étape 3/4: Création du message...");
            Gmail gmailService = getGmailService(accessToken);
            Message sentMessage = sendEmailMessage(gmailService, user.getEmail(), originalEmail, replyText);
            log.info("✅ Message créé et envoyé");

            // 4. Marquer l'email comme répondu en BD
            log.info("📍 Étape 4/4: Mise à jour de la BD...");
            Email updatedEmail = originalEmail.toBuilder()
                    .isReplied(true)
                    .repliedAt(LocalDateTime.now())
                    .aiGeneratedReply(replyText)
                    .build();
            emailRepository.save(updatedEmail);
            log.info("✅ Email marqué comme répondu en BD");

            log.info("✅ ========== RÉPONSE ENVOYÉE AVEC SUCCÈS ==========");
            return sentMessage;

        } catch (Exception e) {
            log.error("❌ ========== ERREUR LORS DE L'ENVOI ==========");
            log.error("❌ Message: {}", e.getMessage(), e);
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de l'envoi de la réponse: " + e.getMessage(), e);
        }
    }

    /**
     * Créer et envoyer un message Email via Gmail API
     */
    private Message sendEmailMessage(Gmail gmailService, String fromEmail, Email originalEmail, String replyText)
            throws MessagingException, IOException {

        log.debug("🔧 Création du MimeMessage...");

        // Créer le MIME message
        MimeMessage message = new MimeMessage(Session.getDefaultInstance(new Properties()));
        message.setFrom(new InternetAddress(fromEmail));
        message.addRecipient(javax.mail.Message.RecipientType.TO,
                new InternetAddress(originalEmail.getSenderEmail()));

        // Sujet avec "Re:" si absent
        String subject = originalEmail.getSubject();
        if (!subject.startsWith("Re:")) {
            subject = "Re: " + subject;
        }
        message.setSubject(subject);
        log.debug("📨 Sujet: {}", subject);

        // Headers de conversation pour le threading Gmail
        message.addHeader("In-Reply-To", originalEmail.getGmailId());
        message.addHeader("References", originalEmail.getGmailId());
        log.debug("🔗 Headers de threading ajoutés");

        // Contenu du message
        message.setText(replyText, "utf-8");
        message.setSentDate(new Date());
        log.debug("📝 Contenu ajouté: {} caractères", replyText.length());

        // Encoder le message en base64
        log.debug("🔐 Encodage du message en Base64...");
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        message.writeTo(buffer);
        byte[] bytes = buffer.toByteArray();
        String encodedEmail = Base64.encodeBase64URLSafeString(bytes);
        log.debug("✅ Message encodé: {} bytes", bytes.length);

        // Créer le message Gmail
        log.debug("📤 Préparation du message Gmail API...");
        Message gmailMessage = new Message();
        gmailMessage.setRaw(encodedEmail);
        gmailMessage.setThreadId(originalEmail.getGmailId());

        // Envoyer via Gmail API
        log.info("📨 Envoi du message via Gmail API...");
        Message sentMessage = gmailService.users().messages()
                .send("me", gmailMessage)
                .execute();

        log.info("✅ Message envoyé! ID: {}", sentMessage.getId());
        return sentMessage;
    }

    /**
     * Récupérer le corps du message (texte brut)
     */
    private String getEmailBody(Message message) {
        try {
            if (message.getPayload().getParts() != null) {
                for (MessagePart part : message.getPayload().getParts()) {
                    if ("text/plain".equals(part.getMimeType()) && part.getBody().getData() != null) {
                        return new String(Base64.decodeBase64(part.getBody().getData()));
                    }
                }
            }
            if (message.getPayload().getBody() != null && message.getPayload().getBody().getData() != null) {
                return new String(Base64.decodeBase64(message.getPayload().getBody().getData()));
            }
        } catch (Exception e) {
            log.warn("⚠️ Erreur lors de la récupération du corps: {}", e.getMessage());
        }
        return "";
    }

    /**
     * Récupérer le corps HTML du message
     */
    private String getEmailHtmlBody(Message message) {
        try {
            if (message.getPayload().getParts() != null) {
                for (MessagePart part : message.getPayload().getParts()) {
                    if ("text/html".equals(part.getMimeType()) && part.getBody().getData() != null) {
                        return new String(Base64.decodeBase64(part.getBody().getData()));
                    }
                }
            }
        } catch (Exception e) {
            log.warn("⚠️ Erreur lors de la récupération du HTML: {}", e.getMessage());
        }
        return "";
    }

    /**
     * Récupérer la valeur d'un header
     */
    private String getHeaderValue(Message message, String headerName) {
        if (message.getPayload().getHeaders() != null) {
            for (com.google.api.services.gmail.model.MessagePartHeader header : message.getPayload().getHeaders()) {
                if (headerName.equalsIgnoreCase(header.getName())) {
                    return header.getValue() != null ? header.getValue() : "";
                }
            }
        }
        return "";
    }

    /**
     * Extraire l'email d'une chaîne "Name <email@domain.com>"
     */
    private String extractEmail(String from) {
        try {
            int startIndex = from.indexOf("<");
            int endIndex = from.indexOf(">");
            if (startIndex != -1 && endIndex != -1) {
                return from.substring(startIndex + 1, endIndex);
            }
        } catch (Exception e) {
            log.warn("⚠️ Erreur extraction email: {}", e.getMessage());
        }
        return from;
    }

    /**
     * Extraire le nom d'une chaîne "Name <email@domain.com>"
     */
    private String extractName(String from) {
        try {
            int startIndex = from.indexOf("<");
            if (startIndex > 0) {
                return from.substring(0, startIndex).trim().replaceAll("\"", "");
            }
        } catch (Exception e) {
            log.warn("⚠️ Erreur extraction nom: {}", e.getMessage());
        }
        return from;
    }

    /**
     * Créer le service Gmail avec le token d'accès
     */
    private Gmail getGmailService(String accessToken) throws Exception {
        log.debug("🔧 Initialisation du client Gmail...");
        NetHttpTransport HTTP_TRANSPORT = GoogleNetHttpTransport.newTrustedTransport();

        return new Gmail.Builder(HTTP_TRANSPORT, JSON_FACTORY, null)
                .setApplicationName(APPLICATION_NAME)
                .setHttpRequestInitializer(request -> {
                    request.getHeaders().setAuthorization("Bearer " + accessToken);
                    log.debug("🔐 Authorization header défini");
                })
                .build();
    }

    /**
     * Obtenir tous les emails de l'utilisateur
     */
    public List<Email> getUserEmails(Long userId) {
        log.info("📧 Récupération de tous les emails pour l'utilisateur: {}", userId);
        return emailRepository.findByUserIdOrderByReceivedAtDesc(userId);
    }

    /**
     * Obtenir les emails non traités (sans réponse)
     */
    public List<Email> getUnrepliedEmails(Long userId) {
        log.info("📧 Récupération des emails non répondus pour l'utilisateur: {}", userId);
        return emailRepository.findByUserIdAndIsRepliedFalse(userId);
    }

    /**
     * Marquer un email comme répondu
     */
    public void markAsReplied(Long emailId) {
        log.info("✏️ Marquage de l'email {} comme répondu...", emailId);
        emailRepository.findById(emailId).ifPresent(email -> {
            Email updatedEmail = email.toBuilder()
                    .isReplied(true)
                    .build();
            emailRepository.save(updatedEmail);
            log.info("✅ Email {} marqué comme répondu", emailId);
        });
    }
}