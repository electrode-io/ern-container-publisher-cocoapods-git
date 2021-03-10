# Electrode Native CocoaPods Git Container Publisher

[![ci][1]][2]

This publisher can be used to publish an iOS Electrode Native Container as a [CocoaPods][3] to a remote Git repository. The Git repository provider should not matter (GitHub, BitBucket, TFS ...).

**This publisher expects that the container has been transformed to an XCFramework for distribution** *(one way to achieve this is to run the [xcframework transformer][4] before running this publisher)*.

In future updates of this publisher we may support other packaging formats based on new needs.

Once published, the container can be imported in the client mobile application by adding a dependency on ElectrodeContainer in the Podfile of the client application, as follow, for example:

```
pod 'ElectrodeContainer', :git => 'url_to_git_repo', :tag => 'container_version'
```

The target Git remote repository must exist. It will not be created by this publisher.

For example, for initial publication to GitHub, a repository should be created in GitHub beforehand.
## Usage
### With `ern publish-container` CLI command

#### Required

- `--url/-u` : URL of the remote Git repository (SSH or HTTPS) to publish to
- `--publisher/-p` : `cocoapods-git`
- `--platform` : `ios`

#### Optional

- `--containerPath` : Path to the Container to publish.\
Defaults to the Electrode Native default iOS Container Generation path (`~/.ern/containergen/out/ios` if not changed through config)

- `--containerVersion/-v` : Version of the Container to publish.\
Default to `1.0.0`

- `branch` : The name of the branch to publish to.\
Default to `main`

The `ern publish-container` CLI command can be used as follow to manually publish a Container using the cocoapods git publisher :

```sh
ern publish-container --containerPath [pathToContainer] -p cocoapods-git -u [gitRepoUrl] -v [containerVersion] ---platform [android|ios] -e '{"branch":"[branch_name]"}'
```

- `allowVersionOverwrite` : A boolean flag to allow overwriting the version (tag). Defaults to false.

```sh
ern publish-container --containerPath [pathToContainer] -p cocoapods-git -u [gitRepoUrl] -v [containerVersion] ---platform [android|ios] -e '{"allowVersionOverwrite": true}'
```

### With Cauldron

#### Required

- `--publisher/-p` : `cocoapods-git`
- `--url/-u` : URL of the remote Git repository (SSH or HTTPS) to publish to

#### Optional

- `branch` : The name of the branch to publish to.\
Please note that the branch needs to be created manually before hand in the remote repo. Defaults to `main`

- `allowVersionOverwrite` : A boolean flag to allow overwriting the version (tag).\
Defaults to false.

- `podspec` : An object containing one or more podspec field(s) value(s).
  - `name` :  The name of the Pod _(default: `ElectrodeContainer`)_
  - `summary` : A short description of the Pod _(default: `Electrode Native Container`)_
  - `homepage` : The URL of the homepage of the Pod _(default: `https://native.electrode.io`)_
  - `license`: The license of the Pod _(default: `MIT`)_
  - `author`:  Name of the library maintainer _(default: `Electrode Native Platform`)_
  - `swift_version` : The version of swift that this specification supports _(default: `5.0`)_
  - `deployment_target` : The minimum deployment target of iOS platform _(default: `11.0`)_

To automatically publish Cauldron generated Containers of a target native application and platform, the `ern cauldron add publisher` command can be used as follow:

```sh
ern cauldron add publisher -p cocoapods-git -u [gitRepoUrl] -e '{"branch":"[branch_name]"}'
```

This will result in the following publisher entry in Cauldron :

```json
{
  "name": "cocoapods-git",
  "url": "[gitRepoUrl]",
  "extra": {
    "branch": "[branch_name]",
    "allowVersionOverwrite": "[allowVersionOverwrite]",
    "podspec": {
      "name": "[name]",
      "summary": "[summary]",
      "homepage": "[homepage]",
      "license": "[license]",
      "author": "[author]",
      "swift_version": "[swift_version]",
      "deployment_target": "[deployment_target]"
    }
  }
}
```

This is only needed once. Once the configuration for the publisher is stored in Cauldron, any new Cauldron generated Container will be published to Git.

### Programmatically

```js
import GitPublisher from 'ern-container-publisher-cocoapods-git'
const publisher = new CocoaPodsGitPublisher()
publisher.publish({
  /* Local file system path to the Container */
  containerPath,
  /* Version of the Container. Will result in a Git tag. */
  containerVersion,
  /* Remote Git repository url (ssh or https) */
  url,
  /* Extra config specific to this publisher */
  extra?: {
    /* Name of the branch to publish to */
    branch?: string
    /* Allow version (tag) overwrite */
    allowVersionOverwrite?: boolean
  }
})
```

[1]: https://github.com/electrode-io/ern-container-publisher-cocoapods-git/workflows/ci/badge.svg
[2]: https://github.com/electrode-io/ern-container-publisher-cocoapods-git/actions
[3]: https://cocoapods.org
[4]: https://github.com/electrode-io/ern-container-transformer-xcframework
