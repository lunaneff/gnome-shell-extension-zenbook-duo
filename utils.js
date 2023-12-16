// A lot of code in this file is adapted from https://github.com/deinstapel/cpupower

import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

export class ShellTools {

    /**
     * 
     * @param {Extension} extension 
     */
    constructor(extension) {
        this.extension = extension;
        this.EXTENSIONDIR = extension.dir.get_path();
        this.TOOL_SUFFIX = GLib.get_user_name();
        this.PKEXEC = GLib.find_program_in_path('pkexec');
    }

    runScreenpadTool(pkexecNeeded, ...params) {
        return this.runShellCmd(pkexecNeeded, '/usr/local/bin/screenpad-' + this.TOOL_SUFFIX, ...params);
    }

    /**
     * Reads device product name (like 'Zenbook UX8402ZA_UX8402ZA')
     */
    async getProductName() {
        const ret = await this.runShellCmd(false, 'cat', '/sys/devices/virtual/dmi/id/product_name');
        return ret.ok ? ret.stdout : null;
    }

    runShellCmd(pkexecNeeded, cmd, ...params) {
        return new Promise((resolve, reject) => {
            let args = [cmd].concat(params);
    
            if (pkexecNeeded) {
                args.unshift(this.PKEXEC);
            }
    
            let launcher = Gio.SubprocessLauncher.new(Gio.SubprocessFlags.STDOUT_PIPE);
            launcher.set_cwd(this.EXTENSIONDIR);
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
}

export const ReturnCodes = Object.freeze({
    EXIT_SUCCESS : 0,
    EXIT_INVALID_ARGUMENT : 1,
    EXIT_FAILURE : 2,
    EXIT_NEEDS_UPDATE : 3,
    EXIT_NOT_INSTALLED : 4,
    EXIT_NEEDS_ROOT : 5,
});

export class SetupUtils {

    /**
     * 
     * @param {Extension} extension 
     */
    constructor(extension) {
        this.EXTENSIONDIR = extension.dir.get_path();
        this.INSTALLER = `${this.EXTENSIONDIR}/scripts/installer.sh`;
        this.TOOL_SUFFIX = GLib.get_user_name();
        this.PKEXEC = GLib.find_program_in_path('pkexec');
        this.SH = GLib.find_program_in_path('sh');
    }

    checkInstalled() {
        return this._spawnProcessCheckExitCode(
            this.SH,
            this.INSTALLER,
            '--prefix',
            '/usr',
            '--suffix',
            this.TOOL_SUFFIX,
            '--extension-path',
            this.EXTENSIONDIR,
            'check'
        );
    }

    install() {
        return this._spawnProcessCheckExitCode(
            this.PKEXEC,
            this.SH,
            this.INSTALLER,
            '--prefix',
            '/usr',
            '--suffix',
            this.TOOL_SUFFIX,
            '--extension-path',
            this.EXTENSIONDIR,
            'install'
        );
    }

    uninstall() {
        return this._spawnProcessCheckExitCode(
            this.PKEXEC,
            this.SH,
            this.INSTALLER,
            '--prefix',
            '/usr',
            '--suffix',
            this.TOOL_SUFFIX,
            '--extension-path',
            this.EXTENSIONDIR,
            'uninstall'
        );
    }

    _spawnProcessCheckExitCode(...argv) {
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
}
