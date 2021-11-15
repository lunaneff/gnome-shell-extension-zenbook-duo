# Asus ZenBook Duo Integration for GNOME

## Supported hardware

| Model    | Supported? | Additional notes    | Confirmed by |
| -------- | :--------: | ------------------- | ------------ |
| UX481FLY |     ✅     |                     | @laurinneff  |
| UX482EA  |     ✅     | without NVIDIA GPU  | @jibsaramnim |
| UX482EG  |     ❔     | with NVIDIA GPU     |              |

<!-- Use ✅ for supported, ❔ for unknown/unconfirmed, ❌ for unsupported -->

## Installation

This extension requires the [asus-wmi-screenpad](https://github.com/Plippo/asus-wmi-screenpad) kernel module, please install this first.

```shell
git clone https://github.com/laurinneff/gnome-shell-extension-zenbook-duo.git
cd gnome-shell-extension-zenbook-duo
gnome-extensions pack --extra-source=utils.js --extra-source=keybindings.js --extra-source=prefs.ui
gnome-extensions install zenbook-duo@laurinneff.ch.shell-extension.zip
```
