package com.interviewos.session;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Disabled("Requires live PostgreSQL and MongoDB database containers")
class InterviewSessionServiceApplicationTests {

    @Test
    void contextLoads() {
    }
}
