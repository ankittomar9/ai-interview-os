package com.interviewos.session.service;

import com.interviewos.session.dto.UserNoteResponse;
import com.interviewos.session.entity.UserNote;
import com.interviewos.session.repository.UserNoteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserNoteServiceTest {

    @Mock
    private UserNoteRepository userNoteRepository;

    @Mock
    private LearnTreeService learnTreeService;

    @InjectMocks
    private UserNoteService userNoteService;

    @BeforeEach
    void setUp() {
        lenient().when(learnTreeService.isValidSlug("dsa-two-sum-target")).thenReturn(true);
        lenient().when(learnTreeService.isValidSlug("unknown-slug")).thenReturn(false);
    }

    @Test
    @DisplayName("upsertNote succeeds for valid slug and body")
    void testUpsertNoteSuccess() {
        UserNote saved = UserNote.builder()
                .id(1L)
                .userId("local")
                .questionSlug("dsa-two-sum-target")
                .body("Key idea: hash map for complements")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        when(userNoteRepository.findByUserIdAndQuestionSlug("local", "dsa-two-sum-target"))
                .thenReturn(Optional.empty());
        when(userNoteRepository.save(any(UserNote.class))).thenReturn(saved);

        UserNoteResponse resp = userNoteService.upsertNote("local", "dsa-two-sum-target", "Key idea: hash map for complements");

        assertThat(resp).isNotNull();
        assertThat(resp.id()).isEqualTo(1L);
        assertThat(resp.body()).isEqualTo("Key idea: hash map for complements");
        verify(userNoteRepository).save(any(UserNote.class));
    }

    @Test
    @DisplayName("upsertNote with blank body throws 400 Bad Request")
    void testUpsertNoteBlankBody() {
        assertThatThrownBy(() -> userNoteService.upsertNote("local", "dsa-two-sum-target", "   "))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);

        verify(userNoteRepository, never()).save(any());
    }

    @Test
    @DisplayName("upsertNote with unknown slug throws 404 Not Found")
    void testUpsertNoteUnknownSlug() {
        assertThatThrownBy(() -> userNoteService.upsertNote("local", "unknown-slug", "Valid note body"))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.NOT_FOUND);

        verify(userNoteRepository, never()).save(any());
    }

    @Test
    @DisplayName("getNote returns note if found")
    void testGetNoteFound() {
        UserNote note = UserNote.builder()
                .id(10L)
                .userId("local")
                .questionSlug("dsa-two-sum-target")
                .body("My notes")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        when(userNoteRepository.findByUserIdAndQuestionSlug("local", "dsa-two-sum-target"))
                .thenReturn(Optional.of(note));

        UserNoteResponse resp = userNoteService.getNote("local", "dsa-two-sum-target");

        assertThat(resp).isNotNull();
        assertThat(resp.body()).isEqualTo("My notes");
    }

    @Test
    @DisplayName("getNote throws 404 if not found")
    void testGetNoteNotFound() {
        when(userNoteRepository.findByUserIdAndQuestionSlug("local", "dsa-two-sum-target"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> userNoteService.getNote("local", "dsa-two-sum-target"))
                .isInstanceOf(ResponseStatusException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("deleteNote calls repository delete")
    void testDeleteNote() {
        userNoteService.deleteNote("local", "dsa-two-sum-target");
        verify(userNoteRepository).deleteByUserIdAndQuestionSlug("local", "dsa-two-sum-target");
    }

    @Test
    @DisplayName("listNotes returns all notes for user")
    void testListNotes() {
        UserNote n1 = UserNote.builder().id(1L).userId("local").questionSlug("q1").body("b1").createdAt(Instant.now()).updatedAt(Instant.now()).build();
        UserNote n2 = UserNote.builder().id(2L).userId("local").questionSlug("q2").body("b2").createdAt(Instant.now()).updatedAt(Instant.now()).build();

        when(userNoteRepository.findByUserIdOrderByUpdatedAtDesc("local")).thenReturn(List.of(n1, n2));

        List<UserNoteResponse> list = userNoteService.listNotes("local");
        assertThat(list).hasSize(2);
    }
}
