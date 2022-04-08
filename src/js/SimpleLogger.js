const ROOT_LOGGER_NAME = 'ROOT';

const Levels = {
  ALL: 0,
  DEBUG: 20,
  INFO: 40,
  WARN: 60,
  ERROR: 80,
  OFF: 999
};

const logSettings = {
  level: Levels.WARN,
  appender: null
};

class ConsoleAppender {
  #console;

  constructor(csl) {
    this.#console = csl || console;
  }

  print(msg) {
    this.#console.log(msg);
  }
}

class Logger {
  #loggerName;
  #appender;

  constructor(loggerName, appender) {
    this.#loggerName = loggerName || ROOT_LOGGER_NAME;
    this.#appender = appender || new ConsoleAppender(console);
  }

  _log(log) {
    if (!log.msg) {
      return;
    }
    const logLevel = log.level || Levels.INFO;
    if (logSettings.level > logLevel) {
      return;
    }
    const ts = log.timestamp || Date.now();
    const line = `${new Date(ts).toISOString()} [${logLevel}] ${this.#loggerName} - ${log.msg}`;
    this.#appender.print(line);
  }

  debug(msg) {
    this._log({
      level: Levels.DEBUG,
      messsage: msg
    });
  }

  info(msg) {
    this._log({
      level: Levels.INFO,
      messsage: msg
    });
  }

  warn(msg) {
    this._log({
      level: Levels.WARN,
      messsage: msg
    });
  }

  error(msg) {
    this._log({
      level: Levels.ERROR,
      messsage: msg
    });
  }
}

export default {
  getLogger(logger) {
    let loggerName;
    if (!logger) {
      loggerName = ROOT_LOGGER_NAME;
    } else if (typeof logger === 'string' || logger instanceof String) {
      loggerName = logger;
    } else if (logger.name) {
      loggerName = logger.name;
    } else {
      throw new Error('The logger must have a name.');
    }
    return new Logger(loggerName, logSettings.appender);
  },

  setLevel(level) {
    const levelNo = Levels[level];
    if (!levelNo) {
      throw new Error(`The level '${level}' does not exist.`);
    }
    logSettings.level = levelNo;
  },

  setAppender(appender) {
    logSettings.appender = appender;
  }
};
