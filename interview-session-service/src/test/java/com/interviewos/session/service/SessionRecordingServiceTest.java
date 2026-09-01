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
    void testSaveChunkStoresInGridFs() throws Exception {
        MockMultipartFile file = new MockMultipartFile("chunk", "test.webm", "video/webm", new byte[]{1, 2, 3, 4});
        when(gridFsTemplate.store(any(), anyString(), anyString(), any(Document.class))).thenReturn(new ObjectId());

        recordingService.saveChunk(42L, 0, file);

        verify(gridFsTemplate, times(1)).store(any(), eq("rec_42_chunk_00000.webm"), eq("video/webm"), any(Document.class));
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
    }
}
