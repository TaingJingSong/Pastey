/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './src/App';
import SettingsApp from './src/SettingsApp';
import PreviewApp from './src/PreviewApp';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);

// Second root for the preferences window. It must be a distinct component so
// the history store's init() does not run twice.
AppRegistry.registerComponent('PasteySettings', () => SettingsApp);

// Third root for the auxiliary preview popup window.
AppRegistry.registerComponent('PasteyPreview', () => PreviewApp);
