package com.interviewos.ai;

import com.interviewos.ai.config.AiProviderProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(AiProviderProperties.class)
public class AiOrchestratorServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiOrchestratorServiceApplication.class, args);
    }
}
