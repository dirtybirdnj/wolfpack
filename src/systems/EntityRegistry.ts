/**
 * Unified Entity Registry
 *
 * Single source of truth for all entities in the game world.
 * Fish, bugs, lures - everything registers here so anything can find anything.
 *
 * No more separate groups, no more "can't see other types" problems.
 */

export interface WorldEntity {
    x: number;
    y: number;
    size: number;  // Universal size (bigger can eat smaller)
    type: 'fish' | 'bug' | 'lure';
    id: string;    // Unique identifier
    sprite?: any;  // Reference to Phaser sprite if needed
}

export class EntityRegistry {
    private entities: Map<string, WorldEntity> = new Map();
    private static instance: EntityRegistry;

    private constructor() {}

    static getInstance(): EntityRegistry {
        if (!EntityRegistry.instance) {
            EntityRegistry.instance = new EntityRegistry();
        }
        return EntityRegistry.instance;
    }

    /**
     * Register an entity in the world
     */
    register(entity: WorldEntity): void {
        this.entities.set(entity.id, entity);
    }

    /**
     * Remove an entity from the world
     */
    unregister(id: string): void {
        this.entities.delete(id);
    }

    /**
     * Update entity position (called every frame)
     */
    updatePosition(id: string, x: number, y: number): void {
        const entity = this.entities.get(id);
        if (entity) {
            entity.x = x;
            entity.y = y;
        }
    }

    /**
     * Find all entities within radius of a point
     * This is the "phonebook" - everyone uses this to see what's nearby
     */
    findNearby(x: number, y: number, radius: number, options?: {
        excludeId?: string;
        types?: Array<'fish' | 'bug' | 'lure'>;
    }): WorldEntity[] {
        const results: WorldEntity[] = [];
        const radiusSq = radius * radius;

        this.entities.forEach((entity) => {
            // Skip self
            if (options?.excludeId && entity.id === options.excludeId) {
                return;
            }

            // Filter by type if specified
            if (options?.types && !options.types.includes(entity.type)) {
                return;
            }

            // Check distance
            const dx = entity.x - x;
            const dy = entity.y - y;
            const distSq = dx * dx + dy * dy;

            if (distSq <= radiusSq) {
                results.push(entity);
            }
        });

        return results;
    }

    /**
     * Find the N nearest entities
     */
    findNearest(x: number, y: number, count: number, options?: {
        excludeId?: string;
        types?: Array<'fish' | 'bug' | 'lure'>;
        maxDistance?: number;
    }): WorldEntity[] {
        const all: Array<{ entity: WorldEntity; distSq: number }> = [];
        const maxDistSq = options?.maxDistance ? options.maxDistance * options.maxDistance : Infinity;

        this.entities.forEach((entity) => {
            // Skip self
            if (options?.excludeId && entity.id === options.excludeId) {
                return;
            }

            // Filter by type if specified
            if (options?.types && !options.types.includes(entity.type)) {
                return;
            }

            // Calculate distance
            const dx = entity.x - x;
            const dy = entity.y - y;
            const distSq = dx * dx + dy * dy;

            if (distSq <= maxDistSq) {
                all.push({ entity, distSq });
            }
        });

        // Sort by distance and take N nearest
        all.sort((a, b) => a.distSq - b.distSq);
        return all.slice(0, count).map(item => item.entity);
    }

    /**
     * Get entity by ID
     */
    get(id: string): WorldEntity | undefined {
        return this.entities.get(id);
    }

    /**
     * Get all entities of a specific type
     */
    getAllOfType(type: 'fish' | 'bug' | 'lure'): WorldEntity[] {
        const results: WorldEntity[] = [];
        this.entities.forEach(entity => {
            if (entity.type === type) {
                results.push(entity);
            }
        });
        return results;
    }

    /**
     * Get total count of entities
     */
    getCount(): number {
        return this.entities.size;
    }

    /**
     * Get count by type
     */
    getCountByType(type: 'fish' | 'bug' | 'lure'): number {
        let count = 0;
        this.entities.forEach(entity => {
            if (entity.type === type) {
                count++;
            }
        });
        return count;
    }

    /**
     * Clear all entities (for scene cleanup)
     */
    clear(): void {
        this.entities.clear();
    }

    /**
     * Debug: Get all entities
     */
    getAll(): WorldEntity[] {
        return Array.from(this.entities.values());
    }
}
