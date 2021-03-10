import { ContainerPublisher } from 'ern-container-publisher'
import { createTmpDir, gitCli, shell, log, NativePlatform, mustacheUtils } from 'ern-core'
import path from 'path'
import fs from 'fs'

export default class CocoaPodGitPublisher implements ContainerPublisher {
  get name(): string {
    return 'cocoapod-git'
  }

  get platforms(): NativePlatform[] {
    return ['ios']
  }

  public async publish({
    containerPath,
    containerVersion,
    url,
    platform,
    extra
  }: {
    containerPath: string
    containerVersion: string
    url?: string,
    platform: string,
    extra?: {
      branch?: string,
      subdir?: string,
      allowVersionOverwrite?: boolean,
      podspec?: {
        name?: string,
        summary?: string,
        homepage?: string,
        license?: string,
        author?: string,
        swift_version?: string,
        deployment_target?: string
      }
    }
  }) {
    const workingGitDir = createTmpDir()
    const branch = (extra && extra.branch) || 'main'
    const allowVersionOverwrite = (extra && extra.allowVersionOverwrite) || false

    const pathToXCFramework = path.join(containerPath, 'ElectrodeContainer.xcframework');

    if (!url) {
      throw new Error('url is required')
    }

    if (!fs.existsSync(pathToXCFramework)) {
      throw new Error(`Couldn't find container xcframework in ${pathToXCFramework}`)
    }

    try {
      shell.pushd(workingGitDir)
      const git = gitCli()

      const re = new RegExp(`refs/heads/${branch}`)
      const remoteHeads = await gitCli().raw(['ls-remote', '--heads', url])

      log.debug(`workingGitDir: ${workingGitDir}`)

      if (re.test(remoteHeads)) {
        log.debug(`${branch} branch exists in remote. Reusing it.`)
        log.debug(`Running 'git clone ${url} . --single-branch --branch ${branch} --depth 1`)
        await gitCli().clone(url, '.', ['--single-branch', '--branch', branch, '--depth', '1'])
      } else {
        log.debug(`${branch} branch does not exists in remote. Creating it.`)
        log.debug(`Running 'git clone ${url} . --depth 1`)
        await gitCli().clone(url, '.', ['--depth', '1'])
        await git.checkoutLocalBranch(branch)
      }

      shell.rm('-rf', path.join(workingGitDir, '*'))
      shell.cp('-Rf', path.join(containerPath, 'ElectrodeContainer.xcframework'), workingGitDir)
      await mustacheUtils.mustacheRenderToOutputFileUsingTemplateFile(
        path.join(__dirname, 'ElectrodeContainer.podspec.mustache'),
        {
          containerVersion,
          url,
          name: extra?.podspec?.name ?? "ElectrodeContainer",
          summary: extra?.podspec?.summary ?? "Electrode Native Container",
          homepage: extra?.podspec?.homepage ?? "https://native.electrode.io",
          license: extra?.podspec?.license ?? "MIT",
          author: extra?.podspec?.author ?? "Electrode Native Platform",
          swift_version: extra?.podspec?.swift_version ?? "5.0",
          deployment_target: extra?.podspec?.deployment_target ?? "11.0"
        },
        path.join(workingGitDir, 'ElectrodeContainer.podspec')
      )

      await git.add('./*')
      await git.commit(`Container v${containerVersion}`)
      const tagsOptions = allowVersionOverwrite ? ['-f'] : []
      await git.tag([`v${containerVersion}`, ...tagsOptions])
      await git.push('origin', branch)
      await git.raw(['push', 'origin', '--tags', ...tagsOptions])
      log.info('[=== Completed publication of the Container ===]')
      log.info(`[Publication url : ${url}]`)
      log.info(`[Git Branch: ${branch}]`)
      log.info(`[Git Tag: v${containerVersion}]`)
    } finally {
      shell.popd()
    }
  }
}
