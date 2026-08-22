package com.interviewos.session.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.session.dto.CanvasJsonAttachmentRequest;
import com.mongodb.client.gridfs.model.GridFSFile;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.io.ByteArrayInputStream;
import java.io.InputStream;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AttachmentController.class)
class AttachmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private GridFsTemplate gridFsTemplate;

    @Test
    @DisplayName("POST /api/v1/sessions/{id}/attachments (multipart) should upload PNG and return 201")
    void testUploadMultipartPng() throws Exception {
        ObjectId mockId = new ObjectId("507f1f77bcf86cd799439011");
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "diagram.png",
                "image/png",
                new byte[]{1, 2, 3, 4, 5}
        );

        when(gridFsTemplate.store(any(InputStream.class), any(String.class), any(String.class), any(Document.class)))
                .thenReturn(mockId);

        mockMvc.perform(multipart("/api/v1/sessions/1/attachments")
                        .file(file)
                        .param("kind", "CANVAS_PNG"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.attachmentId").value(mockId.toHexString()))
                .andExpect(jsonPath("$.kind").value("CANVAS_PNG"))
                .andExpect(jsonPath("$.sizeBytes").value(5));
    }

    @Test
    @DisplayName("POST /api/v1/sessions/{id}/attachments with invalid kind should return 400")
    void testUploadInvalidKind() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.txt",
                "text/plain",
                new byte[]{1, 2, 3}
        );

        mockMvc.perform(multipart("/api/v1/sessions/1/attachments")
                        .file(file)
                        .param("kind", "INVALID_KIND"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/v1/sessions/{id}/attachments (JSON) should upload canvas JSON and return 201")
    void testUploadJsonSnapshot() throws Exception {
        ObjectId mockId = new ObjectId("507f1f77bcf86cd799439022");
        CanvasJsonAttachmentRequest request = new CanvasJsonAttachmentRequest(
                "CANVAS_JSON",
                "{\"nodes\":[{\"id\":\"n1\",\"type\":\"GATEWAY\"}],\"edges\":[]}"
        );

        when(gridFsTemplate.store(any(InputStream.class), any(String.class), any(String.class), any(Document.class)))
                .thenReturn(mockId);

        mockMvc.perform(post("/api/v1/sessions/1/attachments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.attachmentId").value(mockId.toHexString()))
                .andExpect(jsonPath("$.kind").value("CANVAS_JSON"));
    }

    @Test
    @DisplayName("GET /api/v1/sessions/{id}/attachments/{attId} should stream bytes when found")
    void testGetAttachmentSuccess() throws Exception {
        ObjectId objectId = new ObjectId("507f1f77bcf86cd799439011");
        GridFSFile mockFile = mock(GridFSFile.class);
        when(mockFile.getLength()).thenReturn(4L);
        Document metadata = new Document("contentType", "image/png");
        when(mockFile.getMetadata()).thenReturn(metadata);

        GridFsResource mockResource = mock(GridFsResource.class);
        when(mockResource.exists()).thenReturn(true);
        when(mockResource.getInputStream()).thenReturn(new ByteArrayInputStream(new byte[]{10, 20, 30, 40}));

        when(gridFsTemplate.findOne(any(Query.class))).thenReturn(mockFile);
        when(gridFsTemplate.getResource(mockFile)).thenReturn(mockResource);

        mockMvc.perform(get("/api/v1/sessions/1/attachments/" + objectId.toHexString()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG))
                .andExpect(content().bytes(new byte[]{10, 20, 30, 40}));
    }

    @Test
    @DisplayName("GET /api/v1/sessions/{id}/attachments/{attId} should return 404 when not found")
    void testGetAttachmentNotFound() throws Exception {
        when(gridFsTemplate.findOne(any(Query.class))).thenReturn(null);

        mockMvc.perform(get("/api/v1/sessions/1/attachments/507f1f77bcf86cd799439099"))
                .andExpect(status().isNotFound());
    }
}
