export type FishState = 'idle' | 'interested' | 'chasing' | 'striking' | 'fleeing' | 'hunting_baitfish' | 'feeding';
export type LureState = 'surface' | 'dropping' | 'retrieving' | 'idle';
export type SonarMode = 'normal' | 'enhanced' | 'bottom_lock';
export type FishSizeCategory = 'SMALL' | 'MEDIUM' | 'LARGE' | 'TROPHY';
export type DepthZoneName = 'SURFACE' | 'THERMOCLINE' | 'MIDDLE' | 'DEEP' | 'BOTTOM';
export interface FishSize {
    min: number;
    max: number;
    points: number;
}
export interface DepthZone {
    min: number;
    max: number;
    name: string;
}
export interface Position {
    x: number;
    y: number;
}
export declare const Constants: {
    readonly FISH_STATE: {
        readonly IDLE: "idle";
        readonly INTERESTED: "interested";
        readonly CHASING: "chasing";
        readonly STRIKING: "striking";
        readonly FLEEING: "fleeing";
        readonly HUNTING_BAITFISH: "hunting_baitfish";
        readonly FEEDING: "feeding";
    };
    readonly LURE_STATE: {
        readonly SURFACE: "surface";
        readonly DROPPING: "dropping";
        readonly RETRIEVING: "retrieving";
        readonly IDLE: "idle";
    };
    readonly SONAR_MODE: {
        readonly NORMAL: "normal";
        readonly ENHANCED: "enhanced";
        readonly BOTTOM_LOCK: "bottom_lock";
    };
    readonly FISH_SIZE: {
        readonly SMALL: FishSize;
        readonly MEDIUM: FishSize;
        readonly LARGE: FishSize;
        readonly TROPHY: FishSize;
    };
    readonly DEPTH_ZONE: {
        readonly SURFACE: DepthZone;
        readonly THERMOCLINE: DepthZone;
        readonly MIDDLE: DepthZone;
        readonly DEEP: DepthZone;
        readonly BOTTOM: DepthZone;
    };
};
export declare const Utils: {
    depthToPixels: (depth: number, scale: number) => number;
    pixelsToDepth: (pixels: number, scale: number) => number;
    getDepthZone: (depth: number) => DepthZone;
    randomBetween: (min: number, max: number) => number;
    calculateDistance: (x1: number, y1: number, x2: number, y2: number) => number;
    calculateDistanceBetweenObjects: (obj1: Position, obj2: Position) => number;
};
export default Constants;
//# sourceMappingURL=Constants.d.ts.map