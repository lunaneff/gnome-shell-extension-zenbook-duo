# Development

## Debugging

For logs run in terminal

```shell
# extension
journalctl -f -o cat /usr/bin/gnome-shell

#preferences
journalctl -f -o cat /usr/bin/gjs
```

To reload (all) extension press ALT+F2 and enter `restart`