/**
 * A pyramid built from its published figures: a square base and a height,
 * in metres, as a stair of stone courses. There is no scan of the Great
 * Pyramid anyone may download, and a plain shape at true size is the
 * point of it anyway: 146 m of stone, seen from a distance and then from
 * the foot, where the courses are real steps you could climb, as they are
 * on the monument today, its casing long gone.
 *
 * Params: base (side of the square, default 230.3), height (default
 * 146.6, as built; it stands 138.5 today), courses (default 210).
 */
import { BufferAttribute, BufferGeometry, DoubleSide, Group, Mesh, MeshStandardMaterial } from "three";
import { num, type Program } from "./index";

/** A square pyramid as stepped courses: each a ring of four vertical faces and four ledges. */
function steppedPyramid(base: number, height: number, courses: number): BufferGeometry {
  const quads: number[][] = [];
  const colours: number[][] = [];
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const half = (y: number) => (base / 2) * (1 - y / height);
  const quad = (a: number[], b: number[], c: number[], d: number[], tint: number) => {
    quads.push(a, b, c, a, c, d);
    for (let i = 0; i < 6; i++) colours.push([tint, tint, tint]);
  };
  for (let i = 0; i < courses; i++) {
    const y0 = (i / courses) * height, y1 = ((i + 1) / courses) * height;
    const w = half(y0), wTop = half(y1);
    // Each course a little lighter or darker than its neighbours, as weathered blocks are.
    const tint = 0.9 + rnd() * 0.12;
    // Four vertical faces of this course, counter-clockwise seen from outside.
    const c = [[-w, y0, w], [w, y0, w], [w, y0, -w], [-w, y0, -w]];
    const t = [[-w, y1, w], [w, y1, w], [w, y1, -w], [-w, y1, -w]];
    for (let k = 0; k < 4; k++) {
      const n = (k + 1) % 4;
      quad(c[k]!, c[n]!, t[n]!, t[k]!, tint);
    }
    // The ledge on top of it, in to the next course's foot; the last one is the flat top.
    const inner = [[-wTop, y1, wTop], [wTop, y1, wTop], [wTop, y1, -wTop], [-wTop, y1, -wTop]];
    if (i === courses - 1) {
      quad(t[0]!, t[1]!, t[2]!, t[3]!, tint * 0.98);
    } else {
      for (let k = 0; k < 4; k++) {
        const n = (k + 1) % 4;
        quad(t[k]!, t[n]!, inner[n]!, inner[k]!, tint * 1.04);
      }
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(quads.flat()), 3));
  g.setAttribute("color", new BufferAttribute(new Float32Array(colours.flat()), 3));
  g.computeVertexNormals();
  return g;
}

export const pyramid: Program = (params) => {
  const base = num(params, "base", 230.3);
  const height = num(params, "height", 146.6);
  const courses = Math.round(num(params, "courses", 210));
  const geometry = steppedPyramid(base, height, courses);
  // Both sides: nothing stops a visitor walking in, and inside they should see stone, not sky.
  const material = new MeshStandardMaterial({ color: 0xc9b48a, roughness: 0.95, flatShading: true, vertexColors: true, side: DoubleSide });
  // The scene's fog ends a couple of hundred metres out, which would swallow a
  // thing meant to be seen from afar; it gets a longer haze of its own instead.
  material.onBeforeCompile = (shader) => {
    shader.uniforms.hazeFar = { value: 1600 };
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <fog_pars_fragment>", "#include <fog_pars_fragment>\nuniform float hazeFar;")
      .replace("#include <fog_fragment>", `
        #ifdef USE_FOG
          float hazeFactor = smoothstep(150.0, hazeFar, vFogDepth);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, hazeFactor * 0.92);
        #endif`);
  };
  const mesh = new Mesh(geometry, material);
  mesh.receiveShadow = true;
  const group = new Group();
  group.add(mesh);
  return {
    object: group,
    update() {},
    dispose() {
      geometry.dispose();
      material.dispose();
    },
    residentBytes: courses * 48 * 24,
  };
};
