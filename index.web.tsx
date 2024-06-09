import { AppRegistry } from 'react-native';
import { registerRootComponent } from 'expo';
import appConfig from './app.config';
import App from './App';

registerRootComponent(App);

AppRegistry.runApplication(appConfig.name, {
    initialProps: {},
    rootTag: document.querySelector('#app-root'), // Use querySelector instead of getElementById
});
