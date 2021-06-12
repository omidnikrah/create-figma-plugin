import { log } from '@create-figma-plugin/common'
import fs from 'fs-extra'

import { BuildOptions } from './types/build.js'
import { buildBundlesAsync } from './utilities/build-bundles-async/build-bundles-async.js'
import { buildCssModulesTypingsAsync } from './utilities/build-css-modules-typings-async.js'
import { buildManifestAsync } from './utilities/build-manifest-async.js'
import { trackElapsedTime } from './utilities/track-elapsed-time.js'
import { typeCheckAsync } from './utilities/type-check-async/type-check-async.js'

export async function buildAsync(options: BuildOptions): Promise<void> {
  const { minify, typecheck, mainConfigFilePath, uiConfigFilePath } = options
  try {
    if (
      mainConfigFilePath !== null &&
      (await fs.pathExists(mainConfigFilePath)) === false
    ) {
      throw new Error(`Main config file does not exist: ${mainConfigFilePath}`)
    }
    if (
      uiConfigFilePath !== null &&
      (await fs.pathExists(uiConfigFilePath)) === false
    ) {
      throw new Error(`UI config file does not exist: ${uiConfigFilePath}`)
    }
    if (typecheck === true) {
      const getTypeCheckElapsedTime = trackElapsedTime()
      await buildCssModulesTypingsAsync() // This must occur before `typeCheckAsync`
      await typeCheckAsync(false)
      const typeCheckElapsedTime = getTypeCheckElapsedTime()
      log.clearPreviousLine()
      log.success(`Type checked in ${typeCheckElapsedTime}`)
      log.info('Building...')
      const getBuildElapsedTime = trackElapsedTime()
      await Promise.all([
        buildBundlesAsync({ mainConfigFilePath, minify, uiConfigFilePath }),
        buildManifestAsync(minify)
      ])
      const buildElapsedTime = getBuildElapsedTime()
      log.clearPreviousLine()
      log.success(`Built in ${buildElapsedTime}`)
    } else {
      log.info('Building...')
      const getBuildElapsedTime = trackElapsedTime()
      await Promise.all([
        buildCssModulesTypingsAsync(),
        buildBundlesAsync({ mainConfigFilePath, minify, uiConfigFilePath }),
        buildManifestAsync(minify)
      ])
      const buildElapsedTime = getBuildElapsedTime()
      log.clearPreviousLine()
      log.success(`Built in ${buildElapsedTime}`)
    }
  } catch (error) {
    log.error(error.message)
    process.exit(1)
  }
}
