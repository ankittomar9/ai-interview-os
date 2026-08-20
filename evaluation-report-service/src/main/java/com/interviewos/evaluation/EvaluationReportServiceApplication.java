package com.interviewos.evaluation;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.event.EventListener;

@Slf4j
@SpringBootApplication
@EnableFeignClients
@EnableDiscoveryClient
public class EvaluationReportServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(EvaluationReportServiceApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("🚀 EvaluationReportService is LIVE, configured with OpenFeign clients for Session & Proctor services, and registered with Eureka.");
    }
}
