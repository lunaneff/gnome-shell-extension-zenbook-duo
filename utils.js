// A lot of code in this file is adapted from https://github.com/deinstapel/cpupower

const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension(),
    EXTENSIONDIR = Me.dir.get_path(),
    INSTALLER = `${EXTENSIONDIR}/scripts/installer.sh`,
    TOOL_SUFFIX = GLib.get_user_name(),
    PKEXEC = GLib.find_program_in_path('pkexec'),
    SH = GLib.find_program_in_path('sh');

function spawnProcessCheckExitCode(...argv) {
    return new Promise((resolve, reject) => {
        let [ok, pid, stdin, stdout, stderr] = GLib.spawn_async(
            EXTENSIONDIR,
            argv,
            null,
            GLib.SpawnFlags.DO_NOT_REAP_CHILD,
            null
        );
        if (!ok) {
            reject();
            return;
        }
        GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, (process, exitStatus) => {
            GLib.spawn_close_pid(process);
            let exitCode = 0;
            try {
                GLib.spawn_check_exit_status(exitStatus);
            } catch (e) {
                exitCode = e.code;
            }

            resolve(exitCode);
        });
    });
}

const EXIT_SUCCESS = 0,
    EXIT_INVALID_ARGUMENT = 1,
    EXIT_FAILURE = 2,
    EXIT_NEEDS_UPDATE = 3,
    EXIT_NOT_INSTALLED = 4,
    EXIT_NEEDS_ROOT = 5;

function checkInstalled() {
    return spawnProcessCheckExitCode(
        SH,
        INSTALLER,
        '--prefix',
        '/usr',
        '--suffix',
        TOOL_SUFFIX,
        '--extension-path',
        EXTENSIONDIR,
        'check'
    );
}

function install() {
    return spawnProcessCheckExitCode(
        PKEXEC,
        SH,
        INSTALLER,
        '--prefix',
        '/usr',
        '--suffix',
        TOOL_SUFFIX,
        '--extension-path',
        EXTENSIONDIR,
        'install'
    );
}

function uninstall() {
    return spawnProcessCheckExitCode(
        PKEXEC,
        SH,
        INSTALLER,
        '--prefix',
        '/usr',
        '--suffix',
        TOOL_SUFFIX,
        '--extension-path',
        EXTENSIONDIR,
        'uninstall'
    );
}

function runScreenpadTool(pkexecNeeded, ...params) {
    return new Promise((resolve, reject) => {
        let args = ['/usr/local/bin/screenpad-' + TOOL_SUFFIX].concat(params);

        if (pkexecNeeded) {
            args.unshift(PKEXEC);
        }

        let launcher = Gio.SubprocessLauncher.new(Gio.SubprocessFlags.STDOUT_PIPE);
        launcher.set_cwd(EXTENSIONDIR);
        let proc;
        try {
            proc = launcher.spawnv(args);
        } catch (e) {
            reject(e);
            return;
        }

        let stdoutStream = new Gio.DataInputStream({
            base_stream: proc.get_stdout_pipe(),
            close_base_stream: true,
        });
        proc.wait_async(null, (proc, result) => {
            // this only throws if async call got cancelled, but we
            // explicitly passed null for the cancellable
            let ok = proc.wait_finish(result);
            if (!ok) {
                reject();
                return;
            }

            let exitCode = proc.get_exit_status();
            let [stdout, _length] = stdoutStream.read_upto('', 0, null);

            resolve({
                ok: exitCode === 0,
                exitCode,
                stdout,
            });
        });
    });
}
