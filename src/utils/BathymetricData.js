/**
 * Bathymetric data for Lake Champlain - Cumberland Head to Four Brothers Islands
 * Data derived from NOAA chart 14782
 *
 * This represents a realistic grid-based bathymetric model of the broader Lake Champlain area
 * Coordinates are in game units, depths are in feet
 *
 * Map coverage (NOAA Chart 14782):
 * - North: Cumberland Head / Plattsburgh area
 * - South: Four Brothers Islands
 * - East: Vermont shore (Burlington, Shelburne)
 * - West: New York shore (Plattsburgh, Cumberland Head)
 * - Approximate real-world dimensions: 25km N-S x 12km E-W
 */

export class BathymetricData {
    constructor() {
        // Define the expanded Lake Champlain bathymetric grid
        // X represents east-west position (0 = Vermont/Burlington shore, 20000 = NY shore/Plattsburgh)
        // Y represents north-south position (0 = south/Four Brothers, 30000 = north/Cumberland Head)
        // Depth values are in feet

        this.gridResolution = 500; // Grid cell size in game units
        this.width = 20000; // Game world width (12km real-world ~ 20000 units)
        this.height = 30000; // Game world height (25km real-world ~ 30000 units)

        // Realistic depth profile based on NOAA chart 14782
        // Covers Cumberland Head to Four Brothers Islands
        this.depthGrid = this.generateLakeChamplainProfile();
    }

    generateLakeChamplainProfile() {
        /**
         * Lake Champlain bathymetric features (NOAA Chart 14782):
         *
         * Geographic Features:
         * - Burlington (VT) waterfront: East shore, mid-map (x=0-2000, y=12000-18000)
         * - Plattsburgh (NY) area: West shore, northern section (x=15000-20000, y=22000-30000)
         * - Main lake channel: Runs north-south through center (x=8000-12000)
         * - Four Brothers Islands: Southern extent (y=0-4000)
         * - Cumberland Head: Northern extent (y=26000-30000)
         *
         * Depth Zones:
         * - Nearshore shelves (both sides): 10-40 feet
         * - Mid-lake shelf: 40-80 feet
         * - Main channel: 80-200 feet (deepest areas 150-200ft)
         * - Island areas: Shallow with structure, 15-60 feet
         * - Drop-offs and ledges throughout for structure
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
         * Calculate realistic depth based on NOAA Chart 14782
         * Lake Champlain: Cumberland Head to Four Brothers Islands
         *
         * Key bathymetric features:
         * - East shore (Vermont/Burlington): Gradual shelf, 10-60ft
         * - West shore (NY/Plattsburgh): Steeper drop, 10-80ft
         * - Main channel (center): Deep trough, 100-200ft
         * - Island areas: Shallow structure, 15-60ft
         * - North (Cumberland Head): Generally deeper, 60-150ft
         * - South (Four Brothers): Shallower, more structure, 30-100ft
         */

        // Normalize coordinates
        const xNorm = x / this.width; // 0 (Vermont shore) to 1 (NY shore)
        const yNorm = y / this.height; // 0 (south/Four Brothers) to 1 (north/Cumberland Head)

        // Calculate distance from center channel (main north-south deep trough)
        // Channel runs roughly at x = 0.45-0.55 (slightly west of center)
        const channelCenter = 0.50;
        const distFromChannel = Math.abs(xNorm - channelCenter);

        // Base depth profile - main lake channel is deepest
        let baseDepth;

        if (distFromChannel < 0.10) {
            // Main deep channel (40-60% across): 100-200 feet
            // Deeper in the north, shallower in the south
            const channelDepth = 100 + yNorm * 100; // 100ft south to 200ft north
            // Center of channel is deepest
            const channelFactor = 1 - (distFromChannel / 0.10);
            baseDepth = 60 + channelDepth * channelFactor;
        } else if (xNorm < 0.20) {
            // Vermont/Burlington nearshore (0-20%): Gradual shelf, 10-50 feet
            const shoreDepth = 10 + (xNorm / 0.20) * 40;
            baseDepth = shoreDepth;
        } else if (xNorm < 0.40) {
            // Vermont mid-shelf (20-40%): 50-80 feet
            const localX = (xNorm - 0.20) / 0.20;
            baseDepth = 50 + localX * 30;
        } else if (xNorm > 0.80) {
            // NY nearshore (80-100%): Steeper, 15-60 feet
            const localX = (xNorm - 0.80) / 0.20;
            baseDepth = 15 + (1 - localX) * 45;
        } else {
            // Transitional zones and drop-offs (40-80%): 60-120 feet
            const distFactor = Math.abs(xNorm - channelCenter) - 0.10;
            baseDepth = 120 - distFactor * 100;
        }

        // North-south depth variation
        // Northern section (Cumberland Head) is generally deeper
        // Southern section (Four Brothers) has more structure and variation
        let nsModifier;
        if (yNorm < 0.15) {
            // Four Brothers Islands area - shallow structure
            nsModifier = -20 + Math.sin(x * 0.003) * 15;
        } else if (yNorm > 0.80) {
            // Cumberland Head area - deeper water
            nsModifier = 10 + yNorm * 20;
        } else {
            // Mid-section - gradual transition
            nsModifier = (yNorm - 0.5) * 15;
        }

        // Add realistic underwater features
        const structureVariation = this.addUnderwaterStructure(x, y, xNorm, yNorm);

        // Combine all depth components
        let finalDepth = baseDepth + nsModifier + structureVariation;

        // Clamp to realistic Lake Champlain depths (deepest ~200ft in main channel)
        return Math.max(8, Math.min(200, finalDepth));
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
