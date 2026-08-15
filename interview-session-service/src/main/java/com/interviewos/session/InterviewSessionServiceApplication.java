package com.interviewos.session;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class InterviewSessionServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(InterviewSessionServiceApplication.class, args);
    }
}
