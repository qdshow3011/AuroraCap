const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = process.cwd()
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)
config.watchFolders = [workspaceRoot]
config.resolver = config.resolver || {}
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules')
]
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
  'react-native-web': path.resolve(projectRoot, 'node_modules/react-native-web')
}
config.resolver.disableHierarchicalLookups = true

// Exclude incompatible modules from web bundle
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    // Exclude react-native-pdf and pdf-parse from web bundle
    if (moduleName === 'react-native-pdf' || moduleName === 'pdf-parse' || moduleName === 'node-fetch') {
      return {
        type: 'empty'
      }
    }
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
