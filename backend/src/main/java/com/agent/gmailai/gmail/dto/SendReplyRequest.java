package com.agent.gmailai.gmail.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendReplyRequest {

    private String replyText;

    private Boolean markAsRead;

    private Boolean autoSend;
}