package com.interviewos.session.repository;

import com.interviewos.session.entity.UserNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserNoteRepository extends JpaRepository<UserNote, Long> {
    Optional<UserNote> findByUserIdAndQuestionSlug(String userId, String questionSlug);
    List<UserNote> findByUserIdOrderByUpdatedAtDesc(String userId);
    void deleteByUserIdAndQuestionSlug(String userId, String questionSlug);
    boolean existsByUserIdAndQuestionSlug(String userId, String questionSlug);
}
