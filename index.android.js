import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { enableScreens } from 'react-native-screens';

// Enable native screens for better performance on Android
enableScreens();

// Register the main App component for the Android platform
AppRegistry.registerComponent(appName, () => App);
