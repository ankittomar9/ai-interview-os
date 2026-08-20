package com.interviewos.proctor.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "proctor.scoring")
public class ProctorScoringProperties {

    private int initialIntegrityScore = 100;
    private int tabBlurPenalty = 5;
    private int pasteDumpPenalty = 8;
    private int pasteCharacterThreshold = 200;
    private int keystrokeBurstPenalty = 10;
    private int keystrokeBurstCpmThreshold = 800;
}
