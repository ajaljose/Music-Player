import { Audio, AVPlaybackStatus } from 'expo-av';
import { NativeModules, Platform } from 'react-native';
import { RepeatMode, Song } from '../types';

export interface PlaybackState {
  currentSong: Song | null;
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  isBuffering: boolean;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  currentIndex: number;
  playlist: Song[];
}

type StatusCallback = (state: PlaybackState) => void;

const getNativeTrackPlayer = (): any => {
  if (Platform.OS === 'web') return null;
  if (!NativeModules || (!NativeModules.TrackPlayerModule && !NativeModules.RNTrackPlayer)) {
    return null;
  }
  try {
    return require('react-native-track-player');
  } catch (e) {
    return null;
  }
};

export class AudioPlayerService {
  private static instance: AudioPlayerService;
  private sound: Audio.Sound | null = null;
  private playlist: Song[] = [];
  private originalPlaylist: Song[] = [];
  private currentIndex: number = 0;
  private isPlaying: boolean = false;
  private positionMillis: number = 0;
  private durationMillis: number = 0;
  private isBuffering: boolean = false;
  private shuffleEnabled: boolean = false;
  private repeatMode: RepeatMode = 'off';
  private statusListeners: StatusCallback[] = [];
  private isTrackPlayerSetup: boolean = false;

  private constructor() {
    this.configureAudioMode();
    this.setupTrackPlayerIfNeeded();
  }

  public static getInstance(): AudioPlayerService {
    if (!AudioPlayerService.instance) {
      AudioPlayerService.instance = new AudioPlayerService();
    }
    return AudioPlayerService.instance;
  }

  private async setupTrackPlayerIfNeeded() {
    const tp = getNativeTrackPlayer();
    if (!tp || this.isTrackPlayerSetup) return;
    try {
      const TrackPlayer = tp.default || tp;
      const { Capability } = tp;
      await TrackPlayer.setupPlayer();
      await TrackPlayer.updateOptions({
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.SeekTo,
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
        ],
        notificationCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.SeekTo,
        ],
      });
      this.isTrackPlayerSetup = true;
    } catch (e) {
      // Ignored if already initialized
    }
  }

  private async configureAudioMode() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (e) {
      console.warn('Could not set audio mode:', e);
    }
  }

  public subscribe(callback: StatusCallback): () => void {
    this.statusListeners.push(callback);
    this.notifyListeners();
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== callback);
    };
  }

  private notifyListeners() {
    const currentState: PlaybackState = {
      currentSong: this.getCurrentSong(),
      isPlaying: this.isPlaying,
      positionMillis: this.positionMillis,
      durationMillis: this.durationMillis || (this.getCurrentSong()?.durationMillis || 180000),
      isBuffering: this.isBuffering,
      shuffleEnabled: this.shuffleEnabled,
      repeatMode: this.repeatMode,
      currentIndex: this.currentIndex,
      playlist: this.playlist,
    };
    this.statusListeners.forEach(listener => listener(currentState));
    this.updateSystemMediaSession();
  }

  private updateSystemMediaSession() {
    const currentSong = this.getCurrentSong();

    // 1. Native Mobile (Android & iOS) Notification Panel & Lock Screen
    const tp = getNativeTrackPlayer();
    if (tp) {
      this.setupTrackPlayerIfNeeded().then(async () => {
        if (!this.isTrackPlayerSetup) return;
        try {
          const TrackPlayer = tp.default || tp;
          if (currentSong && this.isPlaying) {
            await TrackPlayer.reset();
            await TrackPlayer.add({
              id: currentSong.id,
              url: currentSong.uri,
              title: currentSong.title || 'Unknown Track',
              artist: currentSong.artist || 'Unknown Artist',
              album: currentSong.album || 'Music Player',
              artwork:
                currentSong.artworkUri ||
                'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60',
              duration: (this.durationMillis || currentSong.durationMillis || 180000) / 1000,
            });
            await TrackPlayer.play();
          } else {
            // "should not show when not playing"
            await TrackPlayer.pause();
            if (!currentSong) {
              await TrackPlayer.reset();
            }
          }
        } catch (e) {
          console.warn('Native TrackPlayer notification update error:', e);
        }
      });
    }

    // 2. Web MediaSession API (Browser Notification Shade & Lock Screen)
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      if (currentSong && this.isPlaying) {
        const artwork = currentSong.artworkUri
          ? [{ src: currentSong.artworkUri, sizes: '512x512', type: 'image/png' }]
          : [
              {
                src: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60',
                sizes: '512x512',
                type: 'image/jpeg',
              },
            ];

        try {
          if (typeof MediaMetadata !== 'undefined') {
            navigator.mediaSession.metadata = new MediaMetadata({
              title: currentSong.title || 'Unknown Track',
              artist: currentSong.artist || 'Unknown Artist',
              album: currentSong.album || 'Music Player',
              artwork: artwork,
            });
          }

          navigator.mediaSession.playbackState = 'playing';

          navigator.mediaSession.setActionHandler('play', () => {
            this.togglePlayPause();
          });
          navigator.mediaSession.setActionHandler('pause', () => {
            this.togglePlayPause();
          });
          navigator.mediaSession.setActionHandler('previoustrack', () => {
            this.playPrevious();
          });
          navigator.mediaSession.setActionHandler('nexttrack', () => {
            this.playNext();
          });

          try {
            navigator.mediaSession.setActionHandler('seekto', (details) => {
              if (details.seekTime !== undefined && details.seekTime !== null) {
                this.seekTo(details.seekTime * 1000);
              }
            });
          } catch (e) {
            // ignore seekto unsupported browser error
          }

          if (
            'setPositionState' in navigator.mediaSession &&
            this.durationMillis > 0 &&
            this.positionMillis >= 0
          ) {
            try {
              navigator.mediaSession.setPositionState({
                duration: Math.max(1, this.durationMillis / 1000),
                playbackRate: 1,
                position: Math.min(this.positionMillis / 1000, this.durationMillis / 1000),
              });
            } catch (e) {
              // ignore
            }
          }
        } catch (e) {
          console.warn('MediaSession error:', e);
        }
      } else {
        // Clear/hide system media notification when not playing
        try {
          navigator.mediaSession.playbackState = 'none';
          navigator.mediaSession.metadata = null;
        } catch (e) {
          // ignore
        }
      }
    }
  }

  public setPlaylist(songs: Song[], startIndex: number = 0) {
    this.originalPlaylist = [...songs];
    if (this.shuffleEnabled) {
      this.playlist = this.shuffleArray([...songs]);
    } else {
      this.playlist = [...songs];
    }
    this.currentIndex = startIndex;
  }

  public getCurrentSong(): Song | null {
    if (this.playlist.length > 0 && this.currentIndex >= 0 && this.currentIndex < this.playlist.length) {
      return this.playlist[this.currentIndex];
    }
    return null;
  }

  public async loadAndPlaySong(song: Song) {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: song.uri },
        { shouldPlay: true },
        this.onPlaybackStatusUpdate
      );

      this.sound = sound;
      this.isPlaying = true;
      this.notifyListeners();
    } catch (error) {
      console.error('Error loading audio file:', error);
      // fallback simulation for demo
      this.isPlaying = true;
      this.notifyListeners();
    }
  }

  public async playTrackAtIndex(index: number) {
    if (index < 0 || index >= this.playlist.length) return;
    this.currentIndex = index;
    const song = this.playlist[index];
    if (song) {
      await this.loadAndPlaySong(song);
    }
  }

  public async togglePlayPause() {
    if (!this.sound) {
      const currentSong = this.getCurrentSong();
      if (currentSong) {
        await this.loadAndPlaySong(currentSong);
      }
      return;
    }

    if (this.isPlaying) {
      await this.sound.pauseAsync();
      this.isPlaying = false;
    } else {
      await this.sound.playAsync();
      this.isPlaying = true;
    }
    this.notifyListeners();
  }

  public async seekTo(positionMs: number) {
    if (this.sound) {
      await this.sound.setPositionAsync(positionMs);
      this.positionMillis = positionMs;
      this.notifyListeners();
    }
  }

  public async playNext() {
    if (this.playlist.length === 0) return;

    if (this.repeatMode === 'one') {
      await this.seekTo(0);
      if (this.sound && !this.isPlaying) {
        await this.sound.playAsync();
      }
      return;
    }

    let nextIdx = this.currentIndex + 1;
    if (nextIdx >= this.playlist.length) {
      if (this.repeatMode === 'all') {
        nextIdx = 0;
      } else {
        // End of playlist
        this.isPlaying = false;
        this.notifyListeners();
        return;
      }
    }

    await this.playTrackAtIndex(nextIdx);
  }

  public async playPrevious() {
    if (this.playlist.length === 0) return;

    // If played more than 3 seconds, restart current track
    if (this.positionMillis > 3000) {
      await this.seekTo(0);
      return;
    }

    let prevIdx = this.currentIndex - 1;
    if (prevIdx < 0) {
      prevIdx = this.playlist.length - 1;
    }
    await this.playTrackAtIndex(prevIdx);
  }

  public toggleShuffle() {
    this.shuffleEnabled = !this.shuffleEnabled;
    const currentSong = this.getCurrentSong();

    if (this.shuffleEnabled) {
      this.playlist = this.shuffleArray([...this.originalPlaylist]);
    } else {
      this.playlist = [...this.originalPlaylist];
    }

    if (currentSong) {
      const newIdx = this.playlist.findIndex(s => s.id === currentSong.id);
      if (newIdx !== -1) {
        this.currentIndex = newIdx;
      }
    }
    this.notifyListeners();
  }

  public toggleRepeat() {
    if (this.repeatMode === 'off') {
      this.repeatMode = 'all';
    } else if (this.repeatMode === 'all') {
      this.repeatMode = 'one';
    } else {
      this.repeatMode = 'off';
    }
    this.notifyListeners();
  }

  public updateSongFavorite(songId: string, isFavorite: boolean) {
    this.playlist = this.playlist.map(song =>
      song.id === songId ? { ...song, isFavorite } : song
    );
    this.originalPlaylist = this.originalPlaylist.map(song =>
      song.id === songId ? { ...song, isFavorite } : song
    );
    this.notifyListeners();
  }

  private onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if ('error' in status && status.error) {
        console.error(`Playback Error: ${status.error}`);
      }
      return;
    }

    this.isPlaying = status.isPlaying;
    this.positionMillis = status.positionMillis;
    if (status.durationMillis) {
      this.durationMillis = status.durationMillis;
    }
    this.isBuffering = status.isBuffering;

    if (status.didJustFinish && !status.isLooping) {
      this.playNext();
    }

    this.notifyListeners();
  };

  private shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
