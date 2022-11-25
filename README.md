# Federal Space
A HTML5 Electron game about conquering planets in a universe.

![Federal Space logo](https://raw.githubusercontent.com/EntityPlantt/Federal-Space/main/images/icon.ico)

## How to play
You spawn in a universe full of static planets. Every planet has its own size. There are 50 planets in a universe and you can go between universes with a click.

Every planet has a chance (2%) to have intelligent life on it. They are harder to colonize because you have to fight the life. But, don't leave them, because they can evolve into a federation that can attack your planets! Declare war as soon as possible.

## License
[![Creative Commons License](https://i.creativecommons.org/l/by-nd/4.0/88x31.png)](http://creativecommons.org/licenses/by-nd/4.0/)

This work is licensed under a [Creative Commons Attribution-NoDerivatives 4.0 International License](http://creativecommons.org/licenses/by-nd/4.0/).

See [LICENSE.txt](https://github.com/EntityPlantt/Federal-Space/blob/main/LICENSE.txt)

## Installing
You can download this game in a variety of ways.

### Download, install and play
Want to get the prebuilt version? Go from here!
1. Go to the [Releases page](https://github.com/EntityPlantt/Federal-Space/releases).
2. Download the latest release build.
3. Run the Microsoft installer and complete the wizard.
4. Run the game. You can do this by creating a shortcut, or by searching "Federal Space" in App Search.
5. Enjoy! 😀

### How to build it yourself
Want to build it on your own, *because you don't trust me (😧) or an issue with installing, or you want to create a version for Linux... There are countless reasons, so let's get started.*
1. Download the [WiX Toolset](http://wixtoolset.org/releases/) version 3.
2. Clone this repository somewhere on your computer.
  ```bat
  cd C:\local\repo\path\
  git clone "https://github.com/EntityPlantt/Federal-Space"
  ```
3. Install all of the packages required to build this package.
  ```bat
  npm install
  ```
4. Go inside `batches` and run `build.bat` in Command Prompt. You should now have a directory that's something like `Federal Space-win32-x64`. The name depends of your computer's operational system.
5. Go back and run the file `msi.js` with arguments of your OS and architecture.
  ```bat
  cd ..
  :: Example, architecture is 64-bit and OS is Windows
  node msi win32 x64
  ```
6. You shold see a folder `msi`. Inside that folder, there's `Federal Space.msi`. That's the generated installer. Proceed to Step 3 in [Download, install and play](#download-install-and-play).