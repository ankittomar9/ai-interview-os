package com.interviewos.session.controller;

import com.interviewos.session.service.SessionRecordingService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class SessionRecordingControllerTest {

    @Mock
    private SessionRecordingService recordingService;

    @InjectMocks
    private SessionRecordingController controller;

    @Test
    @DisplayName("uploadChunk saves chunk successfully with clean parameters")
    void testUploadChunkSuccess() throws Exception {
        MockMultipartFile chunk = new MockMultipartFile("chunk", "test.webm", "video/webm", new byte[]{1, 2, 3});
        ResponseEntity<Map<String, Object>> response = controller.uploadChunk(1L, "0", "camera", chunk);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(recordingService).saveChunk(1L, 0, "camera", chunk);
    }

    @Test
    @DisplayName("uploadChunk defensively sanitizes duplicated seq and kind (e.g. seq='0,0', kind='camera,camera')")
    void testUploadChunkDuplicatedParamsSanitization() throws Exception {
        MockMultipartFile chunk = new MockMultipartFile("chunk", "test.webm", "video/webm", new byte[]{1, 2, 3});
        ResponseEntity<Map<String, Object>> response = controller.uploadChunk(1L, "0,0", "camera,camera", chunk);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(recordingService).saveChunk(1L, 0, "camera", chunk);
    }

    @Test
    @DisplayName("uploadChunk rejects invalid kind with 400")
    void testUploadChunkInvalidKind() {
        MockMultipartFile chunk = new MockMultipartFile("chunk", "test.webm", "video/webm", new byte[]{1, 2, 3});
        ResponseEntity<Map<String, Object>> response = controller.uploadChunk(1L, "0", "invalid_kind", chunk);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("reportDroppedChunk records dropped chunk notice")
    void testReportDroppedChunk() {
        ResponseEntity<Void> response = controller.reportDroppedChunk(1L, "3", "screen", "PAYLOAD_TOO_LARGE_413");
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(recordingService).recordDroppedChunk(1L, 3, "screen", "PAYLOAD_TOO_LARGE_413");
    }

    @Test
    @DisplayName("handleMaxSizeException returns 413 PAYLOAD_TOO_LARGE with corrected hint")
    void testHandleMaxSizeException() {
        MaxUploadSizeExceededException ex = new MaxUploadSizeExceededException(16 * 1024 * 1024);
        ResponseEntity<Map<String, String>> response = controller.handleMaxSizeException(ex);
        assertEquals(HttpStatus.PAYLOAD_TOO_LARGE, response.getStatusCode());
        assertTrue(response.getBody().get("error").contains("16MB"));
        assertTrue(response.getBody().get("hint").contains("verify bitrate ladder"));
    }

    @Test
    @DisplayName("recordSummary stores summary metadata via service")
    void testRecordSummary() {
        SessionRecordingService.RecordingSummaryInfo summary = SessionRecordingService.RecordingSummaryInfo.builder()
                .kind("screen")
                .attempted(10)
                .uploaded(10)
                .codec("video/webm;codecs=vp9")
                .width(1920)
                .height(1080)
                .bitrateBps(4500000)
                .qualityPreset("READABLE")
                .build();
        ResponseEntity<Void> response = controller.recordSummary(1L, summary);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(recordingService).saveSummary(1L, summary);
    }
}
