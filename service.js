import { NativeModules, Platform } from 'react-native';
import { AudioPlayerService } from './services/AudioPlayerService';

module.exports = async function () {
  if (Platform.OS !== 'web' && NativeModules && (NativeModules.TrackPlayerModule || NativeModules.RNTrackPlayer)) {
    try {
      const TrackPlayer = require('react-native-track-player').default || require('react-native-track-player');
      const { Event } = require('react-native-track-player');

      TrackPlayer.addEventListener(Event.RemotePlay, () => {
        AudioPlayerService.getInstance().togglePlayPause();
      });
      TrackPlayer.addEventListener(Event.RemotePause, () => {
        AudioPlayerService.getInstance().togglePlayPause();
      });
      TrackPlayer.addEventListener(Event.RemoteNext, () => {
        AudioPlayerService.getInstance().playNext();
      });
      TrackPlayer.addEventListener(Event.RemotePrevious, () => {
        AudioPlayerService.getInstance().playPrevious();
      });
      TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
        if (event && event.position !== undefined) {
          AudioPlayerService.getInstance().seekTo(event.position * 1000);
        }
      });
    } catch (e) {
      console.warn('[service.js] TrackPlayer event listener error:', e);
    }
  }
};
