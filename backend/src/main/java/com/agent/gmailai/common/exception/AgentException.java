package com.agent.gmailai.common.exception;

public class AgentException extends RuntimeException {

    private String code;
    private Object data;

    public AgentException(String message) {
        super(message);
        this.code = "AGENT_ERROR";
    }

    public AgentException(String message, String code) {
        super(message);
        this.code = code;
    }

    public AgentException(String message, String code, Object data) {
        super(message);
        this.code = code;
        this.data = data;
    }

    public String getCode() { return code; }
    public Object getData() { return data; }
}