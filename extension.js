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

class Extension {
    constructor() {
    }

    enable() {
    	this.screenpadBrightnessFile = Gio.File.new_for_path(`${ScreenpadSysfsPath}/brightness`)
    	if(!this.screenpadBrightnessFile.query_exists(null)) {
    		this._showNotification(
    			'The Screenpad brightness file does not exist',
    			'Ensure the asus-wmi-screenpad module is installed and loaded and that your device is compatible with this module.',
    			'Click here to see how to do this',
    			function() {
			        Gio.AppInfo.launch_default_for_uri_async('https://github.com/Plippo/asus-wmi-screenpad#readme', null, null, null);
	    		}
	    	);
    	}
    	if(!false) { // TODO: Check if the current user has permission to write to the brightness file
    		this._showNotification(
    			'You do not have permission to set the brightness of the Screenpad+',
    			`The current user does not have write access to the file ${ScreenpadSysfsPath}/brightness.`,
    			'Click here to see how to configure this',
    			function() {
    				Gio.AppInfo.launch_default_for_uri_async('https://github.com/laurinneff/gnome-shell-extension-zenbook-duo/blob/master/docs/permissions.md', null, null, null);
    			}
    		);
    	}
    	
		this.keybindingManager = new Keybindings.Manager();

		this.keybindingManager.add('Launch7', function() {
			// TODO: Toggle the Screenpad
			this._showNotification('The Screenpad should be toggled in this function.');
		}.bind(this));

		this.keybindingManager.add('Launch6', function() {
			// TODO: Swap windows
			this._showNotification('The windows on the Screenpad and main display should be swapped in this function.');
		}.bind(this));

		this.keybindingManager.add('<Shift><Super>s', function() {
			// TODO: Take screenshot
			this._showNotification('A screenshot should be taken in this function.');
		}.bind(this));

		this.keybindingManager.add('Tools', function() {
			// TODO: Open application, add configuration
			this._showNotification('Some application should be opened in this function.');
		}.bind(this));

		this.keybindingManager.add('WebCam', function() {
			// TODO: Toggle camera
			this._showNotification('The camera should be toggled in this function.');
		}.bind(this));

		this.brightnessSlider = imports.ui.main.panel.statusArea.aggregateMenu._brightness._slider;
		this.brightnessListenerId = this.brightnessSlider.connect('notify::value', function() {
			// TODO: Change Screenpad brightness
			this._showNotification('The Screenpad brightness should be changed in this function.', `Brightness: ${this.brightnessSlider.value}`);
		}.bind(this));
    }

    disable() {
    	this.brightnessSlider.disconnect(this.brightnessListenerId);
    	this.keybindingManager.destroy();
    }

	// Shamelessly stolen from https://github.com/RaphaelRochet/arch-update/blob/3d3f5927ec0d33408a802d6d38af39c1b9b6f8e5/extension.js#L473-L497
    _showNotification(title, message, btnText, btnAction) {
		if (this._notifSource == null) {
			// We have to prepare this only once
			this._notifSource = new MessageTray.SystemNotificationSource();
			// Take care of note leaving unneeded sources
			this._notifSource.connect('destroy', Lang.bind(this, function() {this._notifSource = null;}));
			Main.messageTray.add(this._notifSource);
		}
		let notification = null;
		notification = new MessageTray.Notification(this._notifSource, title, message);
		if(btnText)
			notification.addAction(btnText, Lang.bind(this, btnAction) );
		notification.setTransient(true);
		this._notifSource.showNotification(notification);
	}
}

function init() {
    return new Extension();
}
