import { Audio, AVPlaybackStatus } from 'expo-av';
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

  private constructor() {
    this.configureAudioMode();
  }

  public static getInstance(): AudioPlayerService {
    if (!AudioPlayerService.instance) {
      AudioPlayerService.instance = new AudioPlayerService();
    }
    return AudioPlayerService.instance;
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
