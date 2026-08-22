package com.interviewos.session.job;

import com.interviewos.session.entity.InterviewSession;
import com.interviewos.session.model.SessionStatus;
import com.interviewos.session.repository.InterviewSessionRepository;
import com.mongodb.client.MongoCursor;
import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.GridFSFindIterable;
import com.mongodb.client.gridfs.model.GridFSFile;
import org.bson.BsonObjectId;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StorageHygieneScheduledJobTest {

    @Mock
    private GridFsTemplate gridFsTemplate;

    @Mock
    private GridFSBucket gridFSBucket;

    @Mock
    private InterviewSessionRepository interviewSessionRepository;

    @Mock
    private GridFSFindIterable findIterable;

    @Mock
    private MongoCursor<GridFSFile> mongoCursor;

    private StorageHygieneScheduledJob job;

    @BeforeEach
    void setUp() {
        job = new StorageHygieneScheduledJob(gridFsTemplate, gridFSBucket, interviewSessionRepository);
        ReflectionTestUtils.setField(job, "retentionDays", 14);
    }

    @Test
    @DisplayName("runCleanupJob should delete attachments of sessions COMPLETED older than 14 days and orphans")
    void testCleanupOldAndOrphanAttachments() {
        Instant now = Instant.now();
        Instant oldCompletedTime = now.minus(Duration.ofDays(20));
        Instant recentCompletedTime = now.minus(Duration.ofDays(5));

        // 1. File from old completed session (Eligible for deletion)
        ObjectId idOld = new ObjectId();
        Document metaOld = new Document("sessionId", 101L);
        GridFSFile fileOld = new GridFSFile(new BsonObjectId(idOld), "old.png", 1024, 255, new Date(), metaOld);
        InterviewSession oldSession = InterviewSession.builder()
                .id(101L)
                .status(SessionStatus.COMPLETED)
                .completedAt(oldCompletedTime)
                .build();

        // 2. File from recent completed session (Should NOT be deleted)
        ObjectId idRecent = new ObjectId();
        Document metaRecent = new Document("sessionId", 102L);
        GridFSFile fileRecent = new GridFSFile(new BsonObjectId(idRecent), "recent.png", 2048, 255, new Date(), metaRecent);
        InterviewSession recentSession = InterviewSession.builder()
                .id(102L)
                .status(SessionStatus.COMPLETED)
                .completedAt(recentCompletedTime)
                .build();

        // 3. Orphan file without sessionId (Eligible for deletion)
        ObjectId idOrphan = new ObjectId();
        GridFSFile fileOrphan = new GridFSFile(new BsonObjectId(idOrphan), "orphan.png", 512, 255, new Date(), new Document());

        List<GridFSFile> mockFiles = List.of(fileOld, fileRecent, fileOrphan);
        Iterator<GridFSFile> iterator = mockFiles.iterator();

        when(gridFSBucket.find()).thenReturn(findIterable);
        when(findIterable.iterator()).thenReturn(mongoCursor);
        when(mongoCursor.hasNext()).thenAnswer(i -> iterator.hasNext());
        when(mongoCursor.next()).thenAnswer(i -> iterator.next());

        when(interviewSessionRepository.findById(101L)).thenReturn(Optional.of(oldSession));
        when(interviewSessionRepository.findById(102L)).thenReturn(Optional.of(recentSession));

        int purged = job.runCleanupJob(now);

        assertEquals(2, purged);
        verify(gridFsTemplate, times(2)).delete(any(Query.class));
    }
}
