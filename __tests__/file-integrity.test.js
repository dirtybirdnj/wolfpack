/**
 * File Integrity Tests
 *
 * These tests verify code integrity without running the game:
 * - No references to deleted code
 * - No references to deleted constants
 * - Valid JavaScript syntax
 */

import fs from 'fs';
import { globSync } from 'glob';
import { execSync } from 'child_process';

describe('File Integrity', () => {
  const srcFiles = globSync('src/**/*.js');

  test('All JS files have valid syntax', () => {
    srcFiles.forEach(file => {
      expect(() => {
        execSync(`node -c ${file}`, { encoding: 'utf-8' });
      }).not.toThrow();
    });
  });

  test('No references to deleted BoatManager', () => {
    srcFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).not.toContain('boatManager');
      expect(content).not.toMatch(/new\s+BoatManager/);
    });
  });

  test('No references to deleted NavigationScene', () => {
    srcFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      // Check for actual imports or usage (not in comments)
      expect(content).not.toMatch(/import.*NavigationScene/);
      expect(content).not.toMatch(/new\s+NavigationScene/);
      expect(content).not.toMatch(/scene:\s*\[.*NavigationScene.*\]/);
    });
  });

  test('No references to deleted summer mode constants', () => {
    const deletedConstants = [
      'FISHING_TYPE_KAYAK',
      'FISHING_TYPE_MOTORBOAT',
      'SUMMER_MODE'
    ];

    srcFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      deletedConstants.forEach(constant => {
        expect(content).not.toContain(constant);
      });
    });
  });

  test('No orphaned else statements (syntax check)', () => {
    srcFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');

      // Check for patterns that indicate orphaned else
      // This is a basic check - ESLint is more thorough
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        // Look for standalone "} else {" on a line (indicates duplicate)
        if (line.trim() === '} else {' && index > 0) {
          const prevLine = lines[index - 1].trim();
          // If previous line is also a closing brace with else, it's a duplicate
          if (prevLine.endsWith('} else {')) {
            fail(`Possible orphaned else at ${file}:${index + 1}`);
          }
        }
      });
    });
  });

  test('All files export something', () => {
    const entityFiles = srcFiles.filter(f =>
      f.includes('/entities/') ||
      f.includes('/managers/') ||
      f.includes('/models/') ||
      f.includes('/scenes/systems/')
    );

    entityFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      const hasExport = content.includes('export default') ||
                       content.includes('export {') ||
                       content.includes('export class');
      expect(hasExport).toBe(true);
    });
  });
});
