package com.interviewos.session.runner.sql;

import lombok.Builder;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.util.*;

@Slf4j
public class SqlResultComparator {

    public static final int MAX_ROW_CAP = 500;

    @Builder
    public record ComparisonResult(
            boolean passed,
            String status, // "PASS", "FAIL", "SYNTAX_ERROR", "TRUNCATED"
            String summary,
            String actualFormatted,
            String expectedFormatted,
            int actualRowCount,
            int expectedRowCount
    ) {}

    /**
     * Compares candidate query CSV output against expected canonical CSV.
     *
     * @param actualCsv   Raw CSV string produced by candidate query (header on row 1)
     * @param expectedCsv Canonical CSV string configured for the problem
     * @param ordered     Whether row ordering is significant
     * @return ComparisonResult with pass/fail verdict, summary, and formatted tables
     */
    public ComparisonResult compare(String actualCsv, String expectedCsv, boolean ordered) {
        List<List<String>> actualRows = parseCsv(actualCsv);
        List<List<String>> expectedRows = parseCsv(expectedCsv);

        if (actualRows.isEmpty()) {
            return ComparisonResult.builder()
                    .passed(false)
                    .status("FAIL")
                    .summary("Candidate query produced an empty result set.")
                    .actualFormatted("")
                    .expectedFormatted(formatAsTable(expectedRows))
                    .actualRowCount(0)
                    .expectedRowCount(Math.max(0, expectedRows.size() - 1))
                    .build();
        }

        if (expectedRows.isEmpty()) {
            return ComparisonResult.builder()
                    .passed(true)
                    .status("PASS")
                    .summary("Query executed successfully.")
                    .actualFormatted(formatAsTable(actualRows))
                    .expectedFormatted("")
                    .actualRowCount(Math.max(0, actualRows.size() - 1))
                    .expectedRowCount(0)
                    .build();
        }

        // Check row cap (excluding header)
        int actualDataRowsCount = actualRows.size() - 1;
        if (actualDataRowsCount > MAX_ROW_CAP) {
            return ComparisonResult.builder()
                    .passed(false)
                    .status("TRUNCATED")
                    .summary(String.format("Result exceeded row cap: %d rows returned (maximum allowed is %d).",
                            actualDataRowsCount, MAX_ROW_CAP))
                    .actualFormatted(formatAsTable(actualRows.subList(0, Math.min(50, actualRows.size()))))
                    .expectedFormatted(formatAsTable(expectedRows))
                    .actualRowCount(actualDataRowsCount)
                    .expectedRowCount(expectedRows.size() - 1)
                    .build();
        }

        // 1. Header Validation (Case-insensitive)
        List<String> actualHeader = actualRows.get(0).stream().map(String::trim).toList();
        List<String> expectedHeader = expectedRows.get(0).stream().map(String::trim).toList();

        if (actualHeader.size() != expectedHeader.size()) {
            return ComparisonResult.builder()
                    .passed(false)
                    .status("FAIL")
                    .summary(String.format("Column count mismatch: expected %d columns %s, got %d columns %s.",
                            expectedHeader.size(), expectedHeader, actualHeader.size(), actualHeader))
                    .actualFormatted(formatAsTable(actualRows))
                    .expectedFormatted(formatAsTable(expectedRows))
                    .actualRowCount(actualDataRowsCount)
                    .expectedRowCount(expectedRows.size() - 1)
                    .build();
        }

        for (int c = 0; c < expectedHeader.size(); c++) {
            if (!actualHeader.get(c).equalsIgnoreCase(expectedHeader.get(c))) {
                return ComparisonResult.builder()
                        .passed(false)
                        .status("FAIL")
                        .summary(String.format("Column name mismatch at position %d: expected '%s', got '%s'.",
                                c + 1, expectedHeader.get(c), actualHeader.get(c)))
                        .actualFormatted(formatAsTable(actualRows))
                        .expectedFormatted(formatAsTable(expectedRows))
                        .actualRowCount(actualDataRowsCount)
                        .expectedRowCount(expectedRows.size() - 1)
                        .build();
            }
        }

        // 2. Data Rows Extraction and Cell Normalization
        List<List<String>> actualData = normalizeDataRows(actualRows.subList(1, actualRows.size()));
        List<List<String>> expectedData = normalizeDataRows(expectedRows.subList(1, expectedRows.size()));

        if (actualData.size() != expectedData.size()) {
            return ComparisonResult.builder()
                    .passed(false)
                    .status("FAIL")
                    .summary(String.format("Row count mismatch: expected %d rows, got %d rows.",
                            expectedData.size(), actualData.size()))
                    .actualFormatted(formatAsTable(actualRows))
                    .expectedFormatted(formatAsTable(expectedRows))
                    .actualRowCount(actualData.size())
                    .expectedRowCount(expectedData.size())
                    .build();
        }

        // 3. Row Sequence Comparison
        if (ordered) {
            for (int r = 0; r < expectedData.size(); r++) {
                List<String> aRow = actualData.get(r);
                List<String> eRow = expectedData.get(r);
                if (!aRow.equals(eRow)) {
                    return ComparisonResult.builder()
                            .passed(false)
                            .status("FAIL")
                            .summary(String.format("Row mismatch at row %d:\n  Expected: %s\n  Actual:   %s",
                                    r + 1, eRow, aRow))
                            .actualFormatted(formatAsTable(actualRows))
                            .expectedFormatted(formatAsTable(expectedRows))
                            .actualRowCount(actualData.size())
                            .expectedRowCount(expectedData.size())
                            .build();
                }
            }
        } else {
            // Unordered multiset comparison
            List<String> aSerialized = actualData.stream().map(row -> String.join("\t", row)).sorted().toList();
            List<String> eSerialized = expectedData.stream().map(row -> String.join("\t", row)).sorted().toList();

            for (int r = 0; r < eSerialized.size(); r++) {
                if (!aSerialized.get(r).equals(eSerialized.get(r))) {
                    return ComparisonResult.builder()
                            .passed(false)
                            .status("FAIL")
                            .summary("Result set rows do not match expected records (multiset comparison).")
                            .actualFormatted(formatAsTable(actualRows))
                            .expectedFormatted(formatAsTable(expectedRows))
                            .actualRowCount(actualData.size())
                            .expectedRowCount(expectedData.size())
                            .build();
                }
            }
        }

        return ComparisonResult.builder()
                .passed(true)
                .status("PASS")
                .summary(String.format("Query executed successfully. %d rows matched expected output.", actualData.size()))
                .actualFormatted(formatAsTable(actualRows))
                .expectedFormatted(formatAsTable(expectedRows))
                .actualRowCount(actualData.size())
                .expectedRowCount(expectedData.size())
                .build();
    }

    public List<List<String>> normalizeDataRows(List<List<String>> rawRows) {
        List<List<String>> normalized = new ArrayList<>();
        for (List<String> row : rawRows) {
            List<String> normRow = new ArrayList<>();
            for (String cell : row) {
                normRow.add(normalizeCell(cell));
            }
            normalized.add(normRow);
        }
        return normalized;
    }

    public String normalizeCell(String raw) {
        if (raw == null) return "";
        String trimmed = raw.trim();

        if (trimmed.isEmpty() || trimmed.equalsIgnoreCase("null") || trimmed.equalsIgnoreCase("<null>")) {
            return "";
        }

        // Boolean normalization
        if (trimmed.equalsIgnoreCase("true") || trimmed.equalsIgnoreCase("t")) {
            return "true";
        }
        if (trimmed.equalsIgnoreCase("false") || trimmed.equalsIgnoreCase("f")) {
            return "false";
        }

        // Numeric normalization (1.0 == 1, 0.50 == 0.5, -0.0 == 0)
        try {
            BigDecimal bd = new BigDecimal(trimmed);
            BigDecimal stripped = bd.stripTrailingZeros();
            if (stripped.compareTo(BigDecimal.ZERO) == 0) {
                return "0";
            }
            return stripped.toPlainString();
        } catch (NumberFormatException ignored) {
            // Not a number, return trimmed string
            return trimmed;
        }
    }

    public List<List<String>> parseCsv(String csvContent) {
        if (csvContent == null || csvContent.isBlank()) {
            return List.of();
        }

        List<List<String>> records = new ArrayList<>();
        String[] lines = csvContent.replace("\r\n", "\n").replace('\r', '\n').split("\n");

        for (String line : lines) {
            String trimmedLine = line.trim();
            if (trimmedLine.isEmpty()) continue;

            List<String> cells = parseCsvLine(trimmedLine);
            if (!cells.isEmpty()) {
                records.add(cells);
            }
        }
        return records;
    }

    private List<String> parseCsvLine(String line) {
        List<String> tokens = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    sb.append('"');
                    i++; // skip escaped quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                tokens.add(sb.toString().trim());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        tokens.add(sb.toString().trim());
        return tokens;
    }

    public String formatAsTable(List<List<String>> rows) {
        if (rows == null || rows.isEmpty()) return "";

        int cols = rows.stream().mapToInt(List::size).max().orElse(0);
        if (cols == 0) return "";

        int[] colWidths = new int[cols];
        for (List<String> row : rows) {
            for (int i = 0; i < row.size(); i++) {
                String val = row.get(i) != null ? row.get(i) : "";
                colWidths[i] = Math.max(colWidths[i], Math.max(3, val.length()));
            }
        }

        StringBuilder sb = new StringBuilder();
        for (int r = 0; r < rows.size(); r++) {
            List<String> row = rows.get(r);
            StringBuilder line = new StringBuilder();
            for (int c = 0; c < cols; c++) {
                String val = c < row.size() && row.get(c) != null ? row.get(c) : "";
                line.append(String.format("%-" + colWidths[c] + "s", val));
                if (c < cols - 1) line.append(" | ");
            }
            sb.append(line).append("\n");

            if (r == 0) {
                StringBuilder sep = new StringBuilder();
                for (int c = 0; c < cols; c++) {
                    sep.append("-".repeat(colWidths[c]));
                    if (c < cols - 1) sep.append("-+-");
                }
                sb.append(sep).append("\n");
            }
        }
        return sb.toString().trim();
    }
}
