#!/bin/sh

set -e

OLD_VERSION=$(awk '/VERSION = / {print $3}' ./Makefile)
NEW_VERSION=$((1 + OLD_VERSION))

echo "Bumping version from $OLD_VERSION to $NEW_VERSION"
sed -i "s/VERSION = [0-9][0-9]*/VERSION = $NEW_VERSION/" Makefile
sed -i "s/\"version\": \"[0-9][0-9]*\"/\"version\": \"$NEW_VERSION\"/" metadata.json
sed -i "s/<annotate key=\"org.gnome.shell.extensions.zenbook-duo.version\">[0-9][0-9]*<\/annotate>/<annotate key=\"org.gnome.shell.extensions.zenbook-duo.version\">$NEW_VERSION<\/annotate>/" polkit/org.gnome.shell.extensions.zenbook-duo.policy.in
sed -i "s/\/\/VERSION: [0-9][0-9]*/\/\/VERSION: $NEW_VERSION/" polkit/org.gnome.shell.extensions.zenbook-duo.rules
sed -i "s/VERSION=[0-9][0-9]*/VERSION=$NEW_VERSION/" scripts/installer.sh
sed -i "s/VERSION=[0-9][0-9]*/VERSION=$NEW_VERSION/" scripts/screenpad