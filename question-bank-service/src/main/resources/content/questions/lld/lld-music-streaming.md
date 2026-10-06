---
slug: lld-music-streaming
title: Music Streaming Platform
track: SPRING_LLD
difficulty: HARD
topics:
- lld
est_minutes: 45
tags:
- object-oriented-design
- lld
- java
- design-patterns
- state-pattern
- strategy-pattern
- observer-pattern
- music-streaming
buildProfile: maven-workspace
source: inspired-by:takeuforward-prep-hub/lld/music-streaming
status: PUBLISHED
hints:
- Use the State pattern or clear enum state machine to model STOPPED, PLAYING, and PAUSED transitions.
- Use the Strategy pattern to decouple sequential and shuffle playback sequencing algorithms.
- Maintain current playlist index modulo playlist size for seamless wrap-around navigation.
coaching:
  presentationTips:
  - Clarify player state transitions and behavior when attempting to play an empty playlist.
  - Explain how track queue manipulation (adding/removing songs) impacts the active track index.
  - Discuss how the Strategy pattern enables easy extension to shuffle, repeat-one, or smart recommendation modes.
  commonMistakes:
  - IndexOutOfBoundsException when wrapping backward from the first track in the queue.
  - Failing to synchronize playback state transitions across concurrent UI and background player controls.
starterFiles:
  pom.xml: |
    <?xml version="1.0" encoding="UTF-8"?>
    <project xmlns="http://maven.apache.org/POM/4.0.0"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
        <modelVersion>4.0.0</modelVersion>
        <groupId>com.interviewos.lld</groupId>
        <artifactId>music-streaming</artifactId>
        <version>1.0.0</version>
        <properties>
            <maven.compiler.source>21</maven.compiler.source>
            <maven.compiler.target>21</maven.compiler.target>
            <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
            <junit.jupiter.version>5.11.4</junit.jupiter.version>
        </properties>
        <dependencies>
            <dependency>
                <groupId>org.junit.jupiter</groupId>
                <artifactId>junit-jupiter</artifactId>
                <version>${junit.jupiter.version}</version>
                <scope>test</scope>
            </dependency>
        </dependencies>
        <build>
            <plugins>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-surefire-plugin</artifactId>
                    <version>3.5.2</version>
                </plugin>
            </plugins>
        </build>
    </project>
  README.md: |
    # Music Streaming Platform

    ## Overview
    Implement an object-oriented Music Streaming audio playback engine supporting playlist organization, track queue navigation, playback state machine lifecycles, and pluggable sequencing strategies.

    ## Key Components
    - `com.interviewos.music.service.MusicPlayerService`: Audio player facade orchestrating playback states, current song pointers, and queue transitions.
    - `com.interviewos.music.service.PlaylistManager`: Manages playlist creation, user associations, and track sequencing.
    - `com.interviewos.music.strategy.PlaybackStrategy`: Pluggable strategy governing track navigation algorithms.

    ## Candidate Task
    Implement the TODO methods in:
    1. `src/main/java/com/interviewos/music/service/PlaylistManager.java`
    2. `src/main/java/com/interviewos/music/service/MusicPlayerService.java`
  src/main/java/com/interviewos/music/model/PlaybackState.java: |
    package com.interviewos.music.model;

    public enum PlaybackState {
        STOPPED,
        PLAYING,
        PAUSED
    }
  src/main/java/com/interviewos/music/model/SubscriptionTier.java: |
    package com.interviewos.music.model;

    public enum SubscriptionTier {
        FREE,
        PREMIUM
    }
  src/main/java/com/interviewos/music/model/Song.java: |
    package com.interviewos.music.model;

    public class Song {
        private final String songId;
        private final String title;
        private final String artist;
        private final int durationSeconds;

        public Song(String songId, String title, String artist, int durationSeconds) {
            this.songId = songId;
            this.title = title;
            this.artist = artist;
            this.durationSeconds = durationSeconds;
        }

        public String getSongId() { return songId; }
        public String getTitle() { return title; }
        public String getArtist() { return artist; }
        public int getDurationSeconds() { return durationSeconds; }
    }
  src/main/java/com/interviewos/music/model/Playlist.java: |
    package com.interviewos.music.model;

    import java.util.ArrayList;
    import java.util.List;
    import java.util.concurrent.CopyOnWriteArrayList;

    public class Playlist {
        private final String playlistId;
        private final String name;
        private final String ownerUserId;
        private final List<Song> songs = new CopyOnWriteArrayList<>();

        public Playlist(String playlistId, String name, String ownerUserId) {
            this.playlistId = playlistId;
            this.name = name;
            this.ownerUserId = ownerUserId;
        }

        public String getPlaylistId() { return playlistId; }
        public String getName() { return name; }
        public String getOwnerUserId() { return ownerUserId; }

        public void addSong(Song song) {
            if (song != null) {
                songs.add(song);
            }
        }

        public boolean removeSong(String songId) {
            return songs.removeIf(s -> s.getSongId().equals(songId));
        }

        public List<Song> getSongs() {
            return new ArrayList<>(songs);
        }

        public int size() {
            return songs.size();
        }
    }
  src/main/java/com/interviewos/music/model/User.java: |
    package com.interviewos.music.model;

    public class User {
        private final String userId;
        private final String username;
        private final SubscriptionTier tier;

        public User(String userId, String username, SubscriptionTier tier) {
            this.userId = userId;
            this.username = username;
            this.tier = tier != null ? tier : SubscriptionTier.FREE;
        }

        public String getUserId() { return userId; }
        public String getUsername() { return username; }
        public SubscriptionTier getTier() { return tier; }
    }
  src/main/java/com/interviewos/music/strategy/PlaybackStrategy.java: |
    package com.interviewos.music.strategy;

    import com.interviewos.music.model.Playlist;
    import com.interviewos.music.model.Song;

    public interface PlaybackStrategy {
        Song getNextSong(Playlist playlist, int currentIndex, boolean shuffle);
    }
  src/main/java/com/interviewos/music/strategy/SequentialPlaybackStrategy.java: |
    package com.interviewos.music.strategy;

    import com.interviewos.music.model.Playlist;
    import com.interviewos.music.model.Song;

    import java.util.List;

    public class SequentialPlaybackStrategy implements PlaybackStrategy {
        @Override
        public Song getNextSong(Playlist playlist, int currentIndex, boolean shuffle) {
            if (playlist == null || playlist.size() == 0) return null;
            List<Song> songs = playlist.getSongs();
            int nextIndex = (currentIndex + 1) % songs.size();
            return songs.get(nextIndex);
        }
    }
  src/main/java/com/interviewos/music/service/PlaylistManager.java: |
    package com.interviewos.music.service;

    import com.interviewos.music.model.Playlist;
    import com.interviewos.music.model.Song;

    import java.util.Map;
    import java.util.concurrent.ConcurrentHashMap;

    public class PlaylistManager {
        private final Map<String, Playlist> playlists = new ConcurrentHashMap<>();

        public Playlist createPlaylist(String playlistId, String name, String ownerUserId) {
            // TODO: Instantiate and store Playlist
            throw new UnsupportedOperationException("TODO: Implement PlaylistManager.createPlaylist");
        }

        public Playlist getPlaylist(String playlistId) {
            return playlists.get(playlistId);
        }

        public synchronized boolean addSongToPlaylist(String playlistId, Song song) {
            // TODO: Find playlist and add song
            throw new UnsupportedOperationException("TODO: Implement PlaylistManager.addSongToPlaylist");
        }

        public synchronized boolean removeSongFromPlaylist(String playlistId, String songId) {
            // TODO: Find playlist and remove song
            throw new UnsupportedOperationException("TODO: Implement PlaylistManager.removeSongFromPlaylist");
        }
    }
  src/main/java/com/interviewos/music/service/MusicPlayerService.java: |
    package com.interviewos.music.service;

    import com.interviewos.music.model.PlaybackState;
    import com.interviewos.music.model.Playlist;
    import com.interviewos.music.model.Song;
    import com.interviewos.music.strategy.PlaybackStrategy;
    import com.interviewos.music.strategy.SequentialPlaybackStrategy;

    import java.util.List;

    public class MusicPlayerService {
        private final PlaylistManager playlistManager;
        private final PlaybackStrategy playbackStrategy;
        private volatile Playlist activePlaylist;
        private volatile int currentTrackIndex = -1;
        private volatile PlaybackState state = PlaybackState.STOPPED;

        public MusicPlayerService(PlaylistManager playlistManager) {
            this(playlistManager, new SequentialPlaybackStrategy());
        }

        public MusicPlayerService(PlaylistManager playlistManager, PlaybackStrategy playbackStrategy) {
            this.playlistManager = playlistManager != null ? playlistManager : new PlaylistManager();
            this.playbackStrategy = playbackStrategy != null ? playbackStrategy : new SequentialPlaybackStrategy();
        }

        public synchronized void loadPlaylist(String playlistId) {
            // TODO: Set active playlist, reset index to 0, state to STOPPED
            throw new UnsupportedOperationException("TODO: Implement MusicPlayerService.loadPlaylist");
        }

        public synchronized void play() {
            // TODO: If playlist loaded and non-empty, transition to PLAYING
            throw new UnsupportedOperationException("TODO: Implement MusicPlayerService.play");
        }

        public synchronized void pause() {
            // TODO: If PLAYING, transition to PAUSED
            throw new UnsupportedOperationException("TODO: Implement MusicPlayerService.pause");
        }

        public synchronized void stop() {
            // TODO: Transition to STOPPED, reset index
            throw new UnsupportedOperationException("TODO: Implement MusicPlayerService.stop");
        }

        public synchronized Song nextSong(boolean shuffle) {
            // TODO: Determine next song using playbackStrategy, advance index, return song
            throw new UnsupportedOperationException("TODO: Implement MusicPlayerService.nextSong");
        }

        public synchronized Song previousSong() {
            // TODO: Move index backward (wrap around), return song
            throw new UnsupportedOperationException("TODO: Implement MusicPlayerService.previousSong");
        }

        public Song getCurrentSong() {
            // TODO: Return currently playing song or null
            throw new UnsupportedOperationException("TODO: Implement MusicPlayerService.getCurrentSong");
        }

        public PlaybackState getState() {
            return state;
        }
    }
  src/test/java/com/interviewos/music/MusicPlaybackLifecycleTest.java: |
    package com.interviewos.music;

    import com.interviewos.music.model.PlaybackState;
    import com.interviewos.music.model.Playlist;
    import com.interviewos.music.model.Song;
    import com.interviewos.music.service.MusicPlayerService;
    import com.interviewos.music.service.PlaylistManager;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class MusicPlaybackLifecycleTest {

        @Test
        @DisplayName("Play transitions state from STOPPED to PLAYING with active track")
        void testPlaybackStateTransition() {
            PlaylistManager manager = new PlaylistManager();
            Playlist pl = manager.createPlaylist("PL-1", "Rock Classics", "user-1");
            manager.addSongToPlaylist("PL-1", new Song("S-1", "Bohemian Rhapsody", "Queen", 354));

            MusicPlayerService player = new MusicPlayerService(manager);
            player.loadPlaylist("PL-1");

            assertEquals(PlaybackState.STOPPED, player.getState());

            player.play();
            assertEquals(PlaybackState.PLAYING, player.getState());
            assertNotNull(player.getCurrentSong());
            assertEquals("Bohemian Rhapsody", player.getCurrentSong().getTitle());

            player.pause();
            assertEquals(PlaybackState.PAUSED, player.getState());

            player.stop();
            assertEquals(PlaybackState.STOPPED, player.getState());
        }

        @Test
        @DisplayName("Play on empty playlist remains STOPPED")
        void testPlayEmptyPlaylist() {
            PlaylistManager manager = new PlaylistManager();
            manager.createPlaylist("PL-EMPTY", "Empty", "user-2");

            MusicPlayerService player = new MusicPlayerService(manager);
            player.loadPlaylist("PL-EMPTY");
            player.play();

            assertEquals(PlaybackState.STOPPED, player.getState());
            assertNull(player.getCurrentSong());
        }
    }
  src/test/java/com/interviewos/music/MusicPlaylistManagementTest.java: |
    package com.interviewos.music;

    import com.interviewos.music.model.Playlist;
    import com.interviewos.music.model.Song;
    import com.interviewos.music.service.PlaylistManager;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class MusicPlaylistManagementTest {

        @Test
        @DisplayName("Playlist retains tracks in added order")
        void testPlaylistTrackAddition() {
            PlaylistManager manager = new PlaylistManager();
            Playlist pl = manager.createPlaylist("PL-2", "Jazz Vibes", "user-3");

            manager.addSongToPlaylist("PL-2", new Song("S-10", "So What", "Miles Davis", 562));
            manager.addSongToPlaylist("PL-2", new Song("S-11", "Take Five", "Dave Brubeck", 324));

            Playlist retrieved = manager.getPlaylist("PL-2");
            assertNotNull(retrieved);
            assertEquals(2, retrieved.size());
            assertEquals("So What", retrieved.getSongs().get(0).getTitle());
            assertEquals("Take Five", retrieved.getSongs().get(1).getTitle());
        }

        @Test
        @DisplayName("Removing track updates playlist size and membership")
        void testPlaylistTrackRemoval() {
            PlaylistManager manager = new PlaylistManager();
            manager.createPlaylist("PL-3", "Chill", "user-4");
            manager.addSongToPlaylist("PL-3", new Song("S-20", "Track A", "Artist 1", 200));
            manager.addSongToPlaylist("PL-3", new Song("S-21", "Track B", "Artist 2", 210));

            boolean removed = manager.removeSongFromPlaylist("PL-3", "S-20");
            assertTrue(removed);

            Playlist pl = manager.getPlaylist("PL-3");
            assertEquals(1, pl.size());
            assertEquals("Track B", pl.getSongs().get(0).getTitle());
        }
    }
  src/test/java/com/interviewos/music/MusicQueueNavigationTest.java: |
    package com.interviewos.music;

    import com.interviewos.music.model.Playlist;
    import com.interviewos.music.model.Song;
    import com.interviewos.music.service.MusicPlayerService;
    import com.interviewos.music.service.PlaylistManager;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class MusicQueueNavigationTest {

        @Test
        @DisplayName("nextSong advances track sequentially and wraps around")
        void testNextSongNavigation() {
            PlaylistManager manager = new PlaylistManager();
            manager.createPlaylist("PL-4", "Favorites", "user-5");
            manager.addSongToPlaylist("PL-4", new Song("S-1", "Song 1", "A", 180));
            manager.addSongToPlaylist("PL-4", new Song("S-2", "Song 2", "B", 200));

            MusicPlayerService player = new MusicPlayerService(manager);
            player.loadPlaylist("PL-4");
            player.play();

            assertEquals("Song 1", player.getCurrentSong().getTitle());

            Song next = player.nextSong(false);
            assertNotNull(next);
            assertEquals("Song 2", next.getTitle());

            Song wrap = player.nextSong(false);
            assertNotNull(wrap);
            assertEquals("Song 1", wrap.getTitle(), "Next song must wrap back to beginning of playlist");
        }

        @Test
        @DisplayName("previousSong navigates backward and wraps around")
        void testPreviousSongNavigation() {
            PlaylistManager manager = new PlaylistManager();
            manager.createPlaylist("PL-5", "Roadtrip", "user-6");
            manager.addSongToPlaylist("PL-5", new Song("S-1", "Song 1", "A", 180));
            manager.addSongToPlaylist("PL-5", new Song("S-2", "Song 2", "B", 200));

            MusicPlayerService player = new MusicPlayerService(manager);
            player.loadPlaylist("PL-5");
            player.play();

            Song prev = player.previousSong();
            assertNotNull(prev);
            assertEquals("Song 2", prev.getTitle(), "Previous song from first track should wrap to last track");
        }
    }
editablePaths:
- src/main/java/com/interviewos/music/service/PlaylistManager.java
- src/main/java/com/interviewos/music/service/MusicPlayerService.java
hiddenTestFiles:
  src/test/java/com/interviewos/music/MusicPlaybackLifecycleTest.java: |
    package com.interviewos.music;

    import com.interviewos.music.model.PlaybackState;
    import com.interviewos.music.model.Playlist;
    import com.interviewos.music.model.Song;
    import com.interviewos.music.service.MusicPlayerService;
    import com.interviewos.music.service.PlaylistManager;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class MusicPlaybackLifecycleTest {

        @Test
        @DisplayName("Play transitions state from STOPPED to PLAYING with active track")
        void testPlaybackStateTransition() {
            PlaylistManager manager = new PlaylistManager();
            Playlist pl = manager.createPlaylist("PL-1", "Rock Classics", "user-1");
            manager.addSongToPlaylist("PL-1", new Song("S-1", "Bohemian Rhapsody", "Queen", 354));

            MusicPlayerService player = new MusicPlayerService(manager);
            player.loadPlaylist("PL-1");

            assertEquals(PlaybackState.STOPPED, player.getState());

            player.play();
            assertEquals(PlaybackState.PLAYING, player.getState());
            assertNotNull(player.getCurrentSong());
            assertEquals("Bohemian Rhapsody", player.getCurrentSong().getTitle());

            player.pause();
            assertEquals(PlaybackState.PAUSED, player.getState());

            player.stop();
            assertEquals(PlaybackState.STOPPED, player.getState());
        }

        @Test
        @DisplayName("Play on empty playlist remains STOPPED")
        void testPlayEmptyPlaylist() {
            PlaylistManager manager = new PlaylistManager();
            manager.createPlaylist("PL-EMPTY", "Empty", "user-2");

            MusicPlayerService player = new MusicPlayerService(manager);
            player.loadPlaylist("PL-EMPTY");
            player.play();

            assertEquals(PlaybackState.STOPPED, player.getState());
            assertNull(player.getCurrentSong());
        }
    }
  src/test/java/com/interviewos/music/MusicPlaylistManagementTest.java: |
    package com.interviewos.music;

    import com.interviewos.music.model.Playlist;
    import com.interviewos.music.model.Song;
    import com.interviewos.music.service.PlaylistManager;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class MusicPlaylistManagementTest {

        @Test
        @DisplayName("Playlist retains tracks in added order")
        void testPlaylistTrackAddition() {
            PlaylistManager manager = new PlaylistManager();
            Playlist pl = manager.createPlaylist("PL-2", "Jazz Vibes", "user-3");

            manager.addSongToPlaylist("PL-2", new Song("S-10", "So What", "Miles Davis", 562));
            manager.addSongToPlaylist("PL-2", new Song("S-11", "Take Five", "Dave Brubeck", 324));

            Playlist retrieved = manager.getPlaylist("PL-2");
            assertNotNull(retrieved);
            assertEquals(2, retrieved.size());
            assertEquals("So What", retrieved.getSongs().get(0).getTitle());
            assertEquals("Take Five", retrieved.getSongs().get(1).getTitle());
        }

        @Test
        @DisplayName("Removing track updates playlist size and membership")
        void testPlaylistTrackRemoval() {
            PlaylistManager manager = new PlaylistManager();
            manager.createPlaylist("PL-3", "Chill", "user-4");
            manager.addSongToPlaylist("PL-3", new Song("S-20", "Track A", "Artist 1", 200));
            manager.addSongToPlaylist("PL-3", new Song("S-21", "Track B", "Artist 2", 210));

            boolean removed = manager.removeSongFromPlaylist("PL-3", "S-20");
            assertTrue(removed);

            Playlist pl = manager.getPlaylist("PL-3");
            assertEquals(1, pl.size());
            assertEquals("Track B", pl.getSongs().get(0).getTitle());
        }
    }
  src/test/java/com/interviewos/music/MusicQueueNavigationTest.java: |
    package com.interviewos.music;

    import com.interviewos.music.model.Playlist;
    import com.interviewos.music.model.Song;
    import com.interviewos.music.service.MusicPlayerService;
    import com.interviewos.music.service.PlaylistManager;
    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;

    import static org.junit.jupiter.api.Assertions.*;

    public class MusicQueueNavigationTest {

        @Test
        @DisplayName("nextSong advances track sequentially and wraps around")
        void testNextSongNavigation() {
            PlaylistManager manager = new PlaylistManager();
            manager.createPlaylist("PL-4", "Favorites", "user-5");
            manager.addSongToPlaylist("PL-4", new Song("S-1", "Song 1", "A", 180));
            manager.addSongToPlaylist("PL-4", new Song("S-2", "Song 2", "B", 200));

            MusicPlayerService player = new MusicPlayerService(manager);
            player.loadPlaylist("PL-4");
            player.play();

            assertEquals("Song 1", player.getCurrentSong().getTitle());

            Song next = player.nextSong(false);
            assertNotNull(next);
            assertEquals("Song 2", next.getTitle());

            Song wrap = player.nextSong(false);
            assertNotNull(wrap);
            assertEquals("Song 1", wrap.getTitle(), "Next song must wrap back to beginning of playlist");
        }

        @Test
        @DisplayName("previousSong navigates backward and wraps around")
        void testPreviousSongNavigation() {
            PlaylistManager manager = new PlaylistManager();
            manager.createPlaylist("PL-5", "Roadtrip", "user-6");
            manager.addSongToPlaylist("PL-5", new Song("S-1", "Song 1", "A", 180));
            manager.addSongToPlaylist("PL-5", new Song("S-2", "Song 2", "B", 200));

            MusicPlayerService player = new MusicPlayerService(manager);
            player.loadPlaylist("PL-5");
            player.play();

            Song prev = player.previousSong();
            assertNotNull(prev);
            assertEquals("Song 2", prev.getTitle(), "Previous song from first track should wrap to last track");
        }
    }
starterCode: |
  package com.interviewos.music.service;

  import com.interviewos.music.model.Playlist;
  import com.interviewos.music.model.Song;

  import java.util.Map;
  import java.util.concurrent.ConcurrentHashMap;

  public class PlaylistManager {
      private final Map<String, Playlist> playlists = new ConcurrentHashMap<>();

      public Playlist createPlaylist(String playlistId, String name, String ownerUserId) {
          // TODO: Instantiate and store Playlist
          throw new UnsupportedOperationException("TODO: Implement PlaylistManager.createPlaylist");
      }

      public Playlist getPlaylist(String playlistId) {
          return playlists.get(playlistId);
      }

      public synchronized boolean addSongToPlaylist(String playlistId, Song song) {
          // TODO: Find playlist and add song
          throw new UnsupportedOperationException("TODO: Implement PlaylistManager.addSongToPlaylist");
      }

      public synchronized boolean removeSongFromPlaylist(String playlistId, String songId) {
          // TODO: Find playlist and remove song
          throw new UnsupportedOperationException("TODO: Implement PlaylistManager.removeSongFromPlaylist");
      }
  }
solutionCode: |
  package com.interviewos.music.service;

  import com.interviewos.music.model.Playlist;
  import com.interviewos.music.model.Song;

  import java.util.Map;
  import java.util.concurrent.ConcurrentHashMap;

  public class PlaylistManager {
      private final Map<String, Playlist> playlists = new ConcurrentHashMap<>();

      public Playlist createPlaylist(String playlistId, String name, String ownerUserId) {
          Playlist pl = new Playlist(playlistId, name, ownerUserId);
          playlists.put(playlistId, pl);
          return pl;
      }

      public Playlist getPlaylist(String playlistId) {
          return playlists.get(playlistId);
      }

      public synchronized boolean addSongToPlaylist(String playlistId, Song song) {
          Playlist pl = playlists.get(playlistId);
          if (pl == null || song == null) return false;
          pl.addSong(song);
          return true;
      }

      public synchronized boolean removeSongFromPlaylist(String playlistId, String songId) {
          Playlist pl = playlists.get(playlistId);
          if (pl == null || songId == null) return false;
          return pl.removeSong(songId);
      }
  }
---

### Problem Statement: Music Streaming Platform

You are tasked with designing and implementing an object-oriented Music Streaming audio playback engine in Java. Modern streaming applications offer millions of songs to listeners across diverse devices, requiring scalable playlist curation, reliable state machine transitions during audio playback, and responsive track queue navigation. Your objective is to build a high-cohesion domain model that organizes music libraries, manages user playlists, governs playback states (STOPPED, PLAYING, PAUSED), and navigates audio tracks using pluggable sequencing strategies.

#### Functional Requirements:
1. **Audio Track & Entity Modeling**: Represent individual musical tracks with unique identifiers, title, artist metadata, and duration in seconds.
2. **Playlist Lifecycle Management**: Support playlist creation, user ownership associations, and dynamic track addition and removal while preserving insertion order.
3. **Playback State Machine**: Enforce clean state transitions: STOPPED when idle, PLAYING during active playback, and PAUSED when temporarily suspended.
4. **Queue Loading & Initialization**: Allow loading a playlist into the audio player, resetting track position pointers, and preparing the queue safely.
5. **Pluggable Playback Strategy**: Implement a PlaybackStrategy interface (such as SequentialPlaybackStrategy) that governs track sequencing rules and queue progression.
6. **Forward Track Navigation**: Implement a next-track navigation method that advances the player to the subsequent song, wrapping seamlessly from the last track to the first.
7. **Reverse Track Navigation**: Implement a previous-track navigation method that steps backward, wrapping cleanly from the first track to the final track of the active playlist.
8. **Thread-Safe Playback Coordination**: Expose a MusicPlayerService facade providing synchronized play, pause, stop, and track status queries without risking race conditions.

#### Non-goals:
- Physical audio bitstream decoding, PCM buffer rendering, and hardware sound card drivers are omitted; state management is purely in-memory.
- Digital rights management (DRM) token verification and audio bitrate adaptation are deferred to specialized media pipeline systems.
