package com.interviewos.session.service;

import com.interviewos.session.repository.InterviewSessionMongoRepository;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.GridFSFindIterable;
import com.mongodb.client.gridfs.model.GridFSFile;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionRecordingServiceTest {

    @Mock
    private GridFsTemplate gridFsTemplate;

    @Mock
    private GridFSBucket gridFSBucket;

    @Mock
    private InterviewSessionMongoRepository mongoSessionRepository;

    private SessionRecordingService recordingService;

    @BeforeEach
    void setUp() {
        recordingService = new SessionRecordingService(gridFsTemplate, gridFSBucket, mongoSessionRepository);
    }

    @Test
    void testSaveChunkStoresInGridFsWithCameraDefault() throws Exception {
        MockMultipartFile file = new MockMultipartFile("chunk", "test.webm", "video/webm", new byte[]{1, 2, 3, 4});
        when(gridFsTemplate.store(any(), anyString(), anyString(), any(Document.class))).thenReturn(new ObjectId());

        recordingService.saveChunk(42L, 0, file);

        verify(gridFsTemplate, times(1)).store(any(), eq("rec_42_camera_chunk_00000.webm"), eq("video/webm"), argThat(doc ->
                "camera".equals(doc.get("kind")) && Integer.valueOf(0).equals(doc.get("seq"))
        ));
    }

    @Test
    void testSaveChunkStoresInGridFsWithScreenKind() throws Exception {
        MockMultipartFile file = new MockMultipartFile("chunk", "screen.webm", "video/webm", new byte[]{5, 6, 7, 8});
        when(gridFsTemplate.store(any(), anyString(), anyString(), any(Document.class))).thenReturn(new ObjectId());

        recordingService.saveChunk(42L, 1, "screen", file);

        verify(gridFsTemplate, times(1)).store(any(), eq("rec_42_screen_chunk_00001.webm"), eq("video/webm"), argThat(doc ->
                "screen".equals(doc.get("kind")) && Integer.valueOf(1).equals(doc.get("seq"))
        ));
    }

    @Test
    void testGetManifestEmptyChunks() {
        GridFSFindIterable mockIterable = mock(GridFSFindIterable.class);
        @SuppressWarnings("unchecked")
        MongoCursor<GridFSFile> mockCursor = mock(MongoCursor.class);
        when(gridFSBucket.find(any(Document.class))).thenReturn(mockIterable);
        when(mockIterable.iterator()).thenReturn(mockCursor);
        when(mockCursor.hasNext()).thenReturn(false);

        SessionRecordingService.RecordingManifest manifest = recordingService.getManifest(42L);

        assertNotNull(manifest);
        assertEquals(42L, manifest.getSessionId());
        assertEquals(0, manifest.getTotalChunks());
        assertEquals(0, manifest.getTotalBytes());
        assertFalse(manifest.isComplete());
        assertNull(manifest.getStreams());
    }

    @Test
    void testGetManifestDualStreams() {
        GridFSFindIterable mockIterable = mock(GridFSFindIterable.class);
        @SuppressWarnings("unchecked")
        MongoCursor<GridFSFile> mockCursor = mock(MongoCursor.class);
        when(gridFSBucket.find(any(Document.class))).thenReturn(mockIterable);
        when(mockIterable.iterator()).thenReturn(mockCursor);

        GridFSFile cameraFile = mock(GridFSFile.class);
        Document cameraMeta = new Document("kind", "camera").append("seq", 0);
        when(cameraFile.getMetadata()).thenReturn(cameraMeta);
        when(cameraFile.getLength()).thenReturn(1024L);
        when(cameraFile.getUploadDate()).thenReturn(new java.util.Date());

        GridFSFile screenFile = mock(GridFSFile.class);
        Document screenMeta = new Document("kind", "screen").append("seq", 0);
        when(screenFile.getMetadata()).thenReturn(screenMeta);
        when(screenFile.getLength()).thenReturn(2048L);
        when(screenFile.getUploadDate()).thenReturn(new java.util.Date());

        // First call to find is for camera, second call is for screen
        when(mockCursor.hasNext())
                .thenReturn(true, true, false)  // camera call
                .thenReturn(true, true, false); // screen call
        when(mockCursor.next())
                .thenReturn(cameraFile, screenFile)
                .thenReturn(cameraFile, screenFile);

        SessionRecordingService.RecordingManifest manifest = recordingService.getManifest(42L);

        assertNotNull(manifest);
        assertTrue(manifest.isComplete());
        assertNotNull(manifest.getStreams());
        assertTrue(manifest.getStreams().containsKey("camera"));
        assertTrue(manifest.getStreams().containsKey("screen"));
        assertEquals(1, manifest.getStreams().get("camera").getChunks());
        assertEquals(1024L, manifest.getStreams().get("camera").getBytes());
        assertEquals(1, manifest.getStreams().get("screen").getChunks());
        assertEquals(2048L, manifest.getStreams().get("screen").getBytes());
    }
}
