package com.interviewos.session.service;

import com.interviewos.session.dto.*;
import com.interviewos.session.entity.PracticeAttempt;
import com.interviewos.session.entity.SessionQuestion;
import com.interviewos.session.repository.PracticeAttemptRepository;
import com.interviewos.session.repository.SessionQuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class HistoryService {

    private static final Pattern DAY_PATTERN = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}$");

    private final PracticeAttemptRepository practiceAttemptRepository;
    private final SessionQuestionRepository sessionQuestionRepository;

    @Value("${app.default-tz:Asia/Kolkata}")
    private String appDefaultTz = "Asia/Kolkata";

    @Transactional(readOnly = true)
    public HistoryCalendarResponse getCalendar(String userId, String tz, String from, String to) {
        String effectiveUserId = resolveUserId(userId);
        ZoneId zone = resolveZone(tz);
        LocalDate today = LocalDate.now(zone);

        LocalDate fromDate;
        LocalDate toDate;

        if (from == null && to == null) {
            toDate = today;
            fromDate = today.minusDays(364);
        } else if (from != null && to == null) {
            fromDate = parseDay(from, "from");
            toDate = today;
        } else if (from == null) {
            toDate = parseDay(to, "to");
            fromDate = toDate.minusDays(364);
        } else {
            fromDate = parseDay(from, "from");
            toDate = parseDay(to, "to");
        }

        if (fromDate.isAfter(toDate)) {
            throw new HistoryValidationException("from day must be <= to day", "INVALID_RANGE");
        }
        long daysBetween = ChronoUnit.DAYS.between(fromDate, toDate);
        if (daysBetween > 730) {
            throw new HistoryValidationException("range exceeds 730 days: " + daysBetween, "RANGE_TOO_LARGE");
        }

        String fromDay = fromDate.toString();
        String toDay = toDate.toString();

        Instant toExcl = Instant.now().plus(Duration.ofDays(30));
        Instant windowToExcl = toDate.plusDays(1).atStartOfDay(zone).toInstant();
        if (windowToExcl.isAfter(toExcl)) {
            toExcl = windowToExcl;
        }

        List<HistoryEvent> allEvents = fetchAllEvents(effectiveUserId, toExcl);
        List<HistoryCalendarDayDto> days = buildDays(allEvents, zone, fromDay, toDay);
        HistoryStreakDto streak = buildStreak(allEvents, zone);

        return new HistoryCalendarResponse(
                effectiveUserId,
                zone.getId(),
                fromDay,
                toDay,
                days,
                streak,
                Instant.now()
        );
    }

    @Transactional(readOnly = true)
    public HistoryDayResponse getDay(String userId, String tz, String day) {
        String effectiveUserId = resolveUserId(userId);
        ZoneId zone = resolveZone(tz);
        LocalDate parsedDate = parseDay(day, "day");
        String dayKey = parsedDate.toString();

        Instant toExcl = Instant.now().plus(Duration.ofDays(30));
        Instant dayEndExcl = parsedDate.plusDays(1).atStartOfDay(zone).toInstant();
        if (dayEndExcl.isAfter(toExcl)) {
            toExcl = dayEndExcl;
        }

        List<HistoryEvent> allEvents = fetchAllEvents(effectiveUserId, toExcl);
        HistoryStreakDto streak = buildStreak(allEvents, zone);

        List<HistoryEvent> dayEvents = allEvents.stream()
                .filter(HistoryEvent::isAttempted)
                .filter(e -> e.at() != null && bucketDayKey(e.at(), zone).equals(dayKey))
                .toList();

        return buildDayDetail(effectiveUserId, zone.getId(), dayKey, dayEvents, streak);
    }

    @Transactional(readOnly = true)
    public HistoryStreakResponse getStreak(String userId, String tz) {
        String effectiveUserId = resolveUserId(userId);
        ZoneId zone = resolveZone(tz);

        Instant toExcl = Instant.now().plus(Duration.ofDays(30));
        List<HistoryEvent> allEvents = fetchAllEvents(effectiveUserId, toExcl);
        HistoryStreakDto streak = buildStreak(allEvents, zone);

        return HistoryStreakResponse.from(streak, zone.getId(), Instant.now());
    }

    private String resolveUserId(String userId) {
        return (userId != null && !userId.isBlank()) ? userId.trim() : "local";
    }

    ZoneId resolveZone(String tz) {
        String effectiveTz = (tz != null && !tz.isBlank()) ? tz.trim() : appDefaultTz;
        try {
            return ZoneId.of(effectiveTz);
        } catch (Exception e) {
            throw new HistoryValidationException("unknown timezone: " + effectiveTz, "INVALID_TZ");
        }
    }

    LocalDate parseDay(String dayStr, String fieldName) {
        if (dayStr == null || !DAY_PATTERN.matcher(dayStr).matches()) {
            throw new HistoryValidationException("invalid " + fieldName + " format: " + dayStr, "INVALID_DAY");
        }
        try {
            return LocalDate.parse(dayStr);
        } catch (DateTimeParseException e) {
            throw new HistoryValidationException("invalid " + fieldName + " format: " + dayStr, "INVALID_DAY");
        }
    }

    String bucketDayKey(Instant instant, ZoneId zone) {
        return ZonedDateTime.ofInstant(instant, zone).toLocalDate().toString();
    }

    List<HistoryCalendarDayDto> buildDays(List<HistoryEvent> events, ZoneId zone, String fromDay, String toDay) {
        Map<String, List<HistoryEvent>> byDay = new HashMap<>();

        for (HistoryEvent e : events) {
            if (e.at() == null || !e.isAttempted()) {
                continue;
            }
            String dayKey = bucketDayKey(e.at(), zone);
            if (dayKey.compareTo(fromDay) >= 0 && dayKey.compareTo(toDay) <= 0) {
                byDay.computeIfAbsent(dayKey, k -> new ArrayList<>()).add(e);
            }
        }

        List<HistoryCalendarDayDto> result = new ArrayList<>();
        List<String> sortedDayKeys = new ArrayList<>(byDay.keySet());
        Collections.sort(sortedDayKeys);

        for (String dayKey : sortedDayKeys) {
            List<HistoryEvent> dayEvents = byDay.get(dayKey);
            long attemptCount = dayEvents.size();

            long solvedCount = dayEvents.stream()
                    .filter(HistoryEvent::isPassed)
                    .map(HistoryEvent::questionId)
                    .distinct()
                    .count();

            long practiceSolved = dayEvents.stream()
                    .filter(e -> "PRACTICE".equalsIgnoreCase(e.source()) && e.isPassed())
                    .map(HistoryEvent::questionId)
                    .distinct()
                    .count();

            long interviewSolved = dayEvents.stream()
                    .filter(e -> "INTERVIEW".equalsIgnoreCase(e.source()) && e.isPassed())
                    .map(HistoryEvent::questionId)
                    .distinct()
                    .count();

            if (attemptCount >= 1) {
                result.add(new HistoryCalendarDayDto(
                        dayKey,
                        solvedCount,
                        attemptCount,
                        practiceSolved,
                        interviewSolved
                ));
            }
        }

        return result;
    }

    HistoryStreakDto buildStreak(List<HistoryEvent> allEvents, ZoneId zone) {
        LocalDate today = LocalDate.now(zone);

        Map<String, Set<String>> solvedQuestionsByDay = new HashMap<>();

        for (HistoryEvent e : allEvents) {
            if (e.at() == null || !e.isAttempted() || !e.isPassed()) {
                continue;
            }
            String dayKey = bucketDayKey(e.at(), zone);
            solvedQuestionsByDay.computeIfAbsent(dayKey, k -> new HashSet<>()).add(e.questionId());
        }

        Set<String> allSolvedDayKeys = solvedQuestionsByDay.keySet();

        long totalSolved = solvedQuestionsByDay.values().stream()
                .mapToLong(Set::size)
                .sum();

        List<LocalDate> sortedDates = allSolvedDayKeys.stream()
                .map(LocalDate::parse)
                .filter(d -> !d.isAfter(today))
                .sorted()
                .toList();

        if (sortedDates.isEmpty()) {
            return new HistoryStreakDto(0, 0, false, null, 0, totalSolved);
        }

        Set<String> S = sortedDates.stream().map(LocalDate::toString).collect(Collectors.toSet());
        boolean activeToday = S.contains(today.toString());
        LocalDate anchor = activeToday ? today : (S.contains(today.minusDays(1).toString()) ? today.minusDays(1) : null);

        int currentStreak = 0;
        if (anchor != null) {
            LocalDate d = anchor;
            while (S.contains(d.toString())) {
                currentStreak++;
                d = d.minusDays(1);
            }
        }

        int longestStreak = 0;
        int currentRun = 0;
        LocalDate prev = null;
        for (LocalDate d : sortedDates) {
            if (prev == null || d.equals(prev.plusDays(1))) {
                currentRun++;
            } else if (!d.equals(prev)) {
                currentRun = 1;
            }
            if (currentRun > longestStreak) {
                longestStreak = currentRun;
            }
            prev = d;
        }

        String lastSolvedDay = sortedDates.get(sortedDates.size() - 1).toString();
        long totalDaysActive = sortedDates.size();

        return new HistoryStreakDto(
                currentStreak,
                longestStreak,
                activeToday,
                lastSolvedDay,
                totalDaysActive,
                totalSolved
        );
    }

    HistoryDayResponse buildDayDetail(String userId, String tz, String day, List<HistoryEvent> dayEvents, HistoryStreakDto streak) {
        long attemptCount = dayEvents.size();
        long solvedCount = dayEvents.stream()
                .filter(HistoryEvent::isPassed)
                .map(HistoryEvent::questionId)
                .distinct()
                .count();

        List<HistoryDayItem> items = dayEvents.stream()
                .map(e -> new HistoryDayItem(
                        e.id(),
                        e.source(),
                        e.questionId(),
                        null,
                        e.track(),
                        e.verdict(),
                        e.detail(),
                        e.at(),
                        e.link()
                ))
                .sorted((a, b) -> {
                    Instant atA = a.at() != null ? a.at() : Instant.EPOCH;
                    Instant atB = b.at() != null ? b.at() : Instant.EPOCH;
                    int cmp = atB.compareTo(atA);
                    if (cmp != 0) return cmp;
                    int srcCmp = a.source().compareTo(b.source());
                    if (srcCmp != 0) return srcCmp;
                    return a.id().compareTo(b.id());
                })
                .collect(Collectors.toCollection(ArrayList::new));

        boolean truncated = false;
        if (items.size() > 200) {
            truncated = true;
            items = new ArrayList<>(items.subList(0, 200));
        }

        return new HistoryDayResponse(
                userId,
                tz,
                day,
                solvedCount,
                attemptCount,
                truncated,
                items,
                streak
        );
    }

    private List<HistoryEvent> fetchAllEvents(String effectiveUserId, Instant toExcl) {
        List<HistoryEvent> events = new ArrayList<>();

        List<PracticeAttempt> attempts = practiceAttemptRepository
                .findByUserIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtAsc(
                        effectiveUserId, Instant.EPOCH, toExcl);
        for (PracticeAttempt a : attempts) {
            String detail = String.format("%d/%d tests passed (%s)",
                    a.getTestsPassed(),
                    a.getTestsTotal(),
                    a.getRuntimeMs() != null ? a.getRuntimeMs() + "ms" : "n/a");
            events.add(new HistoryEvent(
                    "PRACTICE-" + a.getId(),
                    "PRACTICE",
                    a.getQuestionId(),
                    a.getVerdict(),
                    a.getTrack() != null ? a.getTrack() : "ALGORITHMS_DATA_STRUCTURES",
                    a.getCreatedAt(),
                    detail,
                    HistoryLinkDto.practice(a.getQuestionId())
            ));
        }

        List<SessionQuestion> sessionQuestions = sessionQuestionRepository
                .findAttemptedByCandidateAndWindow(effectiveUserId, Instant.EPOCH, toExcl);
        for (SessionQuestion sq : sessionQuestions) {
            if ("UNATTEMPTED".equalsIgnoreCase(sq.getVerdict())) {
                continue;
            }
            Instant ts = sq.getAttemptedAt() != null ? sq.getAttemptedAt() : sq.getUpdatedAt();
            if (ts == null) {
                continue;
            }
            int order = sq.getDisplayOrder() != null ? sq.getDisplayOrder() + 1 : 1;
            String detail = String.format("Session #%d (order: %d)", sq.getSessionId(), order);
            events.add(new HistoryEvent(
                    "INTERVIEW-" + sq.getId(),
                    "INTERVIEW",
                    sq.getQuestionSlug(),
                    sq.getVerdict(),
                    "INTERVIEW",
                    ts,
                    detail,
                    HistoryLinkDto.report(sq.getSessionId())
            ));
        }

        return events;
    }
}
