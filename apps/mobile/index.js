// import 'setimmediate';
// import 'react-native-reanimated';
import * as reanimated from 'react-native-reanimated';

// console.log('reanimated:', reanimated);

import { registerRootComponent } from 'expo';

import App from './src/App.tsx';
// import App from './TestApp';

registerRootComponent(App);
