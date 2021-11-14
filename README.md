# Asus ZenBook Duo Integration for GNOME

## Supported hardware

| Model    | Supported? | Additional notes    | Confirmed by |
| -------- | :--------: | ------------------- | ------------ |
| UX481FLY |     ✅     |                     | @laurinneff  |
| UX482    |     ✅     | Exact model unknown | @jibsaramnim |

<!-- Use ✅ for supported, ❌ for unsupported -->

## Installation

```shell
git clone https://github.com/laurinneff/gnome-shell-extension-zenbook-duo.git
cd gnome-shell-extension-zenbook-duo
gnome-extensions pack --extra-source=utils.js --extra-source=keybindings.js
gnome-extensions install zenbook-duo@laurinneff.ch.shell-extension.zip
```
