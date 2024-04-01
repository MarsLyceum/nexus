# Provisioning & Setup
This describes how to setup the development environment

## macOS / iOS
**This assumes you have Homebrew installed.** If not, install it via:

`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`

**You will need Xcode.** Install it from th app store if you don't have it already.

**You will also need to install the Xcode Command Line Tools.** Open Xcode, then choose Settings... (or Preferences...) from the Xcode menu. Go to the Locations panel and install the tools by selecting the most recent version in the Command Line Tools dropdown.

**To install a simulator**, open Xcode > Settings... (or Preferences...) and select the Platforms (or Components) tab. Select a simulator with the corresponding version of iOS you wish to use.

If you are using Xcode 14.0 or greater to install a simulator, open Xcode > Settings > Platforms tab, then click "+" icon and select iOS… option.

---
### Install primary software
- Typescript

      npm install -g typescript
- Node.js

      brew install node
      brew install watchman
- React Native CLI (*Note: do NOT install globally*)

      npm install react-native-cli

- CocoaPods

      sudo gem install cocoapods

***~ NAVIGATE TO THE PROJECT DIRECTORY***

### Install project dependencies

    npm install

## macOS / Android
todo

## Running the dev server
Within the project directory run `npm start`