package com.interviewos.servicediscoveryservice;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;
import org.springframework.context.event.EventListener;

@Slf4j
@SpringBootApplication
@EnableEurekaServer
public class ServiceDiscoveryServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServiceDiscoveryServiceApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("🚀 ServiceDiscoveryService (Eureka Server) is LIVE on port 8761 and accepting microservice registrations.");
    }
}
