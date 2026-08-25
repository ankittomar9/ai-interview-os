package com.interviewos.session.runner.sql;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SqlResultComparatorTest {

    private SqlResultComparator comparator;

    @BeforeEach
    void setUp() {
        comparator = new SqlResultComparator();
    }

    @Test
    @DisplayName("Should pass exact matching ordered results")
    void testExactMatchingOrdered() {
        String actual = "id,name,amount\n1,Alice,100.00\n2,Bob,250.50";
        String expected = "id,name,amount\n1,Alice,100\n2,Bob,250.5";

        SqlResultComparator.ComparisonResult result = comparator.compare(actual, expected, true);
        assertTrue(result.passed());
        assertEquals("PASS", result.status());
        assertEquals(2, result.actualRowCount());
    }

    @Test
    @DisplayName("Should pass unordered multiset when rows are in different order")
    void testUnorderedMultiset() {
        String actual = "user_id,revenue\n2,500.00\n1,300.00\n3,100.00";
        String expected = "USER_ID,REVENUE\n1,300\n2,500\n3,100";

        SqlResultComparator.ComparisonResult result = comparator.compare(actual, expected, false);
        assertTrue(result.passed());
        assertEquals("PASS", result.status());
    }

    @Test
    @DisplayName("Should fail ordered comparison when row order differs")
    void testOrderedComparisonFailsOnOrderMismatch() {
        String actual = "user_id,revenue\n2,500.00\n1,300.00";
        String expected = "user_id,revenue\n1,300.00\n2,500.00";

        SqlResultComparator.ComparisonResult result = comparator.compare(actual, expected, true);
        assertFalse(result.passed());
        assertEquals("FAIL", result.status());
        assertTrue(result.summary().contains("Row mismatch"));
    }

    @Test
    @DisplayName("Should normalize nulls, case, and numerics")
    void testNormalizationRules() {
        String actual = "id,status,score,active\n10,NULL,0.00,TRUE\n20,,15.500,t";
        String expected = "ID,STATUS,SCORE,ACTIVE\n10,,0,true\n20,null,15.5,true";

        SqlResultComparator.ComparisonResult result = comparator.compare(actual, expected, true);
        assertTrue(result.passed());
    }

    @Test
    @DisplayName("Should fail when column count differs")
    void testColumnCountMismatch() {
        String actual = "id,name,extra\n1,Alice,x";
        String expected = "id,name\n1,Alice";

        SqlResultComparator.ComparisonResult result = comparator.compare(actual, expected, false);
        assertFalse(result.passed());
        assertTrue(result.summary().contains("Column count mismatch"));
    }

    @Test
    @DisplayName("Should fail when column name differs")
    void testColumnNameMismatch() {
        String actual = "user_id,full_name\n1,Alice";
        String expected = "id,name\n1,Alice";

        SqlResultComparator.ComparisonResult result = comparator.compare(actual, expected, false);
        assertFalse(result.passed());
        assertTrue(result.summary().contains("Column name mismatch"));
    }

    @Test
    @DisplayName("Should handle row cap truncation exceeding 500 rows")
    void testRowCapTruncation() {
        StringBuilder sb = new StringBuilder("id,value\n");
        for (int i = 1; i <= 505; i++) {
            sb.append(i).append(",val\n");
        }
        String actual = sb.toString();
        String expected = "id,value\n1,val";

        SqlResultComparator.ComparisonResult result = comparator.compare(actual, expected, false);
        assertFalse(result.passed());
        assertEquals("TRUNCATED", result.status());
        assertTrue(result.summary().contains("exceeded row cap"));
    }
}
