package com.interviewos.session.service;

import com.interviewos.session.document.ResumeDocument;
import com.interviewos.session.model.DifficultyLevel;
import com.interviewos.session.model.InterviewTrack;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoleCalibrationService {

    public DifficultyLevel inferDifficulty(ResumeDocument resume) {
        if (resume == null || resume.getYearsOfExperience() == null) {
            return DifficultyLevel.MID;
        }
        int years = resume.getYearsOfExperience();
        if (years < 2) return DifficultyLevel.JUNIOR;
        if (years < 5) return DifficultyLevel.MID;
        if (years < 10) return DifficultyLevel.SENIOR;
        return DifficultyLevel.STAFF;
    }

    public List<String> calibrateSkills(ResumeDocument resume, InterviewTrack track) {
        if (resume == null || resume.getSkills() == null || resume.getSkills().isEmpty()) {
            return List.of();
        }
        return resume.getSkills().stream()
                .filter(skill -> isRelevantToTrack(skill, track))
                .limit(5)
                .toList();
    }

    private boolean isRelevantToTrack(String skill, InterviewTrack track) {
        if (track == null || skill == null) return true;
        String s = skill.toLowerCase();
        return switch (track) {
            case SQL -> s.contains("sql") || s.contains("postgre") || s.contains("mysql") || s.contains("mongo") || s.contains("db");
            case SYSTEM_DESIGN -> s.contains("system") || s.contains("distributed") || s.contains("microservice") || s.contains("kafka") || s.contains("cloud") || s.contains("aws") || s.contains("docker");
            case SPRING_LLD, JAVA_SPRING_BOOT -> s.contains("java") || s.contains("spring") || s.contains("concurrency") || s.contains("multithread") || s.contains("design");
            case BEHAVIORAL_STAR -> s.contains("agile") || s.contains("scrum") || s.contains("lead") || s.contains("mentor") || s.contains("communicat");
            default -> true;
        };
    }
}
