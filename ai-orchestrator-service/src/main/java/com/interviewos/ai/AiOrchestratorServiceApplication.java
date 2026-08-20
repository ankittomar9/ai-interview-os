package com.interviewos.ai;

import com.interviewos.ai.config.AiProviderProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.event.EventListener;

@Slf4j
@SpringBootApplication
@EnableConfigurationProperties(AiProviderProperties.class)
@EnableDiscoveryClient
public class AiOrchestratorServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiOrchestratorServiceApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("🚀 AiOrchestratorService is LIVE, initialized AI provider adapters (Ollama, Gemini, Groq, OpenAI), and registered with Eureka.");
    }
}
