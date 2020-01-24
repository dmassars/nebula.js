describe('app-theme', () => {
  let appThemeFn;
  let internalAPI;
  let logger;
  let t;
  const sandbox = sinon.createSandbox();
  before(() => {
    internalAPI = {
      setTheme: sandbox.spy(),
    };
    t = () => ({
      externalAPI: 'external',
      internalAPI,
    });
    logger = {
      error: sandbox.spy(),
      warn: sandbox.spy(),
    };
    [{ default: appThemeFn }] = aw.mock([[require.resolve('@nebula.js/theme'), () => t]], ['../app-theme']);
  });

  afterEach(() => {
    sandbox.reset();
  });

  it('should return external API', () => {
    const at = appThemeFn({});
    expect(at.externalAPI).to.equal('external');
  });

  describe('custom', () => {
    it('should load and apply custom theme', async () => {
      const root = { setMuiThemeName: sandbox.spy() };
      const at = appThemeFn({
        root,
        logger,
        themes: [
          {
            key: 'darkish',
            load: () =>
              Promise.resolve({
                type: 'dark',
                color: 'red',
              }),
          },
        ],
      });
      await at.setTheme('darkish');
      expect(root.setMuiThemeName).to.have.been.calledWithExactly('dark');
      expect(internalAPI.setTheme).to.have.been.calledWithExactly(
        {
          type: 'dark',
          color: 'red',
        },
        'darkish'
      );
    });

    it('should timeout after 5sec', async () => {
      const root = { setMuiThemeName: sinon.spy() };
      const at = appThemeFn({
        root,
        logger,
        themes: [
          {
            key: 'darkish',
            load: () => new Promise(resolve => setTimeout(resolve, 6000)),
          },
        ],
      });
      const sb = sinon.createSandbox({ useFakeTimers: true });
      const prom = at.setTheme('darkish');
      sb.clock.tick(5500);
      await prom;
      sb.restore();
      expect(logger.warn).to.have.been.calledWithExactly("Timeout when loading theme 'darkish'");
    });
  });

  describe('defaults', () => {
    it('should apply light theme on React root when themeName is not found', () => {
      const root = { setMuiThemeName: sinon.spy() };
      const at = appThemeFn({ root });
      at.setTheme('foo');
      expect(root.setMuiThemeName).to.have.been.calledWithExactly('light');
    });

    it('should apply dark theme on React root when themename is "dark"', () => {
      const root = { setMuiThemeName: sinon.spy() };
      const at = appThemeFn({ root });
      at.setTheme('dark');
      expect(root.setMuiThemeName).to.have.been.calledWithExactly('dark');
    });

    it('should apply "light" as type on internal theme', () => {
      const root = { setMuiThemeName: sinon.spy() };
      const at = appThemeFn({ root });
      at.setTheme('light');
      expect(internalAPI.setTheme).to.have.been.calledWithExactly(
        {
          type: 'light',
        },
        'light'
      );
    });
  });
});
