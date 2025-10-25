/**
 * Bathymetric data for Lake Champlain - Burlington Bay area
 * Data derived from NOAA chart 14782 (Cumberland Head to Four Brothers Islands)
 *
 * This represents a simplified grid-based bathymetric model of Burlington Bay
 * Coordinates are in game units, depths are in feet
 */

export class BathymetricData {
    constructor() {
        // Define the Burlington Bay bathymetric grid
        // X represents east-west position (0 = Burlington waterfront, 10000 = west into bay)
        // Y represents north-south position (0 = south, 10000 = north)
        // Depth values are in feet

        this.gridResolution = 500; // Grid cell size in game units
        this.width = 10000; // Game world width
        this.height = 10000; // Game world height

        // Burlington Bay depth profile (based on NOAA chart readings)
        // This is a simplified representation of the actual bathymetry
        this.depthGrid = this.generateBurlingtonBayProfile();
    }

    generateBurlingtonBayProfile() {
        /**
         * Burlington Bay bathymetric features (from NOAA chart):
         * - Burlington waterfront (east): Very shallow, 10-25 feet
         * - Near-shore shelves: 25-40 feet (good for perch, bass)
         * - Mid-bay transitional zone: 40-70 feet
         * - Western drop-off: 70-120 feet (lake trout territory)
         * - Deep channel: 100-150 feet
         *
         * North-south variation adds realistic structure:
         * - Northern areas tend to be slightly deeper
         * - Southern shallow flats for warm-water species
         * - Drop-offs and ledges create fish-holding structure
         */

        const grid = [];
        const cellsX = Math.ceil(this.width / this.gridResolution);
        const cellsY = Math.ceil(this.height / this.gridResolution);

        for (let gy = 0; gy < cellsY; gy++) {
            for (let gx = 0; gx < cellsX; gx++) {
                const x = gx * this.gridResolution;
                const y = gy * this.gridResolution;

                // Calculate depth based on position
                let depth = this.calculateDepthAtGridPoint(x, y);

                grid.push({
                    x: x,
                    y: y,
                    depth: depth,
                    gridX: gx,
                    gridY: gy
                });
            }
        }

        return grid;
    }

    calculateDepthAtGridPoint(x, y) {
        /**
         * Calculate realistic depth based on position in Burlington Bay
         * X-axis (east-west): Primary depth gradient
         * Y-axis (north-south): Secondary variation and structure
         */

        // Normalize coordinates
        const xNorm = x / this.width; // 0 (east/shore) to 1 (west/deep)
        const yNorm = y / this.height; // 0 (south) to 1 (north)

        // Base depth profile (east to west gradient)
        let baseDepth;
        if (xNorm < 0.15) {
            // Very shallow near Burlington waterfront (0-1500 game units)
            baseDepth = 10 + (xNorm / 0.15) * 15; // 10-25 feet
        } else if (xNorm < 0.35) {
            // Gradual shelf (1500-3500 game units) - perch and bass territory
            const localX = (xNorm - 0.15) / 0.20;
            baseDepth = 25 + localX * 25; // 25-50 feet
        } else if (xNorm < 0.60) {
            // Transitional zone with some drop-offs (3500-6000 game units)
            const localX = (xNorm - 0.35) / 0.25;
            baseDepth = 50 + localX * 40; // 50-90 feet
        } else {
            // Deep water (6000-10000 game units) - lake trout zone
            const localX = (xNorm - 0.60) / 0.40;
            baseDepth = 90 + localX * 60; // 90-150 feet
        }

        // Add north-south variation for realistic structure
        // Northern areas (higher y) tend to be slightly deeper
        const northSouthVariation = (yNorm - 0.5) * 10; // +/- 5 feet variation

        // Add realistic underwater features (ledges, humps, channels)
        const structureVariation = this.addUnderwaterStructure(x, y, xNorm, yNorm);

        // Combine all depth components
        let finalDepth = baseDepth + northSouthVariation + structureVariation;

        // Clamp to realistic Lake Champlain depths
        return Math.max(8, Math.min(150, finalDepth));
    }

    addUnderwaterStructure(x, y, xNorm, yNorm) {
        /**
         * Add realistic underwater features like:
         * - Rocky ledges and drop-offs (fish attractors)
         * - Submerged humps and points
         * - Channels and troughs
         * - Bottom texture variation
         */

        let structure = 0;

        // Create a rocky ledge in mid-depth zone (great for walleye, lake trout)
        if (xNorm > 0.40 && xNorm < 0.45 && yNorm > 0.3 && yNorm < 0.7) {
            // Vertical drop-off of 10-15 feet
            structure -= 12;
        }

        // Submerged hump in southern section (pike/bass structure)
        if (xNorm > 0.25 && xNorm < 0.35 && yNorm < 0.3) {
            const humpCenterX = 0.30;
            const humpCenterY = 0.15;
            const distToHump = Math.sqrt(
                Math.pow(xNorm - humpCenterX, 2) +
                Math.pow(yNorm - humpCenterY, 2)
            );
            if (distToHump < 0.08) {
                // Top of hump is 15 feet shallower
                structure -= 15 * (1 - distToHump / 0.08);
            }
        }

        // Add natural bottom texture using Perlin-like noise
        const textureNoise =
            Math.sin(x * 0.002) * 3 +
            Math.cos(y * 0.003) * 2 +
            Math.sin((x + y) * 0.001) * 2;

        structure += textureNoise;

        return structure;
    }

    getDepthAtPosition(x, y = 5000) {
        /**
         * Get interpolated depth at any position
         * Uses bilinear interpolation for smooth depth transitions
         */

        // Clamp to bounds
        x = Math.max(0, Math.min(this.width - 1, x));
        y = Math.max(0, Math.min(this.height - 1, y));

        // Find surrounding grid cells
        const gridX = x / this.gridResolution;
        const gridY = y / this.gridResolution;

        const gx0 = Math.floor(gridX);
        const gy0 = Math.floor(gridY);
        const gx1 = Math.min(gx0 + 1, Math.floor((this.width - 1) / this.gridResolution));
        const gy1 = Math.min(gy0 + 1, Math.floor((this.height - 1) / this.gridResolution));

        // Get depths at four corners
        const d00 = this.getGridCellDepth(gx0, gy0);
        const d10 = this.getGridCellDepth(gx1, gy0);
        const d01 = this.getGridCellDepth(gx0, gy1);
        const d11 = this.getGridCellDepth(gx1, gy1);

        // Bilinear interpolation
        const tx = gridX - gx0;
        const ty = gridY - gy0;

        const d0 = d00 * (1 - tx) + d10 * tx;
        const d1 = d01 * (1 - tx) + d11 * tx;

        return d0 * (1 - ty) + d1 * ty;
    }

    getGridCellDepth(gridX, gridY) {
        /**
         * Get depth of a specific grid cell
         */
        const cellsX = Math.ceil(this.width / this.gridResolution);
        const index = gridY * cellsX + gridX;

        if (index >= 0 && index < this.depthGrid.length) {
            return this.depthGrid[index].depth;
        }

        // Return default depth if out of bounds
        return 75;
    }

    getDepthProfile(x, y, direction = 'horizontal', length = 2000) {
        /**
         * Get a depth profile along a line (useful for sonar display)
         * direction: 'horizontal' (x-axis) or 'vertical' (y-axis)
         * returns array of {distance, depth} points
         */

        const profile = [];
        const steps = Math.floor(length / 50); // Sample every 50 units

        for (let i = 0; i <= steps; i++) {
            const distance = (i / steps) * length;
            let sampleX, sampleY;

            if (direction === 'horizontal') {
                sampleX = x + distance - (length / 2);
                sampleY = y;
            } else {
                sampleX = x;
                sampleY = y + distance - (length / 2);
            }

            const depth = this.getDepthAtPosition(sampleX, sampleY);
            profile.push({ distance, depth, x: sampleX, y: sampleY });
        }

        return profile;
    }

    findGoodFishingSpots(targetDepthMin, targetDepthMax, numSpots = 5) {
        /**
         * Find locations with desired depth characteristics
         * Useful for spawning players or fish
         */

        const goodSpots = [];
        const cellsX = Math.ceil(this.width / this.gridResolution);
        const cellsY = Math.ceil(this.height / this.gridResolution);

        // Sample the grid for suitable depths
        for (let gy = 0; gy < cellsY; gy++) {
            for (let gx = 0; gx < cellsX; gx++) {
                const index = gy * cellsX + gx;
                const cell = this.depthGrid[index];

                if (cell.depth >= targetDepthMin && cell.depth <= targetDepthMax) {
                    goodSpots.push({
                        x: cell.x,
                        y: cell.y,
                        depth: cell.depth
                    });
                }
            }
        }

        // Randomly select requested number of spots
        const selectedSpots = [];
        for (let i = 0; i < numSpots && goodSpots.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * goodSpots.length);
            selectedSpots.push(goodSpots[randomIndex]);
            goodSpots.splice(randomIndex, 1);
        }

        return selectedSpots;
    }

    getDepthDescription(depth) {
        /**
         * Get descriptive text for depth reading
         */
        if (depth < 20) return 'Very Shallow';
        if (depth < 40) return 'Shallow';
        if (depth < 70) return 'Moderate';
        if (depth < 100) return 'Deep';
        return 'Very Deep';
    }

    getStructureDescription(x, y) {
        /**
         * Analyze structure at a location
         */
        const depth = this.getDepthAtPosition(x, y);

        // Sample nearby depths to detect drop-offs
        const depthNorth = this.getDepthAtPosition(x, y + 200);
        const depthSouth = this.getDepthAtPosition(x, y - 200);
        const depthEast = this.getDepthAtPosition(x + 200, y);
        const depthWest = this.getDepthAtPosition(x - 200, y);

        const maxChange = Math.max(
            Math.abs(depth - depthNorth),
            Math.abs(depth - depthSouth),
            Math.abs(depth - depthEast),
            Math.abs(depth - depthWest)
        );

        if (maxChange > 15) {
            return 'Drop-off/Ledge';
        } else if (maxChange > 8) {
            return 'Sloping Bottom';
        } else {
            return 'Flat Bottom';
        }
    }
}

// Singleton instance
let bathymetricDataInstance = null;

export function getBathymetricData() {
    if (!bathymetricDataInstance) {
        bathymetricDataInstance = new BathymetricData();
    }
    return bathymetricDataInstance;
}

export default BathymetricData;
