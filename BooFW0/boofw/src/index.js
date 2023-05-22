import { Game } from "./game"; //5
import ReelScreen from "./display/screens/reelScreen"; //17
import Screen from "./display/core/screen"; //26
import Container from "./display/core/container"; //27
import CreationFactory from "./helpers/creationFactory"; //30
import Utils from "./utils/utils"; //61
import ConfigManager from "./config/configManager"; //74

export const configManager = new ConfigManager();

export { Game, ReelScreen, Screen, Container, CreationFactory, Utils };
