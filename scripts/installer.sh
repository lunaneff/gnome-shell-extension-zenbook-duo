#!/bin/sh

VERSION=3

EXIT_SUCCESS=0
EXIT_INVALID_ARGUMENT=1
EXIT_FAILURE=2
EXIT_NEEDS_UPDATE=3
EXIT_NOT_INSTALLED=4
EXIT_NEEDS_ROOT=5

set -e

usage() {
    cat << USAGE
Usage: $0 [OPTIONS] [SUBCOMMAND]

Available options:
  --help, -h                Show this help
  --prefix PREFIX           Install prefix (default: /usr)
  --suffix SUFFIX           Suffix to append to tool name and action ID
  --extension-path PATH     Where the GNOME extension is installed

Available subcommands:
  install                   Install
  uninstall                 Uninstall
  check                     Check if installed
USAGE

    exit $EXIT_INVALID_ARGUMENT
}

if [ $# -eq 0 ]; then
    usage
fi

PREFIX=/usr

while [ $# -gt 0 ]; do
    case $1 in
        --help|-h)
            usage
            ;;
        --prefix)
            PREFIX=$2
            shift 2
            ;;
        --suffix)
            SUFFIX=$2
            shift 2
            ;;
        --extension-path)
            EXTENSION_PATH=$2
            shift 2
            ;;
        install)
            SUBCOMMAND="install"
            shift
            ;;
        uninstall)
            SUBCOMMAND="uninstall"
            shift
            ;;
        check)
            SUBCOMMAND="check"
            shift
            ;;
        *)
            echo "Unknown argument: $1"
            usage
            ;;
    esac
done

ACTION_SOURCE_PATH=$EXTENSION_PATH/polkit/org.gnome.shell.extensions.zenbook-duo.policy.in
RULE_SOURCE_PATH=$EXTENSION_PATH/polkit/org.gnome.shell.extensions.zenbook-duo.rules
TOOL_SOURCE_PATH=$EXTENSION_PATH/scripts/screenpad

ACTION_INSTALLED_PATH=$PREFIX/share/polkit-1/actions/org.gnome.shell.extensions.zenbook-duo.$SUFFIX.policy
RULE_INSTALLED_PATH=$PREFIX/share/polkit-1/rules.d/org.gnome.shell.extensions.zenbook-duo.rules
TOOL_INSTALLED_PATH=$PREFIX/local/bin/screenpad-$SUFFIX

ACTION_ID=org.gnome.shell.extensions.zenbook-duo

if [ -z "$SUBCOMMAND" ]; then
    echo "No subcommand specified"
    usage
fi

if [ -z "$EXTENSION_PATH" ]; then
    echo "No extension path specified"
    usage
fi

if [ $SUBCOMMAND = "check" ]; then
    if ! [ -f "$ACTION_INSTALLED_PATH" ]; then
        echo Action is not installed
        exit $EXIT_NOT_INSTALLED
    fi
    # The rule directory is only readable as root, so we can't check for updates or if it's installed
    # if ! [ -f "$RULE_INSTALLED_PATH" ]; then
    #    echo Rule is not installed
    #    exit $EXIT_NOT_INSTALLED
    # fi
    if ! [ -f "$TOOL_INSTALLED_PATH" ]; then
        echo Tool is not installed
        exit $EXIT_NOT_INSTALLED
    fi

    INSTALLED_ACTION_VERSION=$(pkaction --action-id "$ACTION_ID.$SUFFIX" --verbose | awk '/org.gnome.shell.extensions.zenbook-duo.version/ {print $4}')
    if [ "$INSTALLED_ACTION_VERSION" != "$VERSION" ]; then
        echo Polkit action is outdated
        exit $EXIT_NEEDS_UPDATE
    fi

    # INSTALLED_RULE_VERSION=$(awk '/VERSION:/ {print $3}' "$RULE_INSTALLED_PATH")
    # if [ "$INSTALLED_RULE_VERSION" != "$VERSION" ]; then
    #     echo Polkit rule is outdated
    #     exit $EXIT_NEEDS_UPDATE
    # fi

    INSTALLED_TOOL_VERSION=$(awk -F = '/VERSION=/ {print $2}' "$TOOL_INSTALLED_PATH")
    if [ "$INSTALLED_TOOL_VERSION" != "$VERSION" ]; then
        echo Tool is outdated
        exit $EXIT_NEEDS_UPDATE
    fi

    exit $EXIT_SUCCESS
fi

if [ $SUBCOMMAND = "install" ]; then
    if [ "$(id -u)" -ne 0 ]; then
        echo "This script must be run as root"
        exit $EXIT_NEEDS_ROOT
    fi

    printf "Installing screenpad tool... "
    mkdir -p "$(dirname "$TOOL_INSTALLED_PATH")"
    install -m755 "$TOOL_SOURCE_PATH" "$TOOL_INSTALLED_PATH" || (echo "Failed" && exit $EXIT_FAILURE)
    echo Success

    printf "Installing polkit action... "
    mkdir -p "$(dirname "$ACTION_INSTALLED_PATH")"
    sed -e "s:{{PATH}}:$TOOL_INSTALLED_PATH:g" \
        -e "s:{{ID}}:$ACTION_ID.$SUFFIX:g" "$ACTION_SOURCE_PATH" > "$ACTION_INSTALLED_PATH" 2>/dev/null || \
        (echo "Failed" && exit "${EXIT_FAILED}")
    echo Success

    printf "Installing polkit rule... "
    mkdir -p "$(dirname "$RULE_INSTALLED_PATH")"
    install -m644 "$RULE_SOURCE_PATH" "$RULE_INSTALLED_PATH" || (echo "Failed" && exit $EXIT_FAILURE)
    echo Success

    exit $EXIT_SUCCESS
fi

if [ $SUBCOMMAND = "uninstall" ]; then
    if [ "$(id -u)" -ne 0 ]; then
        echo "This script must be run as root"
        exit $EXIT_NEEDS_ROOT
    fi

    printf "Uninstalling screenpad tool... "
    if [ -f "$TOOL_INSTALLED_PATH" ]; then
        rm -f "$TOOL_INSTALLED_PATH" || (echo "Failed - cannot remove $TOOL_INSTALLED_PATH" && exit $EXIT_FAILURE)
    else
        echo "Not installed"
    fi
    echo Success

    printf "Uninstalling polkit action... "
    if [ -f "$ACTION_INSTALLED_PATH" ]; then
        rm -f "$ACTION_INSTALLED_PATH" || (echo "Failed - cannot remove $ACTION_INSTALLED_PATH" && exit $EXIT_FAILURE)
    else
        echo "Not installed"
    fi
    echo Success

    printf "Uninstalling polkit rule... "
    if [ -f "$RULE_INSTALLED_PATH" ]; then
        rm -f "$RULE_INSTALLED_PATH" || (echo "Failed - cannot remove $RULE_INSTALLED_PATH" && exit $EXIT_FAILURE)
    else
        echo "Not installed"
    fi
    echo Success

    exit $EXIT_SUCCESS
fi