// Utility constants and helper values
export const Constants = {
    // Fish states
    FISH_STATE: {
        IDLE: 'idle',
        INTERESTED: 'interested',
        CHASING: 'chasing',
        STRIKING: 'striking',
        FLEEING: 'fleeing',
        HUNTING_BAITFISH: 'hunting_baitfish',
        FEEDING: 'feeding'
    },
    
    // Lure states
    LURE_STATE: {
        SURFACE: 'surface',
        DROPPING: 'dropping',
        RETRIEVING: 'retrieving',
        IDLE: 'idle'
    },
    
    // Sonar display modes
    SONAR_MODE: {
        NORMAL: 'normal',
        ENHANCED: 'enhanced',
        BOTTOM_LOCK: 'bottom_lock'
    },
    
    // Fish sizes (affects sonar signature)
    FISH_SIZE: {
        SMALL: { min: 2, max: 5, points: 10 },
        MEDIUM: { min: 5, max: 12, points: 25 },
        LARGE: { min: 12, max: 25, points: 50 },
        TROPHY: { min: 25, max: 40, points: 100 }
    },
    
    // Depth zones for Lake Champlain
    DEPTH_ZONE: {
        SURFACE: { min: 0, max: 15, name: 'Surface' },
        THERMOCLINE: { min: 15, max: 35, name: 'Thermocline' },
        MIDDLE: { min: 35, max: 80, name: 'Mid-Water' },
        DEEP: { min: 80, max: 120, name: 'Deep Structure' },
        BOTTOM: { min: 120, max: 150, name: 'Bottom' }
    }
};

// Helper functions
export const Utils = {
    depthToPixels: (depth, scale) => {
        return depth * scale;
    },
    
    pixelsToDepth: (pixels, scale) => {
        return pixels / scale;
    },
    
    getDepthZone: (depth) => {
        for (const zone of Object.values(Constants.DEPTH_ZONE)) {
            if (depth >= zone.min && depth < zone.max) {
                return zone;
            }
        }
        return Constants.DEPTH_ZONE.BOTTOM;
    },
    
    randomBetween: (min, max) => {
        return Math.random() * (max - min) + min;
    },
    
    calculateDistance: (x1, y1, x2, y2) => {
        // Use Phaser's optimized distance calculation
        return Phaser.Math.Distance.Between(x1, y1, x2, y2);
    },

    // Calculate distance between two objects with x/y properties
    calculateDistanceBetweenObjects: (obj1, obj2) => {
        return Phaser.Math.Distance.Between(obj1.x, obj1.y, obj2.x, obj2.y);
    }
};

export default Constants;
