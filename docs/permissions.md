# How to set up permissions for this extension

The extension asks to install additional files required to set the Screenpad brightness when it's enabled. Just click the button, enter your password, and let it install everything.

## Uninstalling the additional files

There's a button in the extension's settings, just click it, enter your password, and all the changes are undone. If you'd instead prefer to do it manually, remove these files:

```
/usr/local/bin/screenpad-$USER
/usr/share/polkit-1/actions/org.gnome.shell.extensions.zenbook-duo.$USER.policy
/usr/share/polkit-1/rules.d/org.gnome.shell.extensions.zenbook-duo.rules
```

## Removing the old udev rule

Previously, the extension asked you to add a udev rule that allows every user to set the Screenpad brightness. Now this isn't the case anymore, so it's recommended to remove the rule by deleting the file at `/etc/udev/rules.d/99-screenpad.rules`
