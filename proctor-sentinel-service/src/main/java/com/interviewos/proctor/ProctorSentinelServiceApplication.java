package com.interviewos.proctor;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.event.EventListener;

@Slf4j
@SpringBootApplication
@EnableDiscoveryClient
public class ProctorSentinelServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProctorSentinelServiceApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("🚀 ProctorSentinelService is LIVE, tracking real-time telemetry (tab switch, paste dump, bursts), and registered with Eureka.");
    }
}
