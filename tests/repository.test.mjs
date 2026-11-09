import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { test } from "node:test"

const pkg = JSON.parse(readFileSync("package.json", "utf8"))
const manifest = JSON.parse(readFileSync("registry.json", "utf8"))

test("the skill's engine copy is generated from src", () => {
  const assets = "skills/liquid-glass/assets"
  assert.deepEqual(readdirSync(assets).sort(), readdirSync("src").sort(), "run npm run skill:sync")
  for (const file of readdirSync("src")) {
    assert.equal(readFileSync(`${assets}/${file}`, "utf8"), readFileSync(`src/${file}`, "utf8"), `${file} is stale: run npm run skill:sync`)
  }
})

test("the registry asks for the engine version this repository builds", () => {
  const engine = manifest.items.flatMap((item) => item.dependencies ?? []).filter((dep) => dep.startsWith(`${pkg.name}@`))
  assert.ok(engine.length > 0)
  for (const dep of engine) assert.equal(dep, `${pkg.name}@^${pkg.version}`)
})

test("the registry lists exactly the component files and their npm imports", () => {
  const listed = manifest.items.flatMap((item) => item.files.map((file) => file.path)).sort()
  assert.deepEqual(listed, readdirSync("registry/glass").map((file) => `registry/glass/${file}`).sort())
  const packageOf = (specifier) => specifier.split("/").slice(0, specifier.startsWith("@") ? 2 : 1).join("/")
  for (const item of manifest.items) {
    const imported = item.files
      .filter((file) => /\.tsx?$/.test(file.path))
      .flatMap((file) => [...readFileSync(file.path, "utf8").matchAll(/from "([^".][^"]*)"/g)].map((match) => match[1]))
      .filter((specifier) => !specifier.startsWith("@/") && !specifier.startsWith("react") && !specifier.startsWith(pkg.name))
    for (const dep of imported.map(packageOf)) assert.ok(item.dependencies?.includes(dep), `${item.name} imports ${dep}`)
  }
})
