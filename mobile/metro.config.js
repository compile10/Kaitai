const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add the common directory to watchFolders so Metro can bundle files from outside mobile/
const commonDir = path.resolve(__dirname, '../common');
config.watchFolders = [commonDir];

module.exports = withNativeWind(config, { input: './global.css' });
