package com.interviewos.apigatewayservice;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class ApiGatewayServiceApplicationTests {

    @Autowired
    private RouteLocator routeLocator;

    @Test
    void contextLoads() {
        assertNotNull(routeLocator);
    }

    @Test
    @DisplayName("Gate VP15: Gateway has no route matching /internal/** ensuring network isolation")
    void testNoGatewayRouteMatchesInternalPaths() {
        MockServerHttpRequest request = MockServerHttpRequest
                .post("/internal/v1/sessions/1/sections/0/gate/open")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        boolean matchesAnyRoute = routeLocator.getRoutes()
                .filterWhen(route -> route.getPredicate().apply(exchange))
                .hasElements()
                .blockOptional()
                .orElse(false);

        assertFalse(matchesAnyRoute, "Gateway must not match /internal/** routes from outside");
    }

}

