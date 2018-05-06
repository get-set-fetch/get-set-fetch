const { Console } = require('console');
const chai = require('chai');
const spies = require('chai-spies');

chai.use(spies);

const GetSetFetch = gsfRequire('lib/index.js');
const { Logger } = GetSetFetch;

describe('Test Logger', () => {
  it('static setLogLevel', () => {
    // valid values
    const logLevels = ['trace', 'debug', 'info', 'warn', 'error'];
    for (let i = 0; i < logLevels.length; i += 1) {
      Logger.setLogLevel(logLevels[i]);
      assert.strictEqual(Logger.logLevel, i);
    }

    // invalid values, Logger.logLevel should be the default value of 3 (warn)
    Logger.logLevel = null;
    Logger.setLogLevel();
    assert.strictEqual(Logger.logLevel, 3);

    Logger.logLevel = null;
    Logger.setLogLevel('dummy');
    assert.strictEqual(Logger.logLevel, 3);

    Logger.logLevel = null;
    Logger.setLogLevel(5);
    assert.strictEqual(Logger.logLevel, 3);
  });

  it('static setStreams', () => {
    // unset relevant settings
    Logger.outputStream = null;
    Logger.errorStream = null;

    // check default stream values
    Logger.setStreams();
    assert.strictEqual(Logger.outputStream, process.stdout);
    assert.strictEqual(Logger.errorStream, process.stderr);
  });

  it('log instance', () => {
    // unset relevant settings
    Logger.logLevel = null;
    Logger.outputStream = null;
    Logger.errorStream = null;

    // check if defaults are enforced if none provided when creating a new instance
    const setStreamsSpy = chai.spy.on(Logger, 'setStreams');
    const setLogLevelSpy = chai.spy.on(Logger, 'setLogLevel');

    const logInstance = Logger.getLogger('testClass');

    chai.expect(setStreamsSpy).to.have.been.called.with();
    chai.expect(setLogLevelSpy).to.have.been.called.with();

    // check log instance additional properties
    assert.strictEqual(logInstance.cls, 'testClass');
    assert.instanceOf(logInstance.console, Console);
  });

  it('log methods', () => {
    // check if corresponding console methods are called correctly
    Logger.logLevel = null;
    Logger.outputStream = null;
    Logger.errorStream = null;

    const logInstance = Logger.getLogger('Test Logger');

    const consoleDebugSpy = chai.spy.on(logInstance.console, 'debug');
    const consoleInfoSpy = chai.spy.on(logInstance.console, 'info');
    const consoleWarnSpy = chai.spy.on(logInstance.console, 'warn');
    const consoleErrorSpy = chai.spy.on(logInstance.console, 'error');


    // for each log level call all console methods
    const logLevels = ['debug', 'info', 'warn', 'error'];
    const logMethods = ['debug', 'info', 'warn', 'error'];

    for (let i = 0; i < logLevels.length; i += 1) {
      Logger.setLogLevel(logLevels[i]);
      for (let j = 0; j < logMethods.length; j += 1) {
        logInstance[logMethods[j]].call(logInstance, 'this is a test log message, it\'s normal to appear in the console');
      }
    }

    chai.expect(consoleDebugSpy).to.have.been.called.exactly(1);
    chai.expect(consoleInfoSpy).to.have.been.called.exactly(2);
    chai.expect(consoleWarnSpy).to.have.been.called.exactly(3);
    chai.expect(consoleErrorSpy).to.have.been.called.exactly(4);
  });
});
