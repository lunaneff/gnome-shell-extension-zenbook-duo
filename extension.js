'use strict';

const Gio = imports.gi.Gio;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;
const Lang = imports.lang;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Keybindings = Me.imports.keybindings;

const ScreenpadSysfsPath = '/sys/class/leds/asus::screenpad';

// This variable is kept between enabling/disabling (so that the extension doesn't check if the file exists after unlocking the screen)
let firstRun = true;

class Extension {
    constructor() {}

    enable() {
        if (firstRun) {
            this._screenpadBrightnessFile = Gio.File.new_for_path(`${ScreenpadSysfsPath}/brightness`);
            if (!this._screenpadBrightnessFile.query_exists(null)) {
                this._showNotification(
                    'The Screenpad brightness file does not exist',
                    'Ensure the asus-wmi-screenpad module is installed and loaded and that your device is compatible with this module.',
                    'Click here to see how to do this',
                    function () {
                        Gio.AppInfo.launch_default_for_uri_async(
                            'https://github.com/Plippo/asus-wmi-screenpad#readme',
                            null,
                            null,
                            null
                        );
                    }
                );
            } else {
                let screenpadBrightnessFileInfo = this._screenpadBrightnessFile.query_info(
                    'access::*',
                    Gio.FileQueryInfoFlags.NONE,
                    null
                );

                // Check to make sure we have both read and write permissions
                if (
                    !screenpadBrightnessFileInfo.get_attribute_boolean(Gio.FILE_ATTRIBUTE_ACCESS_CAN_READ) ||
                    !screenpadBrightnessFileInfo.get_attribute_boolean(Gio.FILE_ATTRIBUTE_ACCESS_CAN_WRITE)
                ) {
                    this._showNotification(
                        'You do not have permission to set the brightness of the Screenpad+',
                        `The current user does not have write access to the file ${ScreenpadSysfsPath}/brightness.`,
                        'Click here to see how to configure this',
                        function () {
                            Gio.AppInfo.launch_default_for_uri_async(
                                'https://github.com/laurinneff/gnome-shell-extension-zenbook-duo/blob/master/docs/permissions.md',
                                null,
                                null,
                                null
                            );
                        }
                    );
                }
            }

            firstRun = false;
        }

        this._keybindingManager = new Keybindings.Manager();

        this._keybindingManager.add(
            'Launch7',
            async function () {
                try {
                    let brightness = await this._getBrightness();
                    if (brightness === 0) {
                        // Range from 1 to 255 so the screenpad can't be turned off completely by changing the brightness
                        this._setBrightness(this._brightnessSlider.value * 254 + 1);
                    } else {
                        this._setBrightness(0);
                    }
                } catch (e) {
                    logError(e);
                }
            }.bind(this)
        );

        this._keybindingManager.add(
            'Launch6',
            function () {
                // TODO: Swap windows
                this._showNotification('This key is not implemented yet.');
            }.bind(this)
        );

        this._keybindingManager.add(
            '<Shift><Super>s',
            function () {
                // https://gjs.guide/guides/gio/subprocesses.html#basic-usage

                try {
                    // The process starts running immediately after this function is called. Any
                    // error thrown here will be a result of the process failing to start, not
                    // the success or failure of the process itself.
                    let proc = Gio.Subprocess.new(
                        // The program and command options are passed as a list of arguments
                        ['gnome-screenshot'],

                        // The flags control what I/O pipes are opened and how they are directed
                        Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
                    );
                } catch (e) {
                    logError(e);
                }
            }.bind(this)
        );

        this._keybindingManager.add(
            'Tools',
            function () {
                // TODO: Open application, add configuration
                this._showNotification('This key is not implemented yet.');
            }.bind(this)
        );

        this._keybindingManager.add(
            'WebCam',
            function () {
                // TODO: Toggle camera
                this._showNotification('This key is not implemented yet.');
            }.bind(this)
        );

        this._brightnessSlider = imports.ui.main.panel.statusArea.aggregateMenu._brightness._slider;
        this._brightnessListenerId = this._brightnessSlider.connect(
            'notify::value',
            async function () {
                try {
                    if ((await this._getBrightness()) === 0) return; // Don't turn Screenpad on when it was turned off

                    // Range from 1 to 255 so the screenpad can't be turned off completely by changing the brightness
                    await this._setBrightness(this._brightnessSlider.value * 254 + 1);
                } catch (e) {
                    logError(e);
                }
            }.bind(this)
        );
    }

    disable() {
        this._brightnessSlider.disconnect(this._brightnessListenerId);
        this._keybindingManager.destroy();
        if (this._notifSource) this._notifSource.destroy();
    }

    // Shamelessly stolen from https://github.com/RaphaelRochet/arch-update/blob/3d3f5927ec0d33408a802d6d38af39c1b9b6f8e5/extension.js#L473-L497
    _showNotification(title, message, btnText, btnAction) {
        if (this._notifSource == null) {
            // We have to prepare this only once
            this._notifSource = new MessageTray.SystemNotificationSource();
            // Take care of note leaving unneeded sources
            this._notifSource.connect(
                'destroy',
                Lang.bind(this, function () {
                    this._notifSource = null;
                })
            );
            Main.messageTray.add(this._notifSource);
        }
        let notification = null;
        notification = new MessageTray.Notification(this._notifSource, title, message);
        if (btnText) notification.addAction(btnText, Lang.bind(this, btnAction));
        notification.setTransient(true);
        this._notifSource.showNotification(notification);
    }

    _getBrightness() {
        return new Promise((resolve, reject) => {
            let [success, brightness] = this._screenpadBrightnessFile.load_contents(null);
            if (success) resolve(+imports.byteArray.toString(brightness));
            else reject();
        });
    }

    _setBrightness(brightness) {
        return new Promise((resolve, reject) => {
            let [success] = this._screenpadBrightnessFile.replace_contents(
                Math.floor(brightness).toString(),
                null,
                false,
                Gio.FileCreateFlags.NONE,
                null
            );
            if (success) resolve();
            else reject();
        });
    }
}

function init() {
    return new Extension();
}
