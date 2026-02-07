import { describe, it, expect } from 'vitest';
import { clusterObjects, suggestZones } from './zone-suggest';

describe('zone suggestions', () => {
  it('clusters nearby objects', () => {
    const objs = [
      { id: 'a', x: 0, y: 0, w: 10, h: 10, type: 'rect' },
      { id: 'b', x: 40, y: 20, w: 10, h: 10, type: 'rect' },
      { id: 'c', x: 80, y: 40, w: 10, h: 10, type: 'text' },
      { id: 'd', x: 2000, y: 2000, w: 10, h: 10, type: 'text' },
    ];
    const clusters = clusterObjects(objs, { maxDistance: 150, minClusterSize: 3 });
    expect(clusters.length).toBe(1);
    expect(clusters[0]!.length).toBe(3);
  });

  it('suggests zones with padded rect', () => {
    const objs = [
      { id: 'a', x: 100, y: 100, w: 10, h: 10, type: 'text' },
      { id: 'b', x: 140, y: 120, w: 10, h: 10, type: 'text' },
      { id: 'c', x: 180, y: 140, w: 10, h: 10, type: 'text' },
    ];
    const zones = suggestZones(objs);
    expect(zones.length).toBe(1);
    expect(zones[0]!.rect.w).toBeGreaterThan(80);
    expect(zones[0]!.confidence).toBeGreaterThan(0.5);
  });
});
