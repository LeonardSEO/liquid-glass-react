import assert from "node:assert/strict"
import { test } from "node:test"
import { buildDisplacementMap, refractionProfile } from "../src/maps.ts"

const optics = { bezel: 12, thickness: 18, ior: 1.5, profile: "squircle" }

test("all surface profiles produce finite displacement for valid optics", () => {
  for (const profile of ["squircle", "circle", "lip"]) {
    const values = refractionProfile({ ...optics, profile })
    assert.ok(values.every(Number.isFinite))
    assert.ok(values.some(value => value > 0))
  }
})

test("zero thickness and matching refractive indices produce no bend", () => {
  for (const overrides of [{ thickness: 0 }, { ior: 1 }]) {
    const values = refractionProfile({ ...optics, ...overrides })
    assert.ok(values.every(value => Math.abs(value) < 1e-6))
  }
})

test("invalid optical inputs fail explicitly instead of producing NaN pixels", () => {
  for (const ior of [0, -1, NaN, Infinity]) {
    assert.throws(() => refractionProfile({ ...optics, ior }), RangeError)
    assert.throws(() => buildDisplacementMap({ width: 64, height: 48, radius: 12 }, { ...optics, ior }), RangeError)
  }
  for (const thickness of [-1, NaN, Infinity]) {
    assert.throws(() => refractionProfile({ ...optics, thickness }), RangeError)
  }
  for (const bezel of [0, -1, NaN, Infinity]) {
    assert.throws(() => refractionProfile({ ...optics, bezel }), RangeError)
  }
})

test("rounded maps keep the centre neutral and bend opposite rims inward", () => {
  const map = buildDisplacementMap({ width: 100, height: 64, radius: 20 }, optics)
  const pixel = (x, y) => map.data.slice((y * map.width + x) * 4, (y * map.width + x) * 4 + 4)
  assert.deepEqual([...pixel(50, 32)], [128, 128, 128, 255])
  assert.ok(pixel(1, 32)[0] > 128)
  assert.ok(pixel(98, 32)[0] < 128)
  assert.ok(pixel(50, 1)[1] > 128)
  assert.ok(pixel(50, 62)[1] < 128)
  assert.ok(Number.isFinite(map.scale) && map.scale > 0)
})

test("resized maps use the requested dimensions and clamp pill radii", () => {
  for (const [width, height] of [[320, 64], [400, 80], [80, 300]]) {
    const map = buildDisplacementMap({ width, height, radius: 999 }, optics)
    assert.equal(map.width, width)
    assert.equal(map.height, height)
    assert.equal(map.data.length, width * height * 4)
    const clamped = buildDisplacementMap({ width, height, radius: Math.min(width, height) / 2 }, optics)
    assert.deepEqual(map, clamped)
  }
})
