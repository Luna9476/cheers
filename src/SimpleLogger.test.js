import {
  ROOT_LOGGER_NAME,
  Levels,
  getLogger,
  setLevel,
  setAppender,
  setTime
} from './SimpleLogger';

class MockConsoleAppender {
  lastMessage = null;

  print(msg) {
    this.lastMessage = msg;
  }

  reset() {
    this.lastMessage = null;
  }
}

let appender;

beforeEach(() => {
  appender = new MockConsoleAppender();
  setAppender(appender);
  setTime({
    now: () => 946684800000 // 2000-01-01T00:00:00Z
  });
});

afterEach(() => {
  appender.reset();
});

test('A line of warn log was printed to the console.', () => {
  const testLogger = getLogger('test');
  testLogger.warn('yes!');
  expect(appender.lastMessage).toBe('2000-01-01T00:00:00.000Z [WARN] test - yes!');
});

test('Since by default the log level is WARN, no log was printed.', () => {
  const testLogger = getLogger('test');
  testLogger.info('yes!');
  expect(appender.lastMessage).toBeNull();
});

test('A line of warn log was printed to the console after level had been set.', () => {
  setLevel(Levels.INFO);
  const testLogger = getLogger('test');
  testLogger.info('yes!');
  expect(appender.lastMessage).toBe('2000-01-01T00:00:00.000Z [INFO] test - yes!');
  setLevel(Levels.WARN);
});
