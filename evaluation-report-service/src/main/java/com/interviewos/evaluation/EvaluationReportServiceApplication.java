package com.interviewos.evaluation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class EvaluationReportServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(EvaluationReportServiceApplication.class, args);
    }
}
