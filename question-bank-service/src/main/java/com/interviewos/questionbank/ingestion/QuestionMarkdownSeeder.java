package com.interviewos.questionbank.ingestion;

import com.interviewos.questionbank.document.QuestionDocument;
import com.interviewos.questionbank.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class QuestionMarkdownSeeder implements CommandLineRunner {

    private final QuestionRepository questionRepository;
    private final QuestionMarkdownParser markdownParser;
    private final ContentValidator contentValidator;

    @Override
    public void run(String... args) {
        try {
            log.info("📂 Scanning classpath for Markdown Questions under content/questions/**/*.md...");
            ResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            Resource[] resources = resolver.getResources("classpath*:content/questions/**/*.md");

            if (resources.length == 0) {
                log.info("ℹ️ No markdown questions found under content/questions/**/*.md.");
                return;
            }

            int publishedCount = 0;
            int draftCount = 0;

            for (Resource res : resources) {
                String filename = res.getFilename() != null ? res.getFilename() : "unknown.md";
                try (InputStream is = res.getInputStream()) {
                    String content = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                    QuestionDocument doc = markdownParser.parse(content, filename);
                    ContentValidator.ValidationResult valResult = contentValidator.validate(doc, content);

                    // Idempotent Upsert by Slug
                    Optional<QuestionDocument> existing = questionRepository.findBySlug(doc.getSlug());
                    if (existing.isPresent()) {
                        doc.setId(existing.get().getId());
                    }

                    questionRepository.save(doc);

                    if ("PUBLISHED".equalsIgnoreCase(doc.getStatus())) {
                        publishedCount++;
                    } else {
                        draftCount++;
                        log.warn("⚠️ Question '{}' landed in status DRAFT. Reasons: {}", doc.getSlug(), valResult.errors());
                    }
                } catch (Exception e) {
                    log.error("❌ Failed to parse and seed markdown question '{}': {}", filename, e.getMessage(), e);
                    draftCount++;
                }
            }

            log.info("✅ Finished Markdown Question Ingestion: Total = {}, PUBLISHED = {}, DRAFT = {}",
                    resources.length, publishedCount, draftCount);

        } catch (Exception e) {
            log.error("Error during Markdown Question Seeding: {}", e.getMessage(), e);
        }
    }
}
