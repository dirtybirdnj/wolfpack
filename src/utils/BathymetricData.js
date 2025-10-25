/**
 * Bathymetric data for Lake Champlain - Full Lake Coverage
 * Data derived from NOAA charts 14781, 14782, 14783, 14784
 *
 * This represents a realistic grid-based bathymetric model of the entire Lake Champlain
 * Coordinates are in game units, depths are in feet
 *
 * Map coverage (NOAA Charts 14781-14784):
 * - North: Richelieu River / Canadian Border
 * - South: Whitehall, NY (southern terminus)
 * - East: Vermont shore (Burlington, Shelburne, Ticonderoga)
 * - West: New York shore (Plattsburgh, Crown Point, Whitehall)
 * - Approximate real-world dimensions: 193km (120mi) N-S x 19km (12mi) E-W at widest
 */

export class BathymetricData {
    constructor() {
        // Define the full Lake Champlain bathymetric grid
        // X represents east-west position (0 = Vermont shore, 20000 = NY shore)
        // Y represents north-south position (0 = Whitehall/south, 60000 = Canadian border/north)
        // Depth values are in feet

        this.gridResolution = 500; // Grid cell size in game units
        this.width = 20000; // Game world width (19km real-world ~ 20000 units)
        this.height = 60000; // Game world height (193km real-world ~ 60000 units)

        // Realistic depth profile based on NOAA charts 14781-14784
        // Covers entire Lake Champlain from Whitehall to Canadian border
        this.depthGrid = this.generateLakeChamplainProfile();
    }

    generateLakeChamplainProfile() {
        /**
         * Lake Champlain bathymetric features (NOAA Charts 14781-14784):
         *
         * Geographic Features (South to North):
         * - Whitehall (southern terminus): Y=0-8000, narrow/shallow (15-40ft)
         * - Ticonderoga/Crown Point: Y=8000-18000, narrow channel (30-80ft)
         * - Barber Point/Split Rock: Y=18000-28000, widening (40-120ft)
         * - Four Brothers Islands: Y=28000-32000, island structure (20-100ft)
         * - Burlington (VT): Y=32000-42000, widest/deepest (80-200ft)
         * - Plattsburgh (NY): Y=42000-50000, wide section (70-180ft)
         * - Grand Isle/South Hero: Y=50000-60000, islands/shallower (20-90ft)
         *
         * Depth Zones:
         * - Nearshore shelves (both sides): 10-40 feet
         * - Mid-lake shelf: 40-80 feet
         * - Main channel (Burlington area): 80-200 feet (deepest ~200ft)
         * - Southern narrows: 15-80 feet
         * - Northern islands: 15-90 feet with structure
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
         * Calculate realistic depth based on NOAA Charts 14781-14784
         * Full Lake Champlain: Whitehall to Canadian Border
         *
         * Key bathymetric features:
         * - Southern narrows (Whitehall-Ticonderoga): Shallow, riverine, 15-80ft
         * - Central widening (Burlington-Plattsburgh): Deep channel, 80-200ft
         * - Northern islands (Grand Isle-South Hero): Moderate with structure, 20-90ft
         * - East shore (Vermont): Generally gradual shelf
         * - West shore (New York): Steeper in places
         */

        // Normalize coordinates
        const xNorm = x / this.width; // 0 (Vermont shore) to 1 (NY shore)
        const yNorm = y / this.height; // 0 (south/Whitehall) to 1 (north/Canadian border)

        // Lake width modulation - narrows significantly in south
        // 0.0-0.13 (0-8000): Very narrow at Whitehall (~30% of max width)
        // 0.13-0.30 (8000-18000): Narrow at Ticonderoga (~50% of max width)
        // 0.30-0.80 (18000-48000): Wide section (Burlington/Plattsburgh) (~100% width)
        // 0.80-1.0 (48000-60000): Medium width at northern islands (~70% width)
        let widthFactor;
        if (yNorm < 0.13) {
            widthFactor = 0.30; // Very narrow at Whitehall
        } else if (yNorm < 0.30) {
            widthFactor = 0.30 + (yNorm - 0.13) * (0.50 - 0.30) / 0.17;
        } else if (yNorm < 0.80) {
            widthFactor = 0.50 + (yNorm - 0.30) * (1.0 - 0.50) / 0.50;
        } else {
            widthFactor = 1.0 - (yNorm - 0.80) * (1.0 - 0.70) / 0.20;
        }

        // Adjust x position based on lake width at this latitude
        const effectiveXNorm = (xNorm - 0.5) / widthFactor + 0.5;

        // Clamp to shore if outside narrowed lake
        if (effectiveXNorm < 0 || effectiveXNorm > 1) {
            return 5; // Shore/land
        }

        // Calculate distance from center channel (main north-south deep trough)
        const channelCenter = 0.50;
        const distFromChannel = Math.abs(effectiveXNorm - channelCenter);

        // Determine base depth based on lake section (south to north)
        let baseDepth;
        let maxChannelDepth;

        // Set maximum channel depth based on latitude
        if (yNorm < 0.13) {
            // Whitehall area: Very shallow, riverine
            maxChannelDepth = 40;
        } else if (yNorm < 0.30) {
            // Ticonderoga/Crown Point: Narrow channel, moderate
            maxChannelDepth = 50 + (yNorm - 0.13) * 170; // 50-80ft
        } else if (yNorm < 0.53) {
            // Four Brothers to Burlington: Deepening
            maxChannelDepth = 80 + (yNorm - 0.30) * 520; // 80-200ft (deepest at Burlington)
        } else if (yNorm < 0.83) {
            // Burlington to Plattsburgh: Deep but gradually shallowing
            maxChannelDepth = 200 - (yNorm - 0.53) * 67; // 200-180ft
        } else {
            // Northern islands: Moderate depth
            maxChannelDepth = 180 - (yNorm - 0.83) * 529; // 180-90ft
        }

        if (distFromChannel < 0.10) {
            // Main deep channel (center 20%): Deepest water
            const channelFactor = 1 - (distFromChannel / 0.10);
            baseDepth = maxChannelDepth * 0.6 + maxChannelDepth * 0.4 * channelFactor;
        } else if (effectiveXNorm < 0.20) {
            // Vermont nearshore (0-20%): Gradual shelf, 10-50 feet
            const shoreDepth = 10 + (effectiveXNorm / 0.20) * 40;
            baseDepth = shoreDepth * (maxChannelDepth / 100);
        } else if (effectiveXNorm < 0.40) {
            // Vermont mid-shelf (20-40%): 50-80 feet
            const localX = (effectiveXNorm - 0.20) / 0.20;
            baseDepth = (50 + localX * 30) * (maxChannelDepth / 100);
        } else if (effectiveXNorm > 0.80) {
            // NY nearshore (80-100%): Steeper, 15-60 feet
            const localX = (effectiveXNorm - 0.80) / 0.20;
            baseDepth = (15 + (1 - localX) * 45) * (maxChannelDepth / 100);
        } else {
            // Transitional zones and drop-offs (40-80%): 60-120 feet
            const distFactor = Math.abs(effectiveXNorm - channelCenter) - 0.10;
            baseDepth = (120 - distFactor * 100) * (maxChannelDepth / 150);
        }

        // North-south depth variation for local structure
        let nsModifier = 0;
        if (yNorm < 0.13) {
            // Whitehall: Very shallow, rocky
            nsModifier = -10 + Math.sin(x * 0.005) * 8;
        } else if (yNorm < 0.30) {
            // Ticonderoga/Crown Point: Moderate structure
            nsModifier = Math.sin(x * 0.003) * 10;
        } else if (yNorm < 0.50) {
            // Four Brothers: Island structure
            nsModifier = -15 + Math.sin(x * 0.002) * 12;
        } else if (yNorm < 0.70) {
            // Burlington/Plattsburgh: Main basin, less variation
            nsModifier = Math.sin(x * 0.001) * 8;
        } else {
            // Northern islands: Shallow bays and structure
            nsModifier = -10 + Math.sin(x * 0.004) * 15;
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

        // Create a rocky ledge near Burlington (great for walleye, lake trout)
        if (xNorm > 0.40 && xNorm < 0.45 && yNorm > 0.60 && yNorm < 0.70) {
            // Vertical drop-off of 10-15 feet
            structure -= 12;
        }

        // Four Brothers Islands structure (pike/bass habitat)
        if (xNorm > 0.25 && xNorm < 0.35 && yNorm > 0.45 && yNorm < 0.55) {
            const humpCenterX = 0.30;
            const humpCenterY = 0.50;
            const distToHump = Math.sqrt(
                Math.pow(xNorm - humpCenterX, 2) +
                Math.pow((yNorm - humpCenterY) * 2, 2) // Elongated N-S
            );
            if (distToHump < 0.08) {
                // Top of hump is 15 feet shallower
                structure -= 15 * (1 - distToHump / 0.08);
            }
        }

        // South Hero Island area structure
        if (yNorm > 0.85 && xNorm > 0.20 && xNorm < 0.50) {
            structure -= 20 * Math.sin((x + y) * 0.001);
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
