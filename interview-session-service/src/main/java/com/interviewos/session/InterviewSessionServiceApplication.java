package com.interviewos.session;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.EnableScheduling;

@Slf4j
@SpringBootApplication
@EnableDiscoveryClient
@EnableScheduling
public class InterviewSessionServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(InterviewSessionServiceApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("🚀 InterviewSessionService is LIVE, initialized JPA Repositories, and registered with Eureka/Prometheus.");
    }
}
