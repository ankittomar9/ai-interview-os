package com.interviewos.proctor;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Disabled("Requires live PostgreSQL database container")
class ProctorSentinelServiceApplicationTests {

    @Test
    void contextLoads() {
    }
}
