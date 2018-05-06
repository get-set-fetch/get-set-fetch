const fs = require('fs');
const { Console } = require('console');

/* eslint no-param-reassign: 0 */
class Logger {
  // if no streams are set, perform like the global console
  static setStreams(outputStream, errorStream) {
    Logger.outputStream = outputStream || process.stdout;
    Logger.errorStream = errorStream || process.stderr;
  }

  // always open log files in append mode
  static setLogPaths(outputPath, errorPath) {
    Logger.setStreams(fs.createWriteStream(outputPath, { flags: 'a' }), fs.createWriteStream(errorPath, { flags: 'a' }));
  }

  static setLogLevel(logLevel) {
    switch (logLevel ? String(logLevel).toLowerCase() : '') {
      case 'trace':
        Logger.logLevel = 0;
        break;
      case 'debug':
        Logger.logLevel = 1;
        break;
      case 'info':
        Logger.logLevel = 2;
        break;
      case 'warn':
        Logger.logLevel = 3;
        break;
      case 'error':
        Logger.logLevel = 4;
        break;
      default:
        Logger.logLevel = 3;
    }
  }

  static getLogger(cls) {
    return new Logger(cls);
  }

  constructor(cls) {
    // ensure a default log level is set
    if (!Logger.logLevel) {
      Logger.setLogLevel();
    }

    // ensure default log writable streams are set
    if (!Logger.outputStream) {
      Logger.setStreams();
    }

    /*
    API changes
    node version below 10: new Console(stdout, stderr)
    node version 10: new Console({stdout, stderr})
    */
    const nodeVersion = parseInt(process.versions.node, 10);

    this.console = nodeVersion < 10 ?
      new Console(Logger.outputStream, Logger.errorStream) :
      new Console({ stdout: Logger.outputStream, stderr: Logger.errorStream });

    this.cls = cls;
  }

  trace(...args) {
    if (Logger.logLevel > 0) return;
    args[0] = `[TRACE] ${this.cls} ${new Date(Date.now())} ${args[0]}`;
    this.console.trace.apply(this, args);
  }

  debug(...args) {
    if (Logger.logLevel > 1) return;
    args[0] = `[DEBUG] ${this.cls} ${new Date(Date.now())} ${args[0]}`;
    this.console.debug.apply(this, args);
  }

  info(...args) {
    if (Logger.logLevel > 2) return;
    args[0] = `[INFO] ${this.cls} ${new Date(Date.now())} ${args[0]}`;
    this.console.info.apply(this, args);
  }

  warn(...args) {
    if (Logger.logLevel > 3) return;
    args[0] = `[WARN] ${this.cls} ${new Date(Date.now())} ${args[0]}`;
    this.console.warn.apply(this, args);
  }

  error(...args) {
    if (Logger.logLevel > 4) return;
    args[0] = `[ERROR] ${this.cls} ${new Date(Date.now())} ${args[0]}`;
    this.console.error.apply(this, args);
  }
}

module.exports = Logger;
