export default config;
declare namespace config {
    export let type: any;
    export { actualWidth as width };
    export { actualHeight as height };
    export let parent: string;
    export let backgroundColor: number;
    export let banner: boolean;
    export namespace physics {
        let _default: string;
        export { _default as default };
        export namespace arcade {
            namespace gravity {
                let y: number;
            }
            let debug: boolean;
        }
    }
    export let scene: (typeof BootScene | typeof MenuScene | typeof GameScene | typeof GameOverScene | typeof UIScene | typeof WaterColumn | typeof InfoBar | typeof GameHUD)[];
    export namespace render {
        let pixelArt: boolean;
        let antialias: boolean;
        let transparent: boolean;
    }
    export namespace scale {
        export let mode: any;
        export let autoCenter: any;
        export { actualWidth as width };
        export { actualHeight as height };
        let parent_1: string;
        export { parent_1 as parent };
    }
    export namespace input {
        let keyboard: boolean;
        let mouse: boolean;
        let touch: boolean;
        let gamepad: boolean;
    }
    export namespace audio {
        let disableWebAudio: boolean;
    }
    export namespace fps {
        let target: number;
        let forceSetTimeOut: boolean;
    }
}
declare const actualWidth: number;
declare const actualHeight: number;
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import UIScene from './scenes/UIScene.js';
import WaterColumn from './scenes/WaterColumn.js';
import InfoBar from './scenes/InfoBar.js';
import GameHUD from './scenes/GameHUD.js';
//# sourceMappingURL=index.d.ts.map