// Type definitions for game constants
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

// Utility constants and helper values
export const Constants = {
    // Fish states
    FISH_STATE: {
        IDLE: 'idle' as const,
        INTERESTED: 'interested' as const,
        CHASING: 'chasing' as const,
        STRIKING: 'striking' as const,
        FLEEING: 'fleeing' as const,
        HUNTING_BAITFISH: 'hunting_baitfish' as const,
        FEEDING: 'feeding' as const
    },

    // Lure states
    LURE_STATE: {
        SURFACE: 'surface' as const,
        DROPPING: 'dropping' as const,
        RETRIEVING: 'retrieving' as const,
        IDLE: 'idle' as const
    },

    // Sonar display modes
    SONAR_MODE: {
        NORMAL: 'normal' as const,
        ENHANCED: 'enhanced' as const,
        BOTTOM_LOCK: 'bottom_lock' as const
    },

    // Fish sizes (affects sonar signature)
    FISH_SIZE: {
        SMALL: { min: 2, max: 5, points: 10 } as FishSize,
        MEDIUM: { min: 5, max: 12, points: 25 } as FishSize,
        LARGE: { min: 12, max: 25, points: 50 } as FishSize,
        TROPHY: { min: 25, max: 40, points: 100 } as FishSize
    },

    // Depth zones for Lake Champlain
    DEPTH_ZONE: {
        SURFACE: { min: 0, max: 15, name: 'Surface' } as DepthZone,
        THERMOCLINE: { min: 15, max: 35, name: 'Thermocline' } as DepthZone,
        MIDDLE: { min: 35, max: 80, name: 'Mid-Water' } as DepthZone,
        DEEP: { min: 80, max: 120, name: 'Deep Structure' } as DepthZone,
        BOTTOM: { min: 120, max: 150, name: 'Bottom' } as DepthZone
    }
} as const;

// Helper functions
export const Utils = {
    depthToPixels: (depth: number, scale: number): number => {
        return depth * scale;
    },

    pixelsToDepth: (pixels: number, scale: number): number => {
        return pixels / scale;
    },

    getDepthZone: (depth: number): DepthZone => {
        for (const zone of Object.values(Constants.DEPTH_ZONE)) {
            if (depth >= zone.min && depth < zone.max) {
                return zone;
            }
        }
        return Constants.DEPTH_ZONE.BOTTOM;
    },

    randomBetween: (min: number, max: number): number => {
        return Math.random() * (max - min) + min;
    },

    calculateDistance: (x1: number, y1: number, x2: number, y2: number): number => {
        // Use Phaser's optimized distance calculation
        return Phaser.Math.Distance.Between(x1, y1, x2, y2);
    },

    // Calculate distance between two objects with x/y properties
    calculateDistanceBetweenObjects: (obj1: Position, obj2: Position): number => {
        return Phaser.Math.Distance.Between(obj1.x, obj1.y, obj2.x, obj2.y);
    }
};

export default Constants;
