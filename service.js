import { NativeModules, Platform } from 'react-native';

module.exports = async function () {
  if (Platform.OS !== 'web' && NativeModules && (NativeModules.TrackPlayerModule || NativeModules.RNTrackPlayer)) {
    try {
      const TrackPlayer = require('react-native-track-player').default || require('react-native-track-player');
      const { Event } = require('react-native-track-player');
      TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
      TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
      TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
      TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
      TrackPlayer.addEventListener(Event.RemoteSeek, (event) => TrackPlayer.seekTo(event.position));
    } catch (e) {
      // Ignored
    }
  }
};
