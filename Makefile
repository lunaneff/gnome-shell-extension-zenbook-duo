VERSION = 7

EXTENSION_INSTALL_DIR = "$(HOME)/.local/share/gnome-shell/extensions/zenbook-duo@laurinneff.ch"

FILES += extension.js
FILES += utils.js
FILES += keybindings.js
FILES += featureindicator.js
FILES += prefs.js
FILES += prefs.ui
FILES += metadata.json
FILES += stylesheet.css
FILES += scripts/installer.sh
FILES += scripts/screenpad
FILES += polkit/org.gnome.shell.extensions.zenbook-duo.policy.in
FILES += polkit/org.gnome.shell.extensions.zenbook-duo.rules
FILES += schemas/gschemas.compiled

build:
	echo Compiling schemas...
	glib-compile-schemas schemas

clean:
	rm -rf schemas/gschemas.compiled target

package: build
	rm -rf target
	mkdir -p target
	zip target/zenbook-duo-$(VERSION).zip $(FILES)

install: package
	rm -rf $(EXTENSION_INSTALL_DIR)
	mkdir -p "$(EXTENSION_INSTALL_DIR)"
	unzip -o target/zenbook-duo-$(VERSION).zip -d "$(EXTENSION_INSTALL_DIR)"