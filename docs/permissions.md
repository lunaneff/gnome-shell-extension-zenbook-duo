# How to set up permissions for this extension

## Temporary

```shell
$ sudo chmod a+w /sys/class/leds/asus::screenpad/brightness
```

## Permanent (requires udev)

If you don't use udev, add the command from the temporary section to an init script instead. If you don't know what udev is, you can probably continue following these instructions

1. Create this file at `/etc/udev/rules.d/99-screenpad.rules`

```udev
ACTION=="add", SUBSYSTEM=="leds", KERNEL=="asus::screenpad", RUN+="/bin/chmod a+w /sys/class/leds/%k/brightness"
```

2. Apply the new udev rule:

```shell
$ sudo udevadm control --reload-rules && sudo udevadm trigger
```

3. Ensure the permissions are correctly set:

```shell
$ ls -l /sys/class/leds/asus::screenpad/brightness
-rw-rw-rw- 1 root root 4096 Apr 18 16:32 /sys/class/leds/asus::screenpad/brightness
```

If the first column is `-rw-rw-rw-`, the permissions are correctly set
