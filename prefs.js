'use strict';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class ZenbookDuoExtPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window._settings = this.getSettings('org.gnome.shell.extensions.zenbook-duo');
        window.add(this.getPrefsWidget());
    }

    getPrefsWidget() {
        let buildable = new Gtk.Builder();
        buildable.add_from_file(this.dir.get_path() + '/prefs.ui');
        let box = buildable.get_object('prefs_widget');

        let version_label = buildable.get_object('version_label');
        version_label.set_text(`Version ${this.metadata.version.toString()}`);

        let settings = this.getSettings('org.gnome.shell.extensions.zenbook-duo');

        settings.bind('myasus-cmd', buildable.get_object('entry_myasus_cmd'), 'text', Gio.SettingsBindFlags.DEFAULT);

        settings.connect('changed::screenshot-type', () => this.update_screenshot_type_buttons(buildable));
        this.update_screenshot_type_buttons(buildable, settings);

        const screenshot_screen = buildable.get_object('screenshot_screen');
        screenshot_screen.connect('toggled', (x) => {
            if (screenshot_screen.get_active()) settings.set_string('screenshot-type', 'Screen');
        });
        const screenshot_window = buildable.get_object('screenshot_window');
        screenshot_window.connect('toggled', (x) => {
            if (screenshot_window.get_active()) settings.set_string('screenshot-type', 'Window');
        });
        const screenshot_selection = buildable.get_object('screenshot_selection');
        screenshot_selection.connect('toggled', (x) => {
            if (screenshot_selection.get_active()) settings.set_string('screenshot-type', 'Selection');
        });
        const screenshot_interactive = buildable.get_object('screenshot_interactive');
        screenshot_interactive.connect('toggled', (x) => {
            if (screenshot_interactive.get_active()) settings.set_string('screenshot-type', 'Interactive');
        });

        settings.bind(
            'screenshot-include-cursor',
            buildable.get_object('switch_screenshot_cursor'),
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        settings.set_boolean('uninstall', false); // clear dangling flags if a previous request failed
        const button_uninstall = buildable.get_object('button_uninstall');
        button_uninstall.connect('clicked', () => {
            settings.set_boolean('uninstall', true);
        });

        return box;
    }

    update_screenshot_type_buttons(buildable, settings) {
        switch (settings.get_string('screenshot-type')) {
            case 'Screen':
                buildable.get_object('screenshot_screen').set_active(true);
                break;
            case 'Window':
                buildable.get_object('screenshot_window').set_active(true);
                break;
            case 'Selection':
                buildable.get_object('screenshot_selection').set_active(true);
                break;
            case 'Interactive':
                buildable.get_object('screenshot_interactive').set_active(true);
                break;
        }
    }
}
