exports.beforeBuild = async function beforeBuild() {
  // Production dependencies are staged and verified separately in resources/host.
  // Returning false prevents Electron Builder from collecting them into ASAR again.
  return false
}
