'use strict';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';

import * as Keybindings from './keybindings.js';
import {ShellTools} from './utils.js';
import {SetupUtils} from './utils.js';
import {ReturnCodes as InstallerCodes} from './utils.js';
import {FeatureIndicator} from './featureindicator.js';

const ScreenpadSysfsPath = '/sys/class/leds/asus::screenpad';

export default class ZenbookDuoExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._firstRun = true;
    }

    enable() {
        if (this._firstRun) {
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
                this._checkInstalled();
            }

            /*
                This variable is kept between enabling/disabling (so that the extension doesn't check if the
                brightness file exists and if the additional files are installed after unlocking the screen)
            */
            this._firstRun = false;
        }

        this.settings = this.getSettings('org.gnome.shell.extensions.zenbook-duo');
        // this.settings.connect('changed::brightness',
        //    // no usecase as of now
        //    this._onSettingsChanged.bind(this)
        // );

        this._keybindingManager = new Keybindings.Manager();

        // Screenpad toggle key
        this._keybindingManager.add(
            'Launch7',
            async function () {
                try {
                    let brightness = await this._getBrightness();
                    if (brightness === 0) {
                        let sliderBrightness = this._featureIndicator.getScreenpadSliderBrightness();
                        let adjustedBrightness = Math.floor(sliderBrightness*255);
                        // 1 to 255, so the screenpad will always turn on
                        this._setBrightness(Math.max(adjustedBrightness, 1), true);
                    } else {
                        this._setBrightness(0, true);
                    }
                } catch (e) {
                    logError(e);
                }
            }.bind(this)
        );

        // Swap windows key
        this._keybindingManager.add(
            'Launch6',
            function () {
                // TODO: Swap windows
                this._showNotification('This key is not implemented yet.');
            }.bind(this)
        );

        // Screenshot key
        this._keybindingManager.add(
            '<Shift><Super>s',
            function () {
                let args;

                switch (this.settings.get_string('screenshot-type')) {
                    case 'Screen':
                        args = []; // gnome-screenshot without args will take a screenshot of the whole screen
                        break;
                    case 'Window':
                        args = ['--window'];
                        break;
                    case 'Selection':
                        args = ['--area'];
                        break;
                    case 'Interactive':
                        args = ['--interactive'];
                        break;
                }

                if (this.settings.get_boolean('screenshot-include-cursor')) {
                    args.push('--include-pointer');
                }

                try {
                    // The process starts running immediately after this function is called. Any
                    // error thrown here will be a result of the process failing to start, not
                    // the success or failure of the process itself.
                    let proc = Gio.Subprocess.new(
                        // The program and command options are passed as a list of arguments
                        ['gnome-screenshot', ...args],

                        // The flags control what I/O pipes are opened and how they are directed
                        Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
                    );
                } catch (e) {
                    logError(e);
                }
            }.bind(this)
        );

        // MyASUS key
        this._keybindingManager.add(
            'Launch1',
            function () {
                try {
                    let cmd = this.settings.get_string('myasus-cmd');
                    log('Firing cmd '+cmd);
                    // The process starts running immediately after this function is called. Any
                    // error thrown here will be a result of the process failing to start, not
                    // the success or failure of the process itself.
                    let proc = Gio.Subprocess.new(
                        // The program and command options are passed as a list of arguments
                        ['sh', '-c', cmd],
                        // The flags control what I/O pipes are opened and how they are directed
                        Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
                    );
                } catch (e) {
                    logError(e);
                }
            }.bind(this)
        );

        // Toggle webcam key
        this._keybindingManager.add(
            'WebCam',
            function () {
                // TODO: Toggle camera
                this._showNotification('This key is not implemented yet.');
            }.bind(this)
        );

        if (Main.panel.statusArea.quickSettings._system) {
            this._initQuickSettingsItems();
        } else {
            /*
            * Quick settings menu is populated asynchronously 
            * That means that the extension is initialized before built-in quick settings items are added.
            * We need to delay our own indicator setup until built-in quick settings are available 
            */
            GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
                if (!Main.panel.statusArea.quickSettings._system)
                    return GLib.SOURCE_CONTINUE;
                this._initQuickSettingsItems();
                return GLib.SOURCE_REMOVE;
            });
        }

        this.utils = new ShellTools(this);

        this.settings.connect(
            'changed::uninstall',
            async function () {
                if (this.settings.get_boolean('uninstall')) {
                    log('Uninstalling additional screenpad files');
                    let setupUtils = new SetupUtils(this);
                    switch (await setupUtils.uninstall()) {
                        case InstallerCodes.EXIT_SUCCESS:
                            this._showNotification(
                                'Successfully uninstalled files',
                                'The files have been uninstalled successfully. You can now remove the extension.'
                            );
                            break;
                        case InstallerCodes.EXIT_FAILURE:
                            this._showNotification(
                                'Failed to uninstall the files',
                                'The files could not be uninstalled.'
                            );
                            break;
                    }
                    this.settings.set_boolean('uninstall', false);
                }
            }.bind(this)
        );

        this.utils.getProductName().then((productName) => {
            log('Zenbook-Duo extension is running on '+productName);
            // this maybe used in future for product line specific adjustmens.
            // E.g. the original extension used keybinding key 'Tools' for MyASUS key
            // but for UX8402 it is 'Launch1'.
            // It is not clear if this was changed for all zenbooks, or only on 
            // newer versions.
        }).catch((error) => {
            log(error);
        });
    }

    disable() {
        this._featureIndicator.destroy();
        this._featureIndicator = null;
        this._keybindingManager.destroy();
        if (this._notifSource) {
            this._notifSource.destroy();
            this._notifSource = null;
        }
        this._keybindingManager = null;
        this.settings = null;
    }

    _initQuickSettingsItems() {
        this._featureIndicator = new FeatureIndicator(
            (newValue) => this._onMainScreenSliderChg(newValue),
            (newValue) => this._onPadSliderChg(newValue),
            () => this._onLinkedToggle()
        );
        // Add the indicator to the panel
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._featureIndicator, 2);

        let isLinked = this.settings.get_boolean('link-brightness');
        this._featureIndicator.setLinkedStatus(isLinked);
        if (isLinked) {
            this._featureIndicator.setScreenpadSliderValue(
                // set slider to stored adjust-value and trigger update
                this.settings.get_uint('brightness') / 100.0, true);
        } else {
            this._getBrightness().then(brightness => {
                // set slider to screenpads real brightness
                this._featureIndicator.setScreenpadSliderValue(brightness / 255.0, false);
            });
        }
     }

    _onMainScreenSliderChg(sliderValue) {
        let isLinked = this.settings.get_boolean('link-brightness');
        //log('onMainScreenSliderChg '+newValue+' isLinked:'+isLinked);
        if (isLinked) {
            let padSliderValue = this._featureIndicator.getScreenpadSliderBrightness();
            // if in linked mode, screenpad slider defines a relative offset 
            // to main brightness, while still allowing min/max brightness
            
            // here the calculation:
            // slider value is 0.0 - 1.0
            // shift to -0.5 - +0.5 via "padSliderValue - 0.5"
            // spread range a bit for more effect (*1.7)
            // flip positiv/negativ (*-1) that left slider position is positiv and right negative
            // offset is now +0,85 to -0,85
            let offset = ((padSliderValue - 0.5) * 1.7) * -1;
            // offset+1 that original middle position results in sliderValue¹ (=no change)
            let targetValue = Math.pow(sliderValue, (offset+1));
            //log('main '+sliderValue.toFixed(2)+ ' offset '+offset.toFixed(2)+' new '+targetValue.toFixed(2));
            let adjusted = Math.max(Math.floor(targetValue*255), 1);
            this._setBrightness(adjusted, false).catch((error) => {
                logError(e);
            });
        }
    }

    _onPadSliderChg(newValue) {
        let isLinked = this.settings.get_boolean('link-brightness');
        //log('onPadSliderChg '+newValue+ ' isLinked:'+isLinked);
        this.settings.set_uint('brightness', Math.floor(newValue*100.0));
        if (isLinked) {
            // recalculate screenpad brightness base on main brightness
            this._onMainScreenSliderChg(this._featureIndicator.getMainSliderBrightness());
        } else {
            let adjusted = Math.max(Math.floor(newValue*255), 1);
            this._setBrightness(adjusted, true);
        }
    }

    _onLinkedToggle() {
        let isLinked = !this.settings.get_boolean('link-brightness');
        //log('onLinkedToggle isLinked:'+isLinked);
        this._featureIndicator.setLinkedStatus(isLinked);
        this.settings.set_boolean('link-brightness', isLinked);
    }

//    _onSettingsChanged() {} // unused

    _checkInstalled() {
        log('Checking if additional screenpad files are installed');
        let setupUtils = new SetupUtils(this);
        setupUtils.checkInstalled().then((result) => {
            switch (result) {
                case InstallerCodes.EXIT_SUCCESS:
                    // Only check for the udev rule if the additional files are installed
                    const udevRuleFile = Gio.File.new_for_path('/etc/udev/rules.d/99-screenpad.rules');
                    if (udevRuleFile.query_exists(null)) {
                        this._showNotification(
                            'You still have the old udev rule on your system',
                            "This rule was previously used to get write access on the brightness file, but it isn't needed anymore.",
                            'Click here to see how to remove it',
                            function () {
                                Gio.AppInfo.launch_default_for_uri_async(
                                    'https://github.com/laurinneff/gnome-shell-extension-zenbook-duo/blob/master/docs/permissions.md#removing-the-old-udev-rule',
                                    null,
                                    null,
                                    null
                                );
                            }
                        );
                    }
                    break;
                case InstallerCodes.EXIT_NOT_INSTALLED:
                    this._showNotification(
                        'This extension requires additional configuration',
                        "In order for this extension to work, it needs to install some files. You can undo this in the extension's settings.",
                        'Click here to do this automatically',
                        async function () {
                            switch (await setupUtils.install()) {
                                case InstallerCodes.EXIT_SUCCESS:
                                    this._showNotification(
                                        'Successfully installed files',
                                        'The files have been installed successfully. You can now use the extension.'
                                    );
                                    break;
                                case InstallerCodes.EXIT_FAILURE:
                                    this._showNotification(
                                        'Failed to install the files',
                                        'The files could not be installed.'
                                    );
                                    break;
                            }
                        }
                    );
                    break;
                case InstallerCodes.EXIT_NEEDS_UPDATE:
                    this._showNotification(
                        'The additional files for the Screenpad+ extension requires an update',
                        'The extension has been updated, but the additional files need to be updated separately.',
                        'Click here to do this automatically',
                        async function () {
                            switch (await setupUtils.install()) {
                                case InstallerCodes.EXIT_SUCCESS:
                                    this._showNotification(
                                        'Successfully updated files',
                                        'The files have been files successfully. You can now use the extension.'
                                    );
                                    break;
                                case InstallerCodes.EXIT_FAILURE:
                                    this._showNotification(
                                        'Failed to update the files',
                                        'The files could not be updated.'
                                    );
                                    break;
                            }
                        }
                    );
                    break;
            }
        });
    }

    // Shamelessly stolen from https://github.com/RaphaelRochet/arch-update/blob/3d3f5927ec0d33408a802d6d38af39c1b9b6f8e5/extension.js#L473-L497
    _showNotification(title, message, btnText, btnAction) {
        if (this._notifSource == null) {
            // We have to prepare this only once
            this._notifSource = new MessageTray.SystemNotificationSource();
            // Take care of note leaving unneeded sources
            this._notifSource.connect('destroy', () => {
                this._notifSource = null;
            });
            Main.messageTray.add(this._notifSource);
        }
        let notification = null;
        notification = new MessageTray.Notification(this._notifSource, title, message);
        if (btnText) notification.addAction(btnText, btnAction.bind(this));
        notification.setTransient(true);
        this._notifSource.showNotification(notification);
    }

    async _getBrightness() {
        const ret = await this.utils.runScreenpadTool(false, 'get');
        return +ret.stdout;
    }

    /**
     * @param brightness traget brightness (0-256)
     * @param forced true to set value, even if screenpad is turned off (may turn on)
     */
    async _setBrightness(brightness, forced) {
        const curr = await this._getBrightness();
        if (forced || curr !== 0) {
            const ret = await this.utils.runScreenpadTool(true, 'set', Math.floor(brightness).toString());
            return ret.ok;
        }
        return true;
    }
}

function init() {
    return new Extension();
}
