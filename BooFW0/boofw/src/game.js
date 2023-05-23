// import "core-js/stable";
import "regenerator-runtime/runtime";
import * as PIXI from "pixi.js";
import { gsap } from "gsap";
import { PixiPlugin } from "gsap/PixiPlugin";
import { ExpoScaleEase, RoughEase, SlowMo } from "gsap/EasePack";
import { addStats } from "pixi-stats";
import DEFAULTS from "./game.json";
import DeviceManager from "./utils/deviceManager";
import GraphicsDriver from "./drivers/graphicsDriver";
import Sounds from "./sounds/sounds";
import Graphic from "./display/core/graphic";
import Container from "./display/core/container";
import QuarteredBackground from "./display/core/quarteredBackground";
import CreationFactory from "./helpers/creationFactory";
// TODO - this needs more thinking but will do for now!!!
import defaultGameUI from "./ui/default/gameUI";
import defaultLoadingScreen from "./ui/default/loadingScreen";
import defaultWelcomeScreen from "./ui/default/welcomeScreen";
import defaultTopInfoBar from "./ui/default/topInfoBar";
import defaultBottomBar from "./ui/default/bottomBar";
import defaultFreeRoundsMsgBox from "./ui/default/freeRoundsMsgBox";
//import slotmastersGameUI from "./ui/slotmasters/gameUI";
//import slotmastersLoadingScreen from "./ui/slotmasters/loadingScreen";
//import slotmastersWelcomeScreen from "./ui/slotmasters/welcomeScreen";
//
import RotationScreen from "./display/screens/rotationScreen";
import AppEventListener from "./events/appEventListener";
import eventsDictionary from "./events/eventsDictionary";
import LocaleManager from "./locale/localeManager";
import ErrorHandler from "./errorManager/errorHandler";
import TimerManager from "./timerManager/timerManager";
//import { debug, versioning, configManager } from "./index";
import { configManager } from "./index";
import FullScreenAPI from "./utils/fullScreenApi";
import ParticleManager from "./display/particles/particleManager";
import Utils from "./utils/utils";
import Maths from "./utils/maths";
import Vibrate from "./utils/vibrate";
import Loader from "./loader/loader";
import OrientationLayoutManager from "./utils/orientationLayoutManager";
import GridOverlay from "./display/gridOverlay";

import PayoutDisplayManager from "./helpers/payoutDisplayManager";

gsap.registerPlugin(PixiPlugin, ExpoScaleEase, RoughEase, SlowMo);
// give the plugin a reference to the PIXI object
PixiPlugin.registerPIXI(PIXI);

// how do we make these overrideable?
// we cant because this stuff isnt exposed via index.js
// but game includes all of these anyway
// so there is no reason for them to not be in index.js
// if they are exposed in index.js then they also need to be in creation factory for the type
// the current method of creation will need a refactor to allow overrides, at the mo, this just isnt possible
const UIModules = {
  default: defaultGameUI,
  slotmasters: slotmastersGameUI,
  custom: defaultGameUI,
};

const LoadingScreenModules = {
  default: defaultLoadingScreen,
  slotmasters: slotmastersLoadingScreen,
  custom: defaultLoadingScreen,
};

const WelcomeScreenModules = {
  default: defaultWelcomeScreen,
  slotmasters: slotmastersWelcomeScreen,
  custom: defaultWelcomeScreen,
};

const TopInfoBarModules = {
  default: defaultTopInfoBar,
  slotmasters: null,
  custom: defaultTopInfoBar,
};

const BottomBarModules = {
  default: defaultBottomBar,
  slotmasters: null,
  custom: defaultBottomBar,
};

const FreeRoundsMsgBoxModules = {
  default: defaultFreeRoundsMsgBox,
  slotmasters: null,
  custom: defaultFreeRoundsMsgBox,
};

// eslint-disable-next-line import/prefer-default-export
export class Game {
  constructor(initData) {
    if (Game.exists) {
      return Game.instance;
    }
    Game.instance = this;
    Game.exists = true;

    const defaultData = this.compileDefaults();
    this.initData = this.constructData(defaultData, initData);

    this.errorManager = null;
    this.baseURL = "./";
    this.PIXIInstance = PIXI;
    window.PIXI = this.PIXIInstance;
    this.app = null;
    this.graphicsDriver = null; // will be same as this.app
    this.screens = [];
    this.canvas = null;
    this.gameState = null;
    this.bonusWinCount = 0;
    this.currentScreen = "";
    this.screenWrapper = null;
    this.gameUI = null;
    this.origBGWidth = 1024;
    this.origBGHeight = 600;
    this.topBar = null;
    this.gameMinFPS = 15;
    this.gameMaxFPS = 60;
    this.gameSpeedModifier = 1;
    this.unPausedGameSpeedModifier = 1;
    this.mainScreen = null;
    this.rotationScreen = null;
    this.gameVersion = null;
    this.gameName = null;
    this.maskObj = null;
    this.uiConfigJson = null;
    this.topBarConfig = null;
    this.connectionConfig = null;
    this.bottomBar = null;
    this.introPanelHasBeenRemoved = false;

    this.pauseTimer = false;

    // Top related properties

    this.configLoaded = false;
    this.topBarLoaded = false;
    this.localeReady = false;
    this.connectionReady = false;

    this.topBarAvailable = false;
    this.connectionAvailable = false;
    this.localeAvailable = false;
    this.applicationEventListener = null;

    this.parser = null;
    this.connection = null;
    this.jackpotTimer = null;

    this.orientationLayoutManager = null;

    this.deltaInfo = {
      delta: 1,
      deltaInMS: 1,
    };

    this.paused = false;
    this.disableLowFpsMode = false;

    this.hbGameContainer = document.getElementById("hbGameContainer");
    this.bottomPadding = document.getElementById("hbPadding");

    this.backgrounds = {};

    this.lastRecordedGameWidth = -1;
    this.lastRecordedGameHeight = -1;

    this.gameResizedEventData = {};

    return this;
  }

  static getInstance() {
    return Game.getInstance;
  }

  /**
   * takes passed in config and merges that with this classes defaults
   * will return a new object with all config merged
   *
   * @function
   * @param {...object} otherDefaults - multiple data objects which you want merged
   * @returns {object} merged object
   */
  compileDefaults(...otherDefaults) {
    const defaultData = Utils.merge(DEFAULTS, ...otherDefaults, {});
    return defaultData;
  }

  /**
   * takes passed in config and merges that with the compiled defaults
   * will return a new object with all config merged and validated to make sure types are the same
   *
   * @function
   * @param {object} defaultData - this instances default data object
   * @param {object} initData - initData config object passed in on creation
   * @returns {object} merged object
   */
  constructData(defaultData, initData) {
    const data = Utils.mergeAndValidate(defaultData, initData);
    return data;
  }

  async initVersioning(gameVersion, gameName) {
    const data = {
      gameClientName: gameName,
      gameClientVersion: gameVersion,
      iosAppBuildVersion: this.initData.iosAppBuildVersion,
      isIOSAppBuild: this.initData.isIOSAppBuild,
    };
    // await versioning.loadGameVersionConfig(data);
    versioning.setGameClientDetails(data);
    versioning.outputFrameworkVersion();
    versioning.outputGameClientInfo();
    versioning.outputIOSBuildInfo();
    this.gameVersion = versioning.getGameClientVersion();
    this.gameName = versioning.getGameClientName();
  }

  async init(
    gameDetails = {
      gameConfig: {},
      gameName: "",
      gameVersion: "",
    }
  ) {
    await this.initVersioning(gameDetails.gameVersion, gameDetails.gameName);

    this.setupErrorHandler();
    this.setupDeviceManager();
    this.setupEventListener();

    await this.loadConfig(gameDetails.gameConfig);

    if (this.configLoaded === true) {
      // gamesys = the language code is got from url
      // what about other connections in the future?
      await this.setupGameLocale();

      const gameData = configManager.getConfig("game");
      this.gameMinFPS = gameData.minFPS;
      this.gameMaxFPS = gameData.maxFPS;

      this.setupDebug();
      this.setupGameState();
      this.setupTimerManager();
      this.setupPayoutDisplayManager();

      await this.setupGraphicsDriver();
      await this.setupOrientationLayoutManager();
      await this.setupSoundDriver();
      await this.setupLoader();
      await this.loadCommonUIBase64();
      await this.loadUIBase64();
      await this.loadClientBase64();

      await this.preloadAssets();

      await this.buildSceneGraphTemplate();
      await this.buildPreLoadBackgrounds();
      await this.buildLoadingScreen();
      this.buildFrameGradients();
      this.buildGameFrames();

      this.buildDialogMsgBox();

      this.setupTweaker();

      this.checkForResize(true);

      await this.setupTopBar();
      await this.setupConnection();

      await this.sendInitRequest();
      await this.getGameHistory();

      this.setupFreeRoundsManager();

      await this.loadAssets();

      this.buildFreeRoundsMsgBox();
      this.buildMaxWinMsgBox();

      this.setupParticleManager(); // requires the loader
      this.setupSoundPlayer();
      await this.setupScreenElements();
      this.setupFullScreenAPI();
      this.checkForResize(true);

      this.listenForRendererUpdates();
      await this.sendUpdatesToTopBar({
        key: "GAME_READY",
        value: true,
      });

      const gameCfg = configManager.getConfig("game");
      if (gameCfg.gameType !== "slotmasters") {
        // ! slotmasters, we cant setup the game flow yet
        // ! as we need timings from the ready response
        this.setupGameFlow();
      }

      this.startGame();
    }
  }

  // eslint-disable-next-line class-methods-use-this
  setupDebug() {
    // is the config telling us to enable the debug?
    const debugData = configManager.getConfig("debug");
    if (debugData) {
      if (debugData.enableDebugOutput === true) {
        debug.enable();
      } else {
        debug.disable();
      }
      debug.disableLevels(debugData.disabledLevels);
      if (debugData.createOnDeviceDisplay === true) {
        debug.createOnDeviceDisplay();
      }
    }
  }

  setupParticleManager() {
    this.particleManager = new ParticleManager({
      loader: this.graphicsDriver.loader,
    });
    if (this.deviceManager.pageShown === false) {
      this.particleManager.pauseForVisibility();
    }
  }

  setupFullScreenAPI() {
    // we may need to create a different api in the future based on connection / topbar
    const config = configManager.getConfig("fullScreenApi");
    if (config.enabled === true) {
      config.swipeDiv = this.hbGameContainer;
      config.topbar = this.topBar;
      this.fullScreenAPI = new FullScreenAPI(config);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  setupTweaker() {
    const tweakerRequired =
      DeviceManager.getUrlParam("tweakerRequired", "false") === "true";
    const tweakerConfig = configManager.getConfig("tweaker");
    if (this.initData.tweakerAllowed && tweakerRequired === true) {
      this.tweaker = CreationFactory.create(tweakerConfig.type, tweakerConfig);
    }
  }

  setupErrorHandler() {
    this.errorManager = new ErrorHandler();
  }

  setupDeviceManager() {
    this.deviceManager = new DeviceManager();
  }

  setupGameState() {
    const gameStateData = configManager.getConfig("gameState");
    this.gameState = CreationFactory.create(gameStateData.type, gameStateData);
  }

  async setupTopBar() {
    debug.log("setupTopBar .. ");

    const topBarData = configManager.getConfig("topBar");

    this.topBar = CreationFactory.create(topBarData.type, [
      this.topBarConfig,
      this.connectionConfig,
    ]);
    await this.topBar.init();
    this.topBarLoaded = true;
  }

  // This reports error
  // TODO: Legacy - can be remove i think
  // handleError(data) {
  //     this.sendUpdatesToTopBar({
  //         key: "ERROR",
  //         value: data,
  //     });
  // }

  async setupConnection() {
    debug.log("setupConnection .. ");

    const connectionData = configManager.getConfig("connection");
    const gameData = configManager.getConfig("game");
    if (gameData.connectionAvailable) {
      this.connection = CreationFactory.create(
        connectionData.type,
        connectionData
      );
      await this.connection.init();
    }
    this.connectionReady = true;
  }

  setupEventListener() {
    // eslint-disable-next-line no-unused-vars
    const applicationEventListener = new AppEventListener();

    AppEventListener.addEventListener(
      eventsDictionary.browserEvents.WINDOW_FOCUS,
      (eventData) => {
        this.windowFocusHandler(eventData);
      }
    );
    AppEventListener.addEventListener(
      eventsDictionary.browserEvents.WINDOW_BLUR,
      (eventData) => {
        this.windowBlurHandler(eventData);
      }
    );
    AppEventListener.addEventListener(
      eventsDictionary.browserEvents.DOCUMENT_VISIBILITY_CHANGE,
      (eventData) => {
        this.handleVisibilityChange(eventData);
      }
    );
    AppEventListener.addEventListener(
      eventsDictionary.browserEvents.WINDOW_RESIZE,
      () => {
        this.onWindowResize();
      }
    );

    // Stake Panel Events
    AppEventListener.addEventListener(
      eventsDictionary.stakePanel.STAKE_CHANGED,
      (eventData) => {
        this.stakeChanged(eventData);
      }
    );
    AppEventListener.addEventListener(
      eventsDictionary.stakePanel.STAKE_PANEL_OPEN,
      (eventData) => {
        this.stakePanelOpened(eventData);
      }
    );
    AppEventListener.addEventListener(
      eventsDictionary.stakePanel.STAKE_OK_PRESSED,
      (eventData) => {
        this.stakePanelOKPressed(eventData);
      }
    );

    AppEventListener.addEventListener(
      eventsDictionary.settingsPanel.SETTINGS_SOUND_CHANGED,
      (eventData) => {
        this.soundStatusChanged(eventData);
      }
    );
    AppEventListener.addEventListener(
      eventsDictionary.settingsPanel.SETTINGS_PANEL_CLOSED,
      (eventData) => {
        this.settingsPanelClosed(eventData);
      }
    );
    AppEventListener.addEventListener(
      eventsDictionary.settingsPanel.SETTINGS_PANEL_OPEN,
      (eventData) => {
        this.settingsPanelOpened(eventData);
      }
    );

    AppEventListener.addEventListener(
      eventsDictionary.autoplayPanel.AUTOPLAY_PANEL_OPEN,
      (eventData) => {
        this.autoplayOpen(eventData);
      }
    );
    AppEventListener.addEventListener(
      eventsDictionary.autoplayPanel.AUTOPLAY_PANEL_OK_PRESSED,
      (eventData) => {
        this.autoplayOkPressed(eventData);
      }
    );
    AppEventListener.addEventListener(
      eventsDictionary.autoplayPanel.AUTOPLAY_PANEL_CANCELLED,
      (eventData) => {
        this.autoplayCancelled(eventData);
      }
    );

    AppEventListener.addEventListener(
      eventsDictionary.uiButtons.SPIN_BUTTON_CLICKED,
      (eventData) => {
        this.spinClicked(eventData);
      }
    );

    AppEventListener.addEventListener(
      eventsDictionary.infoPanel.INFO_PANEL_OPEN,
      () => {
        this.infoPanelOpened(true);
      }
    );

    AppEventListener.addEventListener(
      eventsDictionary.infoPanel.INFO_PANEL_CLOSED,
      () => {
        this.infoPanelClosed(false);
      }
    );

    AppEventListener.addEventListener(
      eventsDictionary.topBar.TOPBAR_UPDATE,
      (data) => {
        this.receivedUpdateFromTopBar(data[0]);
      }
    );

    AppEventListener.addEventListener(
      eventsDictionary.game.GAME_DISABLE_LOW_FPS,
      () => {
        if (this.lowFpsIdleTimer) {
          this.lowFpsIdleTimer.pause();
        }
        this.disableLowFpsMode = true;
        this.normalFpsMode();
      }
    );

    AppEventListener.addEventListener(
      eventsDictionary.game.GAME_ENABLE_LOW_FPS,
      () => {
        this.disableLowFpsMode = false;
        this.ignoreLowFpsMode = false;
        if (this.lowFpsIdleTimer) {
          this.lowFpsIdleTimer.restart();
        } else {
          this.lowFpsMode();
        }
      }
    );

    AppEventListener.addEventListener(
      eventsDictionary.game.GAME_PAUSE_FOR_REALITY_CHECK,
      () => {
        this.pauseForRealityCheck();
      }
    );
    AppEventListener.addEventListener(
      eventsDictionary.game.GAME_RESUME_FOR_REALITY_CHECK,
      () => {
        this.resumeForRealityCheck();
      }
    );
  }

  // Handler to receive upate from the top bar
  receivedUpdateFromTopBar(data) {
    if (data.key === "TOPBAR_READY") {
      this.topBarLoadComplete(data);
    } else if (data.key === "MUTE") {
      this.gameUI.setSoundFromTopBar(data.value);
    } else if (data.key === "ABOUT") {
      // nothing
    } else if (data.key === "PAYTABLE") {
      this.gameUI.showHelpFromTopBar(data.value);
    } else if (data.key === "REVEALGAME") {
      // this.revealGame(data);
    } else if (data.key === "RESUMEGAME") {
      if (this.gameState.isGIP()) {
        if (
          this.gameState.isFreeRoundsActive() === true ||
          this.gameState.isFreeRoundsFinished() === true
        ) {
          this.freeRoundsManager.presentResumingPopup(() => {
            this.startGIP(data);
          });
        } else {
          this.startGIP(data);
        }
      } else {
        if (this.gameUI.inAutoPlay()) {
          this.gameUI.stopAutoplay();
        }
        if (this.errorManager.jackpotWonByAnother()) {
          if (this.gameState.inFreeSpins()) {
            // we are in free spins, so we dont need to reel the reels to stop spinning
            // we just need to request another spin
            if (this.parser) {
              this.parser.sendPlayRequest();
            }
          } else {
            if (this.gameStarted === true) {
              this.screens.reelScreen.stopSpinError();
            } else {
              // request another jackpot update
              this.parser.sendJackpotUpdateRequest();
            }
          }
        } else {
          // insufficient funds or wrong stake etc
          if (this.gameStarted === true) {
            this.screens.reelScreen.stopSpinError();
          } else {
            // nothing to do
          }
        }
      }
    } else if (data.key === "PAUSE") {
      this.pauseForTopBar();
    } else if (data.key === "RESUME") {
      this.resumeForTopBar();
    } else if (data.key === "SETBALANCE") {
      if (Utils.isNumber(data.value)) {
        // this is assuming the game is idle
        const accounting = this.gameState.get("accounting", false);
        accounting.storeAt(data.value, "balance");
        accounting.storeAt(data.value, "preBalance");
        this.gameState.broadcastTrueBalance();
      }
    }
  }

  async loadConfig(gameConfig) {
    debug.log("game main loadConfig .. ");

    // create a temp merged UI data object
    const uiData = Utils.mergeAndValidate(
      configManager.getConfig("ui", true),
      gameConfig.ui
    );

    // before we load the clients config
    // is there anything ui specific we want to load?
    const uiConfig = await import(
      /* webpackIgnore:true */ `./ui/common/uiConfig.js?t=${Date.now()}`
    );
    if (Utils.isObject(uiConfig.default)) {
      // merge UI specific config
      configManager.store(uiConfig.default);
    }

    if (uiData.uiType !== "custom") {
      const uiConfig2 = await import(
        /* webpackIgnore:true */ `./ui/${
          uiData.uiType
        }/uiConfig.js?t=${Date.now()}`
      );
      if (Utils.isObject(uiConfig2.default)) {
        // merge UI specific config
        configManager.store(uiConfig2.default);
      }
    }

    // now we can merge in the clients config
    configManager.store(gameConfig);

    this.configLoadComplete();

    this.configLoaded = true;
  }

  // eslint-disable-next-line class-methods-use-this
  configLoadComplete() {
    // dev to populate if they need to
  }

  // async buildAssetsToLoadList() {
  //     // this is where we will add any extra assets that need to be loaded
  //     // e.g. gameui assets
  //     // await this.addGameUIAssets();
  // }

  async setupGameLocale() {
    // const locale = this.gameState.get("locale").toLowerCase();
    // const response = await fetch(`./assets/locale/${locale}.json?t=${Date.now()}`);
    // const data = await response.json();
    await this.loadLocaleConfigs();

    const phrases = configManager.getConfig("phrases", false);
    LocaleManager.addLocaleData(phrases);

    AppEventListener.dispatchEvent("GAME_LOCALE_READY", null, this);
    this.localeReady = true;
  }

  // eslint-disable-next-line class-methods-use-this
  async loadLocaleConfigs() {
    // gamesys, locale is in the param
    // this will do for now, when we get more connections, we will put this in a function or something
    const gameConfig = configManager.getConfig("game", false);
    const localeRemapping = configManager.getConfig("localeRemapping", false);
    const localeSupported = configManager.getConfig("localeSupported", false);

    let locale = DeviceManager.getUrlParam("languageCode", "en").toLowerCase();
    if (Utils.isISO6392(locale)) {
      locale = Utils.iso6392to6391(locale);
    } else if (!Utils.isISO6391(locale)) {
      locale = "en";
    }
    const { forceLocale } = gameConfig;
    if (Utils.isString(forceLocale)) {
      locale = forceLocale;
    }

    // remap the locale if needed - default to en-gb if we dont have a remapping
    let mappedLocale = localeRemapping[locale]
      ? localeRemapping[locale].toLowerCase()
      : gameConfig.defaultLocale;

    // now check to see if the locale is supported
    if (!localeSupported[mappedLocale]) {
      mappedLocale = gameConfig.defaultLocale;
      // if the default aint allowed, then you got your setup wrong!
    }

    configManager.storeAt({ mappedLocale: mappedLocale }, "game");

    /* i have changed this so we import a js file instead of fetching a json
           once built, fetch was always trying to load from the wrong folder and i just could not figure out why.
           so now we import modules, and this fixes the issue */
    try {
      const module = await import(
        /* webpackIgnore:true */ `./../honeypot/locales/${mappedLocale}.js?t=${Date.now()}`
      );
      const data = module.default;
      configManager.store(data);
    } catch (e) {}

    try {
      const module = await import(
        /* webpackIgnore:true */ `./ui/common/locales/${mappedLocale}.js?t=${Date.now()}`
      );
      const data = module.default;
      configManager.store(data);
    } catch (e) {}

    const uiData = configManager.getConfig("ui");
    if (uiData.uiType !== "custom") {
      try {
        const module = await import(
          /* webpackIgnore:true */ `./ui/${
            uiData.uiType
          }/locales/${mappedLocale}.js?t=${Date.now()}`
        );
        const data = module.default;
        configManager.store(data);
      } catch (e) {}
    }

    // now game client locales
    try {
      const module = await import(
        /* webpackIgnore:true */ `./../game/locales/${mappedLocale}.js?t=${Date.now()}`
      );
      const data = module.default;
      configManager.store(data);
    } catch (e) {}
  }

  setupTimerManager() {
    const timerManagerData = configManager.getConfig("timerManager");
    this.timerManager = new TimerManager(timerManagerData);
    if (this.deviceManager.pageShown === false) {
      this.timerManager.pauseForVisibility();
    }
  }

  setupPayoutDisplayManager() {
    this.payoutDisplayManager = new PayoutDisplayManager();
  }

  setupFreeRoundsManager() {
    const freeRoundsConfig = configManager.getConfig("freeRounds");
    freeRoundsConfig.connection = this.connection;
    this.freeRoundsManager = CreationFactory.create(
      freeRoundsConfig.type,
      freeRoundsConfig
    );
  }

  async setupLoader() {
    const loaderConfig = configManager.getConfig("loader");
    loaderConfig.assetResolution = this.graphicsDriver.assetResolution;
    // TODO: this will need beefing out a bit if we have different platforms etc - but this will do for now
    loaderConfig.globalPath = DeviceManager.getUrlParam("smAssetsFolder", "");
    this.loader = new Loader(loaderConfig);
  }

  async setupGraphicsDriver() {
    const rendererConfig = configManager.getConfig("renderer", false);
    if (this.initData.forceResolutionRequired === true) {
      rendererConfig.resolution = this.initData.forceResolution;
    }
    this.app = new GraphicsDriver(rendererConfig);
    this.graphicsDriver = this.app;
    this.canvas = this.graphicsDriver.getContext();

    // lets start a timer to check for browser resizing
    this.resizeCheckTimer = this.timerManager.addTimer({
      callbackWhenFinished: () => {
        this.checkForResize(false);
      },
      duration: rendererConfig.resizeCheckDuration,
      oneShot: false,
      id: "ResizeTimer",
    });

    AppEventListener.addEventListener(
      eventsDictionary.game.GAME_FORCE_RESIZE,
      () => {
        this.onGameForceResize();
      }
    );

    if (rendererConfig.fpsMeterEnabled === true) {
      const stats = addStats(document, this.graphicsDriver.app);
      const ticker = PIXI.Ticker.shared;
      ticker.add(stats.update, stats, PIXI.UPDATE_PRIORITY.UTILITY);
      const statsDiv = document.getElementById("stats");
      statsDiv.style = rendererConfig.fpsMeterStyle;
      AppEventListener.addEventListener(
        eventsDictionary.browserEvents.KEYUP_DETECTED,
        (data) => {
          if (data.code === "KeyF") {
            if (statsDiv.style.display === "none") {
              statsDiv.style.display = "block";
            } else {
              statsDiv.style.display = "none";
            }
          }
        }
      );
    }
  }

  onGameForceResize() {
    this.checkForResize(true);
  }

  async setupOrientationLayoutManager() {
    const config = configManager.getConfig("orientationLayoutManager", false);
    if (config.enabled === true) {
      this.orientationLayoutManager = new OrientationLayoutManager(config);
    }
  }

  async setupSoundDriver() {
    const config = configManager.getConfig("soundDriver", false);
    this.soundDriver = new Sounds(config);
  }

  async buildSceneGraphTemplate() {
    debug.log("buildSceneGraphTemplate -- called");

    this.backgroundsContainer = new Container({
      id: "backgroundsContainer",
      visible: false,
    });
    this.canvas.stage.addChild(this.backgroundsContainer);

    this.screenScaleAndAlignmentContainer = new Container({
      id: "screenScaleAndAlignmentContainer",
    });
    this.canvas.stage.addChild(this.screenScaleAndAlignmentContainer);

    this.maskedContainer = new Container({ id: "maskedContainer" });
    this.screenScaleAndAlignmentContainer.addChild(this.maskedContainer);
    this.maskedContainer.visible = true;

    this.screenWrapper = new Container({ id: "screenWrapper" });
    this.maskedContainer.addChild(this.screenWrapper);
    this.screenWrapper.visible = true;

    this.uiContainer = new Container({ id: "uiContainer" });
    // TODO: better way of configuring where the ui lives
    this.maskedContainer.addChild(this.uiContainer);
    this.uiContainer.visible = true;

    // is the gridOverlay required
    const gridOverlayConfig = configManager.getConfig("gridOverlay");
    if (gridOverlayConfig.enabled === true) {
      this.gridOverlay = new GridOverlay(gridOverlayConfig);
      this.maskedContainer.addChild(this.gridOverlay);
    }

    this.frameContainer = new Container({ id: "frameContainer" });
    this.screenScaleAndAlignmentContainer.addChild(this.frameContainer);
    this.frameContainer.visible = true;

    this.gradientContainer = new Container({ id: "gradientContainer" });
    this.frameContainer.addChild(this.gradientContainer);
    this.gradientContainer.visible = true;

    this.maskScreens();

    this.checkForResize(true);
  }

  maskScreens() {
    if (this.maskedContainer) {
      const screenData = configManager.getConfig("screens");
      if (screenData.maskScreens === true) {
        if (this.maskObj) {
          this.maskedContainer.removeChild(this.maskObj);
          this.maskObj = null;
        }
        this.maskObj = new Graphic({
          id: "ScreenMask",
          x: 0,
          y: 0,
          colour: "0xff0000",
          rect: {
            x: 0,
            y: 0,
            width: this.graphicsDriver.gameOriginalWidth,
            height: this.graphicsDriver.gameOriginalHeight,
          },
        });
        this.maskedContainer.addChild(this.maskObj);
        this.maskedContainer.mask = this.maskObj;
      }
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async loadUIBase64() {
    const uiData = configManager.getConfig("ui");
    if (uiData.uiType !== "custom") {
      const module = await import(
        /* webpackIgnore:true */ `./ui/${uiData.uiType}/base64/base64@${
          PIXI.settings.RESOLUTION
        }x.js?t=${Date.now()}`
      );
      const base64Assets = module.default;

      const keys = Object.keys(base64Assets);
      for (let i = 0; i < keys.length; i++) {
        const texture = PIXI.Texture.from(base64Assets[keys[i]], {
          resolution: PIXI.settings.RESOLUTION,
        });
        PIXI.Texture.addToCache(texture, keys[i]);
      }
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async loadCommonUIBase64() {
    const module = await import(
      /* webpackIgnore:true */ `./ui/common/base64/base64@${
        PIXI.settings.RESOLUTION
      }x.js?t=${Date.now()}`
    );
    const base64Assets = module.default;
    const keys = Object.keys(base64Assets);
    for (let i = 0; i < keys.length; i++) {
      const texture = PIXI.Texture.from(base64Assets[keys[i]], {
        resolution: PIXI.settings.RESOLUTION,
      });
      PIXI.Texture.addToCache(texture, keys[i]);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async loadClientBase64() {
    const module = await import(
      /* webpackIgnore:true */ `./../game/base64@${
        PIXI.settings.RESOLUTION
      }x.js?t=${Date.now()}`
    );
    const base64Assets = module.default;

    const keys = Object.keys(base64Assets);
    for (let i = 0; i < keys.length; i++) {
      const texture = PIXI.Texture.from(base64Assets[keys[i]], {
        resolution: PIXI.settings.RESOLUTION,
      });
      PIXI.Texture.addToCache(texture, keys[i]);
    }
  }

  async buildLoadingScreen() {
    const uiData = configManager.getConfig("ui");
    const screensConfig = configManager.getConfig("screens");
    const screenList = screensConfig.list;
    const loadingScreenConfig = screenList.loadingScreen;

    // TODO - how do we handle custom ui like roulette but it uses the default loading screen and welcome screen
    // TODO - also how do we handle game client overrides here
    // perhaps LoadingScreenModules can be altered
    this.loadingScreen = new LoadingScreenModules[uiData.loadingScreenModule](
      loadingScreenConfig
    );
    this.currentScreen = "loadingScreen";
    this.screens[this.currentScreen] = this.loadingScreen;
    this.screens[loadingScreenConfig.id] = this.loadingScreen;
    this.screenWrapper.addChild(this.loadingScreen);
  }

  async preloadAssets() {
    debug.log("pre assets loading started....");

    const assets = configManager.getConfig("assetsPreLoad", false);
    await this.loader.loadAssets(
      assets,
      (percent) => {
        // this.updateProgressBarCallback(percent);
      },
      assets.cachingType,
      true // reportErrors
    );

    // this.updateProgressBarCallback(100, true);

    debug.log("assetsPreLoadedComplete");
  }

  async loadAssets() {
    debug.log("assets loading started....");

    const assets = configManager.getConfig("assets", false);
    await this.loader.loadAssets(
      assets,
      (percent) => {
        this.updateProgressBarCallback(percent);
      },
      assets.cachingType,
      true // reportErrors
    );

    this.updateProgressBarCallback(100, true);

    debug.log("assetsLoadedComplete");
  }

  updateProgressBarCallback(percent, ignore100 = false) {
    let perc = percent;
    if (!ignore100 && percent >= 100) {
      // never send 100 or more to the top bar until all assets have finished
      perc = 99;
    }

    debug.log(`loaded ${perc}%`);

    // Why isnt this in the loader, good question - speak to Stu !!!!!
    AppEventListener.dispatchEvent(
      eventsDictionary.assets.ASSETS_LOADING_PROGRESS,
      perc,
      this
    );

    this.sendUpdatesToTopBar({
      key: "ASSETS_LOADING_PROGRESS",
      value: perc,
    });
  }

  async setupScreenElements() {
    debug.log("setupScreenElements -- called");

    this.buildBackgrounds();
    this.buildBottomBar();
    await this.buildUI();
    await this.buildScreens();
    this.buildTopInfoBar();
    if (this.bottomBar) {
      if (!this.bottomBar.getParent()) {
        this.screenWrapper.addChild(this.bottomBar);
      }
    }
    await this.buildRotationScreen();
  }

  buildFreeRoundsMsgBox() {
    const freeRounds = this.gameState.getFreeRounds();
    if (
      freeRounds.isStartingFreeRounds() ||
      freeRounds.isActive() ||
      freeRounds.isFinished()
    ) {
      const freeRoundsMsgBoxData = configManager.getConfig("freeRoundsMsgBox");
      const uiData = configManager.getConfig("ui");
      if (FreeRoundsMsgBoxModules[uiData.freeRoundsMsgBoxModule]) {
        this.freeRoundsMsgBox = new FreeRoundsMsgBoxModules[
          uiData.freeRoundsMsgBoxModule
        ](freeRoundsMsgBoxData);
        // need to find out where the dialogMsgBox lives
        // and insert this before it, then the dialogMsgBox is always going to be above this
        const index = this.canvas.stage.children.indexOf(this.dialogMsgBox);
        this.canvas.stage.addChildAt(this.freeRoundsMsgBox, index);
      }
    }
  }

  buildMaxWinMsgBox() {
    const maxWinMsgBoxData = configManager.getConfig("maxWinMsgBox");
    this.maxWinMsgBox = CreationFactory.create(
      maxWinMsgBoxData.type,
      maxWinMsgBoxData
    );

    // need to find out where the dialogMsgBox lives
    // and insert this before it, then the dialogMsgBox is always going to be above this
    const index = this.canvas.stage.children.indexOf(this.dialogMsgBox);
    this.canvas.stage.addChildAt(this.maxWinMsgBox, index);
  }

  buildDialogMsgBox() {
    const dialogMsgBoxData = configManager.getConfig("dialogMsgBox");
    this.dialogMsgBox = CreationFactory.create(
      dialogMsgBoxData.type,
      dialogMsgBoxData
    );
    this.canvas.stage.addChild(this.dialogMsgBox);
  }

  // Methods related to parser and parser callback
  async sendInitRequest() {
    await this.connection.sendInitRequest();
  }

  async getGameHistory() {
    const connectionData = configManager.getConfig("connection");
    if (connectionData.requestGameHistory === true) {
      await this.connection.requestGameHistory(connectionData.amountToRequest);
      await this.connection.requestGameHistoryTurns();
    }
  }

  setupSoundPlayer() {
    // pass in config
    const soundConfig = configManager.getConfig("soundPlayer");
    this.soundPlayer = CreationFactory.create(soundConfig.type, soundConfig);
  }

  setupGameFlow() {
    const flowInitData = Utils.merge(
      {
        config: this.config,
        connection: this.connection,
        gameUI: this.gameUI,
        screens: this.screens,
        game: this,
        freeRoundsManager: this.freeRoundsManager,
      },
      configManager.getConfig("gameFlow")
    );

    this.gameFlow = this.createNewGameFlow(flowInitData.type, flowInitData);
  }

  // eslint-disable-next-line class-methods-use-this
  createNewGameFlow(type, initData) {
    return CreationFactory.create(type, initData);
  }

  // Stake Event Handlers
  // eslint-disable-next-line class-methods-use-this
  stakeChanged(val) {
    // debug.log(` Stake Change received in Game ${val}`);
  }

  // eslint-disable-next-line class-methods-use-this
  stakePanelOpened(val) {
    // debug.log(` Stake Panel Opened in Game ${val}`);
  }

  // eslint-disable-next-line class-methods-use-this
  stakePanelOKPressed(val) {
    // debug.log(` Stake Panel OK pressed in Game ${val}`);
  }

  soundStatusChanged(val) {
    this.sendUpdatesToTopBar({
      key: "GAME_SOUND",
      value: val,
    });
    debug.log(` Sound Status Changed in Game ${val}`);
  }

  settingsPanelOpened(eventData) {
    // debug.log(" settingsPanelOpened in Game");
  }

  settingsPanelClosed(eventData) {
    // debug.log(" settingsPanelClosed in Game");
  }

  spinClicked() {
    debug.log(" spinClicked in Game");
    this.startPlay();
  }

  // Event handlers
  windowFocusHandler(eventData) {
    // debug.log("Window Focus event received in game.js.");
  }

  windowBlurHandler(eventData) {
    // debug.log("Window Blur event received in game.js.");
  }

  autoplayOpen(eventData) {
    // debug.log("autoplayOpen received in game.js");
    this.pauseJackpotTimer();
  }

  autoplayOkPressed(eventData) {
    // debug.log("autoplayOkPressed received in game.js");
  }

  autoplayCancelled(eventData) {
    // debug.log("autoplayCancelled received in game.js");
    this.restartJackpotTimer();
  }

  listenForRendererUpdates() {
    this.canvas.ticker.minFPS = 1;
    this.lowFpsMode();
    this.canvas.ticker.add(this.update, this);
  }

  setUpScreenCallbacks() {
    const uiData = configManager.getConfig("ui");
    if (this.screens.length > -1 && this.screens.reelScreen) {
      this.screens.reelScreen.setWinUpdateCallBack((win) => {
        this.setWinText(win);
      });
      this.screens.reelScreen.setCloseSpinCallBack((abortSpin) => {
        this.stopPlay(abortSpin);
      });
      if (uiData.showWinPanel) {
        this.screens.reelScreen.setShowWinPanelCallBack(() => {
          this.gameUI.showWinLinePanel(this.gameUI);
        });
        this.screens.reelScreen.setHideWinPanelCallBack(() => {
          this.gameUI.hideWinLinePanel(this.gameUI);
        });
      }
    }
  }

  setWinText(win) {
    if (win === undefined) {
      win = "";
    }
    this.sendUpdatesToTopBar({
      key: "GAME_WIN_UPDATE",
      value: win,
    });
    this.gameUI.setWinText(win);
  }

  startGame() {
    if (this.fullScreenAPI) {
      this.fullScreenAPI.enableSwipeDetection();
    }
    const vibrateData = configManager.getConfig("vibrate");

    if (vibrateData.enabled !== false) {
      Vibrate.initialise();
    }

    const screenData = configManager.getConfig("screens");
    this.mainScreen = screenData.init.mainScreen;
    const gameCfg = configManager.getConfig("connection");
    if (gameCfg.gameType !== "slotmasters") {
      this.setUpScreenCallbacks();
    }
    this.screenWrapper.visible = true;
    if (screenData.init.startScreen) {
      this.lastScreen = this.currentScreen;
      this.screens[this.lastScreen].hide();
      this.currentScreen = screenData.init.startScreen;
      this.screens[this.currentScreen].setCallbackWhenChoiceMade(
        this.hideStartScreen.bind(this)
      );
      this.screens[this.currentScreen].show();

      if (this.fullScreenAPI) {
        const config = configManager.getConfig("fullScreenApi");
        if (config.enabled && config.autoFullScreen === true) {
          this.fullScreenAPI.listenForTouchEventForAutoFullScreen();
        }
      }
    } else {
      // TODO: issue with locked audio
      this.startMainGame();
    }
  }

  async hideStartScreen() {
    await this.soundDriver.waitForSoundsToUnlock();

    const gameCfg = configManager.getConfig("game");
    if (gameCfg.gameType === "slotmasters") {
      await this.connection.sendReadyRequest();
      this.setupGameFlow();
      this.setUpScreenCallbacks();
    }

    if (this.errorManager.isErrorOccured() === false) {
      this.startMainGame();
    }
  }

  startMainGame() {
    const screenData = configManager.getConfig("screens", false);
    this.lastScreen = this.currentScreen;
    this.currentScreen = this.mainScreen; // 'reelScreen';
    if (screenData.init.welcomeTransitionFade) {
      if (screenData.init.ignoreBackgroundFadeOnWelcomeTransition !== true) {
        this.backgroundsContainer.alpha = 0;
      }
      this.screens[this.currentScreen].alpha = 0;
      this.gameUI.alpha = 0;
      if (this.topInfoBar) {
        this.topInfoBar.alpha = 0;
      }
    }
    this.gameUI.visible = true;
    this.backgroundsContainer.visible = true;
    if (this.topInfoBar) {
      this.topInfoBar.visible = true;
    }

    this.gameState.broadcastAdjustedBalance();
    this.gameState.broadcastAdjustedTotalWin();

    if (this.gameState.isGIP() === true) {
      this.gameFlow.prepareForGIP();
      // perhaps this could alter this.currentScreen for gip?
    }

    this.screens[this.currentScreen].show();
    this.screens[this.currentScreen].enter();

    if (screenData.init.welcomeTransitionFade) {
      this.normalFpsMode();

      if (this.topInfoBar) {
        gsap.to(this.topInfoBar, { alpha: 1, duration: 1 });
      }
      if (screenData.init.ignoreBackgroundFadeOnWelcomeTransition !== true) {
        gsap.to(this.backgroundsContainer, { alpha: 1, duration: 1 });
      }
      gsap.to(this.gameUI, { alpha: 1, duration: 1 }); // will fade in background but not the buttons
      gsap.to(this.screens[this.currentScreen], {
        duration: 1,
        onComplete: () => {
          this.welcomeTransitionComplete();
        },
        alpha: 1,
      });
    } else {
      this.welcomeTransitionComplete();
    }
  }

  welcomeTransitionComplete() {
    debug.log("welcome transition complete");
    this.screens[this.lastScreen].hide();
    this.lowFpsMode();

    // this may move
    if (configManager.getConfig("game", false).hasJackpot === true) {
      this.jackpotTimer = this.timerManager.addTimer({
        duration: configManager.getConfig("timings", false).jackpotTimer,
        oneShot: false,
        autoStart: false,
        id: "jackpotTimer",
        callbackWhenFinished: () => {
          this.jackpotTimerExpired();
        },
      });
    }

    AppEventListener.dispatchEvent(
      eventsDictionary.game.GAME_READY,
      null,
      this
    );

    if (this.gameState.isGIP()) {
      this.gameStarted = true;
      this.sendUpdatesToTopBar({
        key: "GIP_MESSAGE",
        value: "GIP_MESSAGE",
      });

      // i dont think we need to worry about free rounds when in GIP
    } else {
      if (this.freeRoundsManager.isStarting() === true) {
        this.freeRoundsManager.presentStartingPopup(() => {
          this.weAreReady();
        });
      } else if (
        this.gameState.isFreeRoundsActive() === true ||
        this.gameState.isFreeRoundsFinished() === true
      ) {
        this.freeRoundsManager.presentResumingPopup(() => {
          this.weAreReady();
        });
      } else {
        this.weAreReady();
      }
    }
  }

  weAreReady() {
    if (configManager.getConfig("introPanel", false).enabled === false) {
      this.gameUI.fadeInButtons();
      this.restartJackpotTimer();
      AppEventListener.dispatchEvent(
        eventsDictionary.game.GAME_TOPBAR_ENABLE_BUTTONS,
        null,
        this
      );
    } else {
      this.onGameIntroPanelRemovedCB = () => {
        this.onGameIntroPanelRemoved();
      };
      AppEventListener.addEventListener(
        eventsDictionary.game.GAME_INTRO_PANEL_REMOVED,
        this.onGameIntroPanelRemovedCB
      );
    }
    this.screens[this.currentScreen].ready();
  }

  onGameIntroPanelRemoved() {
    if (this.introPanelHasBeenRemoved === false) {
      this.introPanelHasBeenRemoved = true;
      AppEventListener.removeEventListener(
        eventsDictionary.game.GAME_INTRO_PANEL_REMOVED,
        this.onGameIntroPanelRemovedCB
      );
      this.onGameIntroPanelRemovedCB = null;
      this.gameUI.fadeInButtons();
      this.restartJackpotTimer();
      AppEventListener.dispatchEvent(
        eventsDictionary.game.GAME_TOPBAR_ENABLE_BUTTONS,
        null,
        this
      );
    }
  }

  startGIP() {
    AppEventListener.dispatchEvent(
      eventsDictionary.game.GAME_GIP_STARTED,
      null,
      this
    );
    this.bonusWinCount = 0;
    this.gameStarted = true;

    this.pauseJackpotTimer();

    this.normalFpsMode();

    this.bonusWinCount = 0;

    this.startPlay();
  }

  async sendUpdatesToTopBar(eventObject) {
    let results = AppEventListener.dispatchEvent(
      "GAME_TOPBAR_UPDATE",
      eventObject,
      this
    );

    results = results.filter((res) => {
      return Utils.isPromise(res);
    });
    if (results.length > 0) {
      await Promise.all(results);
    }
  }

  buildPreLoadBackgrounds() {
    const backgroundsData = configManager.getConfig("preLoadBackgrounds");
    if (backgroundsData) {
      // example config
      // "preLoadBackgrounds": {
      //     "welcomeScreenBackground" : {
      //         "type": "Sprite",
      //         "imageName": "gamebg",
      //         "x": 0,
      //         "y": 0,
      //         "visible" : false
      //     },
      //     "reelScreenBackground" : {
      //         "type": "Sprite",
      //         "imageName": "gamebg",
      //         "x": 0,
      //         "y": 0,
      //         "visible" : false
      //     },
      //     "freeSpinsBackground" : {
      //         "type": "Sprite",
      //         "imageName": "gamebg",
      //         "x": 0,
      //         "y": 0,
      //         "visible" : false
      //     }
      // },

      if (Object.keys(backgroundsData).length > 0) {
        CreationFactory.buildComponents(
          this.backgroundsContainer,
          backgroundsData,
          this.backgrounds
        );
        this.backgroundsContainer.visible = true;
      }
    }
    this.resizeBackgrounds();
  }

  buildBackgrounds() {
    const backgroundsData = configManager.getConfig("backgrounds");
    if (backgroundsData) {
      // example config
      // "backgrounds": {
      //     "welcomeScreenBackground" : {
      //         "type": "Sprite",
      //         "imageName": "gamebg",
      //         "x": 0,
      //         "y": 0,
      //         "visible" : false
      //     },
      //     "reelScreenBackground" : {
      //         "type": "Sprite",
      //         "imageName": "gamebg",
      //         "x": 0,
      //         "y": 0,
      //         "visible" : false
      //     },
      //     "freeSpinsBackground" : {
      //         "type": "Sprite",
      //         "imageName": "gamebg",
      //         "x": 0,
      //         "y": 0,
      //         "visible" : false
      //     }
      // },

      CreationFactory.buildComponents(
        this.backgroundsContainer,
        backgroundsData,
        this.backgrounds
      );
    }
    this.resizeBackgrounds();
  }

  async buildScreens() {
    const screensConfig = configManager.getConfig("screens");
    const gameCfg = configManager.getConfig("game");
    const { list } = screensConfig;
    const listKeys = Object.keys(list);

    for (let s = 0; s < listKeys.length; s++) {
      const screenConfig = list[listKeys[s]];

      if (listKeys[s] === "loadingScreen" || screenConfig.lateLoad === true) {
        // ignore this screen, this has already been created
        // or its to be created later on
      } else if (listKeys[s] === "welcomeScreen") {
        // welcome screen is now part of a UI
        // so we can have different welcomeScreens based on UI
        // TODO - how do we handle custom ui like roulette but it uses the default loading screen and welcome screen
        // TODO - also how do we handle game client overrides here
        // perhaps LoadingScreenModules can be altered
        const uiData = configManager.getConfig("ui");
        const screen = new WelcomeScreenModules[uiData.welcomeScreenModule](
          screenConfig
        );
        this.screenWrapper.addChild(screen);
        this.screens[listKeys[s]] = screen;
        this.screens[screenConfig.id] = screen;
      } else {
        screenConfig.gameUI = this.gameUI;
        const screen = CreationFactory.create(screenConfig.type, screenConfig);
        this.screenWrapper.addChild(screen);
        this.screens[listKeys[s]] = screen;
        this.screens[screenConfig.id] = screen;

        screen.init();
        screen.setCloseScreenCallBack(this.switchScreen.bind(this));
      }
    }
  }

  // async buildGameScreenForSlotMasters() {
  //     const screensConfig = configManager.getConfig("screens");
  //     const gameCfg = configManager.getConfig("game");
  //     const { list } = screensConfig;
  //     const listKeys = Object.keys(list);

  //     for (let s = 0; s < listKeys.length; s++) {
  //         const screenConfig = list[listKeys[s]];

  //         if (listKeys[s] === "gameScreen" && gameCfg.gameType === "slotmasters") {
  //             screenConfig.gameUI = this.gameUI;
  //             const screen = CreationFactory.create(screenConfig.type, screenConfig);
  //             this.screenWrapper.addChild(screen);
  //             this.screens[listKeys[s]] = screen;
  //             this.screens[screenConfig.id] = screen;
  //             screen.init();
  //             screen.setCloseScreenCallBack(this.switchScreen.bind(this));
  //         }
  //     }
  // }

  buildGameFrames() {
    const frameData = configManager.getConfig("gameFrames");
    this.gameFrames = {};
    if (frameData.enabled === true) {
      CreationFactory.buildComponents(
        this.frameContainer,
        frameData.layout,
        this.gameFrames,
        null
      );
    }
  }

  buildFrameGradients() {
    const frameGradientData = configManager.getConfig("frameGradients");
    this.frameGradients = {};
    if (frameGradientData.enabled === true) {
      CreationFactory.buildComponents(
        this.gradientContainer,
        frameGradientData.layout,
        this.frameGradients,
        null
      );
    }
  }

  buildBottomBar() {
    const bottomBarData = configManager.getConfig("bottomBar");
    if (Utils.isObject(bottomBarData) && bottomBarData.enabled === true) {
      const uiData = configManager.getConfig("ui");
      if (BottomBarModules[uiData.bottomBarModule] !== null) {
        this.bottomBar = new BottomBarModules[uiData.bottomBarModule](
          bottomBarData
        );
      }
    }
  }

  buildTopInfoBar() {
    const topInfoBarData = configManager.getConfig("topInfoBar", false);

    const showClock =
      DeviceManager.getUrlParam(
        "showClock",
        topInfoBarData.showClock === true ? "true" : "false"
      ) === "true";
    const showGameVersion =
      DeviceManager.getUrlParam(
        "showGameVersion",
        topInfoBarData.showGameVersion === true ? "true" : "false"
      ) === "true";
    const showGameName =
      DeviceManager.getUrlParam(
        "showGameName",
        topInfoBarData.showGameName === true ? "true" : "false"
      ) === "true";
    const showDisplayNetPosition =
      DeviceManager.getUrlParam(
        "netPosition",
        topInfoBarData.displayNetPosition === true ? "true" : "false"
      ) === "true";

    if (
      showDisplayNetPosition ||
      showClock ||
      showGameVersion ||
      showGameName
    ) {
      // turn this on as we have some info we need to show
      topInfoBarData.enabled = true;
    } else {
      // auto turn off the topinfo bar if non of the information is required?
      // should this be automatic?
      if (topInfoBarData.alwaysShowRegardlessOfContent !== true) {
        topInfoBarData.enabled = false;
      }
    }
    topInfoBarData.displayNetPosition = showDisplayNetPosition;
    topInfoBarData.showClock = showClock;
    topInfoBarData.showGameName = showGameName;
    topInfoBarData.showGameVersion = showGameVersion;

    if (topInfoBarData.enabled === true) {
      const uiData = configManager.getConfig("ui");
      if (TopInfoBarModules[uiData.topInfoBarModule] !== null) {
        this.topInfoBar = new TopInfoBarModules[uiData.topInfoBarModule](
          topInfoBarData
        );
        this.topInfoBar.visible = false;
        this.uiContainer.addChild(this.topInfoBar);
      }
    }
  }

  // eslint-disable-next-line class-methods-use-this
  // async addGameUIAssets() {
  //     // lets see which ui is required
  //     const uiData = configManager.getConfig("ui");

  //     if (uiData.uiType === "custom") {
  //         // nothing to do as far as we are concerned
  //     } else {
  //         const uiConfig = this.uiConfig;
  //         if (Utils.isObject(uiConfig.default)) {
  //             // get assets from configManager but only get the reference - no need for a copy
  //             let assets = configManager.getConfig("assets", false);
  //             // we pass the original again as 3rd param, so we keep the devs changes
  //             // eslint-disable-next-line no-unused-vars
  //             assets = Utils.merge(assets, uiConfig.default.assets, assets);
  //             // because merge always returns a new object, we need to merge this back into config manager
  //             // times like these i wish we still used jquery ;)
  //             configManager.storeAt(assets, "assets");
  //             // and thats the uiConfig.js merged
  //         }
  //     }
  // }

  async buildUI() {
    const uiData = configManager.getConfig("ui");
    uiData.gameVersion = this.gameVersion;
    uiData.gameName = this.gameName;
    uiData.bottomBar = this.bottomBar;
    //
    if (uiData.uiType === "custom") {
      uiData.ui.bottomBar = this.bottomBar;
      this.gameUI = CreationFactory.create(uiData.uiClass, uiData.ui);
      this.uiContainer.addChild(this.gameUI);
      this.gameUI.init(this.gameState);
    } else if (Utils.isUndefined(UIModules[uiData.uiType]) === false) {
      const helpData = configManager.getConfig("helpPages");

      this.gameUI = new UIModules[uiData.uiType](uiData, helpData);
      this.uiContainer.addChild(this.gameUI);

      this.gameUI.init(this.gameState);

      this.gameUI.setStartAutoPlayCallBack(this.startAutoPlay.bind(this));
      this.gameUI.setSetStakeCallBack(this.setStake.bind(this));

      // TODO:
      if (this.topBar && this.topBar.type !== "default") {
        const val = this.gameState.totalStake();

        this.sendUpdatesToTopBar({
          key: "GAME_STAKE_UPDATE",
          value: val,
        });
      }

      // this.gameUI.setWinShownCallBack(this.winShown.bind(this));
    }

    this.gameUI.setScreensBlurCallBack(this.blurScreens.bind(this));
    this.gameUI.setScreensUnBlurCallBack(this.unblurScreens.bind(this));
    this.gameUI.visible = false;
    this.gameState.storeAt(this.gameUI, "gameUI");
  }

  // eslint-disable-next-line class-methods-use-this
  rotationScreenRequired() {
    let result = true;

    if (
      this.graphicsDriver.landscapeAllowed &&
      this.graphicsDriver.portraitAllowed
    ) {
      result = false;
    } else if (!DeviceManager.isMobile()) {
      result = false;
    }

    return result;
  }

  buildRotationScreen() {
    if (this.rotationScreenRequired() === true) {
      this.rotationScreen = new RotationScreen({
        id: "rotationScreen",
        x: 0,
        y: 0,
      });
      this.canvas.stage.addChild(this.rotationScreen);
    }
  }

  update(delta) {
    this.deltaInfo.delta = delta;
    this.deltaInfo.deltaInMS = delta / PIXI.settings.TARGET_FPMS;
    this.deltaInfo.spineDelta = this.deltaInfo.deltaInMS * 0.001;
    if (this.pauseTimer) {
      this.deltaInfo.delta = 0;
      this.deltaInfo.deltaInMS = 0;
      this.deltaInfo.spineDelta = 0;
    }
    AppEventListener.dispatchEvent(
      eventsDictionary.game.GAME_TIME_DELTA_UPDATE,
      this.deltaInfo,
      this
    );

    if (!this.pauseTimer) {
      Vibrate.update(delta);

      if (this.particleManager) {
        // dont pass delta as this was causing some odd stuttering
        this.particleManager.update(this.gameSpeedModifier);
      }
      const screen = this.screens[this.currentScreen];
      if (screen) {
        screen.update(delta);
      }
      if (this.gameUI) {
        this.gameUI.update(delta);
      }
    }
  }

  restartJackpotTimer() {
    if (this.jackpotTimer) {
      debug.info("jackpotTimer restart");
      this.jackpotTimer.restart();
    }
  }

  pauseJackpotTimer() {
    if (this.jackpotTimer) {
      debug.info("jackpotTimer paused");
      this.jackpotTimer.pause();
    }
  }

  jackpotTimerExpired() {
    debug.info("jackpotTimerExpired");

    // we need to request a jackpot update, thats if this is how
    // its going to work on gamesys
  }

  jackpotUpdateComplete() {
    // this.updateProgressives();
    if (this.gameStarted !== true) {
      this.restartJackpotTimer();
    }
  }

  updateProgressives(data) {
    // if (this.gameState.isJackpotReadyToUpdate()) {
    //     this.screens.reelScreen.updateProgressives();
    // }
  }

  checkForResize(force = false) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (
      force === true ||
      width !== this.lastRecordedGameWidth ||
      height !== this.lastRecordedGameHeight
    ) {
      debug.log(`game size now width = ${width} height = ${height}`);
      debug.log(
        `game size was width = ${this.lastRecordedGameWidth} height = ${this.lastRecordedGameHeight}`
      );
      this.resize(width, height, force);
    }

    this.resizeCheckTimer.restart();
  }

  onWindowResize() {
    if (this.pausedForTopBar || this.gameSpeedModifier === 0) {
      this.resize();
    }
  }

  resize(
    width = window.innerWidth,
    height = window.innerHeight,
    force = false
  ) {
    this.graphicsDriver.resize(width, height);

    if (this.orientationLayoutManager) {
      if (this.orientationLayoutManager.screenResized(force)) {
        // new layout has been applied
        this.maskScreens();
        // new layout can change the design size in the render
        // so we need to resize the renderer again
        this.graphicsDriver.resize(width, height);
      }
    }

    this.pickAlignment();
    this.resizeBackgrounds();
    this.resizeAndScaleScreenAndAlignmentContainer();

    if (this.freeRoundsMsgBox) {
      this.freeRoundsMsgBox.resize(this.graphicsDriver.rendererScaleData);
    }
    if (this.maxWinMsgBox) {
      this.maxWinMsgBox.resize(this.graphicsDriver.rendererScaleData);
    }
    if (this.dialogMsgBox) {
      this.dialogMsgBox.resize(this.graphicsDriver.rendererScaleData);
    }

    if (this.rotationScreen) {
      this.rotationScreen.resize();
    }

    if (this.gameUI) {
      this.gameUI.resize();
    }

    if (!this.paused) {
      // now all that is resized, are we in an allowed orientation?
      if (
        this.graphicsDriver.areWeInAllowedOrientation() === false &&
        this.rotationScreen
      ) {
        if (this.rotationScreen) {
          this.rotationScreen.show();
        }
        if (this.screens[this.currentScreen]) {
          this.screens[this.currentScreen].hide();
        }

        if (this.timerManager) {
          this.timerManager.pauseForOrientation();
        }
        if (this.particleManager) {
          this.particleManager.pauseForOrientation();
        }
        Vibrate.pauseForOrientation();
        this.soundDriver.pauseForOrientation();

        this.setGameSpeedModifier(0);

        if (this.gameUI.inAutoPlay()) {
          this.gameUI.stopAutoplay();
        }
        this.pauseTimer = true;
      } else {
        if (this.rotationScreen) {
          this.rotationScreen.hide();
        }
        if (this.screens[this.currentScreen]) {
          this.screens[this.currentScreen].show(true);
        }
        if (this.timerManager) {
          this.timerManager.resumeForOrientation();
        }
        if (this.particleManager) {
          this.particleManager.resumeForOrientation();
        }
        Vibrate.resumeForOrientation();
        this.soundDriver.resumeForOrientation();
        this.pauseTimer = false;

        this.setGameSpeedModifier(1);
      }
    }

    this.gameResizedEventData.rendererScaleData =
      this.graphicsDriver.rendererScaleData;
    AppEventListener.dispatchEvent(
      eventsDictionary.game.GAME_RESIZED,
      this.gameResizedEventData,
      this
    );

    this.lastRecordedGameWidth = width;
    this.lastRecordedGameHeight = height;
  }

  pickAlignment() {
    // alignments: {
    //     landscape: { x: 0.5, y: 0.5 },
    //     portrait: { x: 0.5, y: 0.5 },
    //     falsePortrait: { x: 0.5, y: 0.1 }, // portrait but game stays in landscape mode and ui moves under the screens
    // },
    const alignments = configManager.getConfig("alignments", false);
    this.currentAlignment = alignments.landscape;

    // we can fill this out here picking out which is the best alignment for the screen size
    // based on which options are enabled, e.g. falsePortrait mode and in portrait
  }

  resizeBackgrounds() {
    // if we have multiple backgrounds, make sure they are all resized
    const resAdjustment = this.graphicsDriver.resolutionScale === 1 ? 1 : 0.5;
    const width = this.graphicsDriver.getCanvasWidth() * resAdjustment;
    const height = this.graphicsDriver.getCanvasHeight() * resAdjustment;
    const { rendererScaleData } = this.graphicsDriver;
    const middleScreenX = rendererScaleData.currentWidth / 2;
    const middleScreenY = rendererScaleData.currentHeight / 2;
    // get the biggest scale for quartered backgrounds
    const scale =
      rendererScaleData.currentToOriginalScaleW >
      rendererScaleData.currentToOriginalScaleH
        ? rendererScaleData.currentToOriginalScaleW
        : rendererScaleData.currentToOriginalScaleH;

    if (Utils.isObject(this.backgrounds)) {
      const keys = Object.keys(this.backgrounds);
      for (let i = 0; i < keys.length; i++) {
        const background = this.backgrounds[keys[i]];

        if (background instanceof QuarteredBackground) {
          // should all backgrounds be done this way?
          background.x = middleScreenX;
          background.y = middleScreenY;
          background.scale.set(scale, scale);
        } else if (background.ignoreFrameworkResize !== true) {
          background.width = width;
          background.height = height;
        }
      }
    }
  }

  resizeAndScaleScreenAndAlignmentContainer() {
    const scaleData = this.graphicsDriver.rendererScaleData;
    if (this.screenScaleAndAlignmentContainer) {
      this.screenScaleAndAlignmentContainer.x =
        (scaleData.currentWidth - scaleData.scaledOriginalWidth) *
        this.currentAlignment.x;
      this.screenScaleAndAlignmentContainer.y =
        (scaleData.currentHeight - scaleData.scaledOriginalHeight) *
        this.currentAlignment.y;
      this.screenScaleAndAlignmentContainer.scale.x = scaleData.scale;
      this.screenScaleAndAlignmentContainer.scale.y = scaleData.scale;
    }
  }

  blurScreens(blur) {
    this.screens[this.currentScreen].blurScreen(blur);
  }

  unblurScreens() {
    this.screens[this.currentScreen].unBlurScreen();
  }

  switchScreen(screenToOpen) {
    this.screens[this.currentScreen].hide();
    this.currentScreen = screenToOpen;
    this.screens[this.currentScreen].show();
  }

  stopPlay(abortSpin) {
    // this should only ever be called now if an error has occured, e.g. insufficient funds
    if (!abortSpin) {
      // old flow
      // this.showBonusWin();
    } else {
      // if (this.errorManager.jackpotWonByAnother()) {
      //     debug.log("JWBA - detected");

      //     if (!this.gameState.inFreeSpins()) {
      //         debug.log("JWBA - request jackpot update");
      //         this.parser.setJackpotUpdateCompleteCallBack(() => {
      //             this.jackpotWonByAnotherUpdateComplete();
      //         });
      //         this.parser.sendJackpotUpdateRequest();
      //     } else {
      //         debug.log("JWBA - in free spins though so dont care");
      //         this.closeResponse();
      //     }
      // } else {
      // }
      this.closeResponse();
    }
  }

  // jackpotWonByAnotherUpdateComplete() {
  //     debug.log("JWBA - jackpot request back");
  //     // put the callback back
  //     this.parser.setJackpotUpdateCompleteCallBack(() => {
  //         this.jackpotUpdateComplete();
  //     });
  //     this.updateProgressives();
  //     this.closeResponse();
  // }

  // showBonusWin() {
  //     if (this.errorManager.isErrorOccured()) {
  //         this.sendCloseRequest();
  //     } else {
  //         const scatterWin = []; // this.gameState.getWinScatterWins();
  //         if (scatterWin.length > 0 && scatterWin.length > this.bonusWinCount) {
  //             AppEventListener.dispatchEvent(eventsDictionary.autoplay.STOP_AUTOPLAY);
  //             this.screens[this.currentScreen].showScatterWin(scatterWin[this.bonusWinCount]);
  //             this.bonusWinCount += 1;
  //         } else {
  //             this.sendCloseRequest();
  //         }
  //     }
  // }

  // sendCloseRequest() {
  //     // localhost/barkingdeluxe/index.html
  //     // HoneyPot.logger.log('close Play');

  //     const totalWin = this.gameState.totalWinnings({ includeJackpots: false });
  //     // totalWin -= this.gameState.totalProgressiveWinnings();

  //     if (this.gameState.inFreeSpins()) {
  //         if (this.gameUI.inAutoPlay()) {
  //             this.gameUI.stopAutoplay();
  //         }
  //         if (this.gameState.lastFreeSpin() <= 0) {
  //             this.gameState.clearFreeSpins();
  //             this.screens[this.currentScreen].endFreeSpins(this.closeFreeSpins.bind(this));
  //             this.gameUI.buttonPanelUI.alpha = 0;
  //             this.gameUI.disableButtons();
  //             this.gameUI.hideFreeSpins();
  //         } else {
  //             if (this.topBar) {
  //                 this.sendUpdatesToTopBar({
  //                     key: "GAME_WIN_UPDATE",
  //                     value: totalWin,
  //                 });
  //             }

  //             this.gameUI.showFreeSpins(this.gameState.getTrueFreeSpins() - 1);
  //             this.startPlay();
  //         }
  //     } else if (totalWin > 0 && !this.errorManager.isErrorOccured()) {
  //         this.setWinText(totalWin);
  //     } else {
  //         this.parser.sendCloseRequest(this.closeResponse.bind(this));
  //     }
  // }

  closeResponse() {
    this.screens[this.currentScreen].closeResponseReceived();

    this.gameStarted = false;
  }

  // eslint-disable-next-line class-methods-use-this
  winShown() {
    // this.parser.sendCloseRequest(this.closeResponse.bind(this));
  }

  setStake(val) {
    this.sendUpdatesToTopBar({
      key: "GAME_STAKE_UPDATE",
      value: val,
    });
  }

  startAutoPlay() {
    AppEventListener.dispatchEvent(
      eventsDictionary.autoplay.AUTOPLAY_STARTED,
      null,
      this
    );
    this.startPlay();
  }

  async startPlay() {
    this.bonusWinCount = 0;
    this.gameStarted = true;

    this.pauseJackpotTimer();

    this.normalFpsMode();

    // disable control panel
    this.pauseJackpotTimer();

    await this.gameFlow.start();

    this.restartJackpotTimer();

    // not the best name to describe enabling the control panel
    // enable control panel
    this.gameUI.closeComplete();
  }

  infoPanelOpened(val) {
    this.sendUpdatesToTopBar({
      key: "GAME_HELP",
      value: val,
    });
  }

  infoPanelClosed(val) {
    this.sendUpdatesToTopBar({
      key: "GAME_HELP",
      value: val,
    });
  }

  playResponseReceived() {
    if (this.errorManager.isErrorOccured()) {
      if (this.gameUI.inAutoPlay()) {
        this.gameUI.stopAutoplay();
      }
      this.screens[this.currentScreen].stopSpinError();
    } else {
      let includeJackpotWinnings = true;
      if (
        this.gameState.isGIP() === true &&
        this.gameState.inFreeSpins() === true
      ) {
        // we won a jackpot then triggered free spins
        // during gip the jackpot is included again in total win
        includeJackpotWinnings = false;
      }
      const totalWin = this.gameState.totalWinnings({
        includeJackpots: includeJackpotWinnings,
      });
      this.screens[this.currentScreen].playResponseReceived();
    }
  }

  closeFreeSpins() {
    const totalWin = this.gameState.totalWinnings({ includeJackpots: false });

    if (totalWin > 0) {
      this.gameUI.showTotalWin(totalWin);
    } else {
      this.parser.sendCloseRequest(this.closeResponse.bind(this));
    }
  }

  // CHAIN GAME Specific functions - please use the below functions only,
  // if your game has the Chain Game

  sendChainGameInitRequest() {
    debug.log(" Game - sendInitChainGame ");
    this.parser.sendChainGameInitRequest();
  }

  onInitChainGameParseComplete(data) {
    debug.log(" onInitChainGameParseComplete ---- ", data);
    // if (data.initChainGameResponse.masterState.gameState === "F") {
    //     this.sendCloseRequest();
    // }
    // this.showBonusWin()
  }

  onBetChainGameParseComplete() {
    debug.log(" onBetChainGameParseComplete ---- ");
    // this.showBonusWin()
  }

  onPlayChainGameParseComplete() {
    debug.log(" onPlayChainGameParseComplete ---- ");
    // this.showBonusWin()
  }

  onCollectChainGameParseComplete() {
    debug.log(" onCollectChainGameParseComplete ---- ");
    // this.showBonusWin()
  }

  onCloseChainGameParseComplete() {
    debug.log(" onCloseChainGameParseComplete ---- ");
    // this.showBonusWin()
    this.sendCloseRequest();
  }

  lowFpsMode() {
    if (!this.lowFpsIdleTimer) {
      this.lowFpsIdleTimer = this.timerManager.addTimer({
        callbackWhenFinished: () => {
          if (
            this.ignoreLowFpsMode !== true &&
            this.disableLowFpsMode !== true
          ) {
            this.applyLowFpsMode();
          }
        },
        duration: 5000,
        oneShot: false,
        autoStart: false,
        id: "lowFpsIdleTimer",
        speedModifier: 1,
      });
    }
    if (!this.gameState.isGIP()) {
      this.lowFpsIdleTimer.restart();
      this.ignoreLowFpsMode = false;
    }
  }

  normalFpsMode() {
    // keeping original name for backwards compatability
    this.applyNormalFpsMode();
  }

  applyLowFpsMode() {
    if (this.canvas.ticker.maxFPS !== this.gameMinFPS) {
      debug.log(`FPS now ${this.gameMinFPS}`);
      // this.particleManager.setLowFPSCorrectionModifier(this.gameMinFPS / this.gameMaxFPS);
      this.particleManager.setLowFPSCorrectionModifier(1);
      AppEventListener.dispatchEvent(
        eventsDictionary.game.GAME_LOW_FPS_MODE_ACTIVATED,
        this.gameMinFPS,
        this
      );
    }
    this.canvas.ticker.maxFPS = this.gameMinFPS;
    gsap.ticker.fps(this.gameMinFPS);
  }

  applyNormalFpsMode() {
    if (this.canvas.ticker.maxFPS !== this.gameMaxFPS) {
      debug.log(`FPS now ${this.gameMaxFPS}`);
      AppEventListener.dispatchEvent(
        eventsDictionary.game.GAME_NORMAL_FPS_MODE_ACTIVATED,
        this.gameMaxFPS,
        this
      );
    }
    this.ignoreLowFpsMode = true;
    this.lowFpsIdleTimer.pause();
    this.canvas.ticker.maxFPS = this.gameMaxFPS;
    this.particleManager.setLowFPSCorrectionModifier(1);
    gsap.ticker.fps(this.gameMaxFPS);
  }

  setGameSpeedModifier(speedModifier = 1) {
    if (Utils.isNumber(speedModifier)) {
      this.gameSpeedModifier = this.restrictMaxGameSpeed(speedModifier);
      this.timerManager.setSpeedModifier(this.gameSpeedModifier);
      PIXI.Ticker.shared.speed = this.gameSpeedModifier;
      this.canvas.ticker.speed = this.gameSpeedModifier;
      gsap.globalTimeline.timeScale(this.gameSpeedModifier);
      if (this.soundDriver) {
        this.soundDriver.setSpeedModifier(this.gameSpeedModifier);
      }
    }
  }

  // eslint-disable-next-line class-methods-use-this
  restrictMaxGameSpeed(speedModifier) {
    return Maths.clamp(speedModifier, 0, 1);
  }

  pauseForTopBar() {
    this.pausedForTopBar = true;
    this.pause();
  }

  resumeForTopBar() {
    this.pausedForTopBar = false;
    this.resume();
  }

  pauseForRealityCheck() {
    this.pausedForRealityCheck = true;
    this.pause();
  }

  resumeForRealityCheck() {
    this.pausedForRealityCheck = false;
    this.resume();
  }

  pause() {
    if (!this.paused) {
      this.paused = true;
      this.unPausedGameSpeedModifier = this.gameSpeedModifier;
      this.setGameSpeedModifier(0);
      if (this.soundDriver) {
        this.soundDriver.gamePause();
      }
    }
  }

  resume() {
    if (!this.pausedForTopBar && !this.pausedForRealityCheck) {
      if (this.paused === true) {
        this.setGameSpeedModifier(this.unPausedGameSpeedModifier);
        if (this.soundDriver) {
          this.soundDriver.gameResume();
        }
        this.paused = false;
        this.checkForResize(true);
      }
    }
  }

  handleVisibilityChange(data) {
    if (data[0] === "hidden") {
      if (this.gameUI) {
        if (this.gameUI.inAutoPlay()) {
          this.gameUI.stopAutoplay();
        }
      }
    }
  }
}
/*
const game = new Game();
game.init(); */

// Some Quick notes and reference
// Can be moved to JS Doc later or wiki later
// window.game = game; // just to expose into chrome console for debugging

// Dispatching Events
// AppEventListener.dispatchEvent("GAME_READY", "Bharath", this);

// Way to handle the dispatched events
// AppEventListener.addEventListener("GAME_READY", this.testHandler);
