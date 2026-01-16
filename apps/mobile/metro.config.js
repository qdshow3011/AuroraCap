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

module.exports = config
