# Asus ZenBook Duo Integration for GNOME

## Supported hardware

| Model    | Supported? | Additional notes                           | Confirmed by |
| -------- | :--------: | ------------------------------------------ | ------------ |
| UX481FLY |     ✅     |                                            | @laurinneff  |
| UX482EA  |     ✅     | without NVIDIA GPU                         | @jibsaramnim |
| UX482EG  |     ❔     | with NVIDIA GPU                            |              |
| UX8402   |     ✅     | without NVIDIA GPU, Ubuntu 23.04           | @allofmex    |

<!-- Use ✅ for supported, ❔ for unknown/unconfirmed, ❌ for unsupported -->

## Installation

This extension requires the [asus-wmi-screenpad](https://github.com/Plippo/asus-wmi-screenpad) kernel module, please install this first.

[![Get it on GNOME Extensions](https://github.com/andyholmes/gnome-shell-extensions-badge/raw/master/get-it-on-ego.png)](https://extensions.gnome.org/extension/4607/asus-zenbook-duo-integration/)

```shell
git clone https://github.com/laurinneff/gnome-shell-extension-zenbook-duo.git
cd gnome-shell-extension-zenbook-duo
make install
```

## Usage

This extension will add a second brightness slider to Quicksettings (where your volume/wifi/... toggles are) to control Screenpad brightness.
It will also add functionality to some of your Asus hardware keys like Toggle-Screenpad and MyAsus key.

It will **not** link the brightness hardware keys to Screenpad display (as of now).
