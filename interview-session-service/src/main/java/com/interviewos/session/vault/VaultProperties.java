package com.interviewos.session.vault;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Component
@ConfigurationProperties(prefix = "vault")
public class VaultProperties {

    /**
     * Host directory where completed session recordings, transcripts, reports, and code are archived.
     * Default: D:/AI OS Interview Media (or /vault when running in Docker container).
     */
    @Builder.Default
    private String root = "D:/AI OS Interview Media";

    /**
     * Cron expression for the vault lazy sweeper job.
     * Default: 0 30 3 * * ? (3:30 AM daily, offset from 3:00 AM hygiene purge).
     */
    @Builder.Default
    private String sweepCron = "0 30 3 * * ?";

    /**
     * Whether the sweeper runs in log-only dry-run mode.
     * Default: false.
     */
    @Builder.Default
    private boolean sweepDryRun = false;
}
