

// import {AppRegistry} from 'react-native';
// import App from './App';
// import {name as appName} from './app.json';

// AppRegistry.registerComponent(appName, () => App);




import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
 
// Import and initialize Bluetooth library
import BleManager from 'react-native-ble-manager';
BleManager.start({ showAlert: false });
 
AppRegistry.registerComponent(appName, () => App);
