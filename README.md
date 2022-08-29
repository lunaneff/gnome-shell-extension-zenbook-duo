# Asus ZenBook Duo Integration for GNOME

## Supported hardware

| Model    | Supported? | Additional notes   | Confirmed by |
| -------- | :--------: | ------------------ | ------------ |
| UX481FLY |     ✅     |                    | @laurinneff   |
| UX482EA  |     ✅     | without NVIDIA GPU | @jibsaramnim  |
| UX482EG  |     ❔     | with NVIDIA GPU    |               |
| UX8402ZA |     ⚠️     | without NVIDIA GPU | @MarsOrBust24 |

<!-- Use ✅ for supported, ❔ for unknown/unconfirmed, ❌ for unsupported -->

## Installation

This extension requires the [asus-wmi-screenpad](https://github.com/Plippo/asus-wmi-screenpad) kernel module, please install this first.

[![Get it on GNOME Extensions](https://github.com/andyholmes/gnome-shell-extensions-badge/raw/master/get-it-on-ego.png)](https://extensions.gnome.org/extension/4607/asus-zenbook-duo-integration/)

```shell
git clone https://github.com/laurinneff/gnome-shell-extension-zenbook-duo.git
cd gnome-shell-extension-zenbook-duo
make install
```

## Known issues

- UX8402's and probably others with Intel EVO require more modern Kernels, as 5.15 will cause hourly crashes, screen flickering, sleep issues and blank screens.
