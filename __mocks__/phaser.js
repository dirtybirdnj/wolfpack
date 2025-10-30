// Mock Phaser for Jest tests
// This allows testing game logic without loading the full Phaser library

export default {
  Scene: class {
    constructor() {
      this.time = {
        addEvent: jest.fn(),
        delayedCall: jest.fn()
      };
      this.physics = {
        pause: jest.fn(),
        resume: jest.fn()
      };
      this.add = {
        graphics: jest.fn(() => ({ clear: jest.fn(), destroy: jest.fn() })),
        text: jest.fn(() => ({ destroy: jest.fn() })),
        rectangle: jest.fn(() => ({ destroy: jest.fn() }))
      };
      this.events = {
        emit: jest.fn(),
        on: jest.fn(),
        off: jest.fn()
      };
    }
  },

  Math: {
    Between: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    Distance: {
      Between: (x1, y1, x2, y2) => Math.sqrt((x2-x1)**2 + (y2-y1)**2)
    }
  },

  GameObjects: {
    Graphics: class {},
    Text: class {},
    Rectangle: class {}
  }
};
