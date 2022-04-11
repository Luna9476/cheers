export const ROOT_LOGGER_NAME = 'ROOT';

export const Levels = {
  ALL: 0,
  DEBUG: 20,
  INFO: 40,
  WARN: 60,
  ERROR: 80,
  OFF: 999
};

const LEVEL_NAMES = Object.fromEntries(Object.entries(Levels).map((a) => a.reverse()));

const logSettings = {
  level: Levels.WARN,
  appender: null,
  time: Date
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

  #time;

  constructor(loggerName, appender, time) {
    this.#loggerName = loggerName || ROOT_LOGGER_NAME;
    this.#appender = appender || new ConsoleAppender(console);
    this.#time = time || Date;
  }

  _log(log) {
    if (!log.message) {
      return;
    }
    const logLevel = log.level || Levels.INFO;
    if (logSettings.level > logLevel) {
      return;
    }
    const ts = log.timestamp || this.#time.now();
    const line = `${new Date(ts).toISOString()} [${LEVEL_NAMES[logLevel]}] ${this.#loggerName} - ${log.message}`;
    this.#appender.print(line);
  }

  debug(msg) {
    this._log({
      level: Levels.DEBUG,
      message: msg
    });
  }

  info(msg) {
    this._log({
      level: Levels.INFO,
      message: msg
    });
  }

  warn(msg) {
    this._log({
      level: Levels.WARN,
      message: msg
    });
  }

  error(msg) {
    this._log({
      level: Levels.ERROR,
      message: msg
    });
  }
}

export function getLogger(logger) {
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
  return new Logger(loggerName, logSettings.appender, logSettings.time);
}

export function setLevel(level) {
  const levelName = LEVEL_NAMES[level];
  if (!levelName) {
    throw new Error(`The level '${levelName}' does not exist.`);
  }
  logSettings.level = level;
}

export function setAppender(appender) {
  logSettings.appender = appender;
}

export function setTime(time) {
  logSettings.time = time;
}
