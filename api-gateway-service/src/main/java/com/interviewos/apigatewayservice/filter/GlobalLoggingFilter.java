package com.interviewos.apigatewayservice.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.URI;

/**
 * Enterprise Global Gateway Request & Latency Logging Filter.
 * Logs every inbound request route, client IP, target microservice URI, response status, and duration in ms.
 */
@Slf4j
@Component
public class GlobalLoggingFilter implements GlobalFilter, Ordered {

    private static final String START_TIME_ATTR = "startTime";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        exchange.getAttributes().put(START_TIME_ATTR, System.currentTimeMillis());

        String path = request.getURI().getRawPath();
        String method = request.getMethod().name();
        String clientIp = request.getRemoteAddress() != null 
                ? request.getRemoteAddress().getAddress().getHostAddress() 
                : "unknown";

        log.info("➡️ INBOUND REQUEST: [{}] {} | Client IP: {}", method, path, clientIp);

        return chain.filter(exchange).then(Mono.fromRunnable(() -> {
            Long startTime = exchange.getAttribute(START_TIME_ATTR);
            long duration = (startTime != null) ? (System.currentTimeMillis() - startTime) : 0;

            ServerHttpResponse response = exchange.getResponse();
            int statusCode = response.getStatusCode() != null ? response.getStatusCode().value() : 500;

            Route route = exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_ROUTE_ATTR);
            String routeId = (route != null) ? route.getId() : "direct";
            URI targetUri = exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR);

            if (statusCode >= 400) {
                log.warn("⚠️ OUTBOUND ERROR: [{}] {} ➔ Status: {} [Target: {} via Route: {}] [Duration: {}ms]",
                        method, path, statusCode, targetUri != null ? targetUri : "N/A", routeId, duration);
            } else {
                log.info("⬅️ OUTBOUND RESPONSE: [{}] {} ➔ Status: {} [Target: {} via Route: {}] [Duration: {}ms]",
                        method, path, statusCode, targetUri != null ? targetUri : "N/A", routeId, duration);
            }
        }));
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }
}
