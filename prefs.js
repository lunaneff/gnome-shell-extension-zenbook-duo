'use strict';

const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

let settings;

function init() {
    settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.zenbook-duo');
}

function buildPrefsWidget() {
    let buildable = new Gtk.Builder();
    buildable.add_from_file(Me.dir.get_path() + '/prefs.ui');
    let box = buildable.get_object('prefs_widget');

    let version_label = buildable.get_object('version_label');
    version_label.set_text(`Version ${Me.metadata.version.toString()}`);

    settings.bind('myasus-cmd', buildable.get_object('entry_myasus_cmd'), 'text', Gio.SettingsBindFlags.DEFAULT);

    settings.connect('changed::screenshot-type', () => update_screenshot_type_buttons(buildable));
    update_screenshot_type_buttons(buildable);

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

    return box;
}

function update_screenshot_type_buttons(buildable) {
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
