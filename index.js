import { registerRootComponent } from 'expo';
import { NativeModules, Platform } from 'react-native';
import App from './App';

registerRootComponent(App);

// Only register TrackPlayer native service if native module is linked (e.g. in dev client or production build)
if (Platform.OS !== 'web' && NativeModules && (NativeModules.TrackPlayerModule || NativeModules.RNTrackPlayer)) {
  try {
    const TrackPlayer = require('react-native-track-player').default || require('react-native-track-player');
    TrackPlayer.registerPlaybackService(() => require('./service'));
  } catch (e) {
    // Ignored in Expo Go managed workflow
  }
}
