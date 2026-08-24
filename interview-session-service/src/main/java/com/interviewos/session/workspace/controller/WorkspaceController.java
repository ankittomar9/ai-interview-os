package com.interviewos.session.workspace.controller;

import com.interviewos.session.workspace.dto.WorkspaceProvisionRequest;
import com.interviewos.session.workspace.dto.WorkspaceProvisionResponse;
import com.interviewos.session.workspace.dto.WorkspaceStatusResponse;
import com.interviewos.session.workspace.service.WorkspaceProvisionerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/sessions/{id}/workspace")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceProvisionerService workspaceProvisionerService;

    @PostMapping("/provision")
    public ResponseEntity<WorkspaceProvisionResponse> provisionWorkspace(
            @PathVariable Long id,
            @Valid @RequestBody WorkspaceProvisionRequest request
    ) {
        log.info("Received workspace provision request for session: {}", id);
        WorkspaceProvisionResponse response = workspaceProvisionerService.provisionWorkspace(id, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status")
    public ResponseEntity<WorkspaceStatusResponse> getWorkspaceStatus(@PathVariable Long id) {
        WorkspaceStatusResponse response = workspaceProvisionerService.getWorkspaceStatus(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/destroy")
    public ResponseEntity<Void> destroyWorkspace(@PathVariable Long id) {
        log.info("Received workspace destroy request for session: {}", id);
        workspaceProvisionerService.destroyWorkspace(id);
        return ResponseEntity.noContent().build();
    }
}
