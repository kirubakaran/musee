/**
 * A globe of the Moon, from NASA's Lunar Reconnaissance Orbiter colour
 * map, turning slowly at eye height, with the landing site of Apollo 11
 * marked. Small enough to pick up in VR. The Moon itself hangs in the
 * night sky nearby (see the sky hint on the record); this is the one you
 * can hold.
 *
 * Params: diameter (metres, default 1), turnSeconds (one rotation, default 90).
 */
import { Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, SphereGeometry, SRGBColorSpace, TextureLoader } from "three";
import { num, type Program } from "./index";

/** Tranquility Base, where Eagle landed on 20 July 1969. */
const TRANQUILITY = { lat: 0.674, lon: 23.473 };

export const moon: Program = (params) => {
  const diameter = num(params, "diameter", 1);
  const turn = num(params, "turnSeconds", 90);
  const r = diameter / 2;
  // A touch self-lit, since it stands under a night sky where the museum's lights are low.
  const material = new MeshStandardMaterial({ color: 0x8c8c8c, roughness: 1, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0.35, transparent: false });
  new TextureLoader().load("/sky/moon-2k.jpg", (t) => {
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    material.map = t;
    material.emissiveMap = t;
    material.color.set(0xffffff);
    material.needsUpdate = true;
  });
  const globe = new Mesh(new SphereGeometry(r, 64, 48), material);
  globe.castShadow = true;
  globe.position.y = r;
  // The landing site: a small red dot on the surface, at its latitude and longitude.
  const dot = new Mesh(new SphereGeometry(r * 0.02, 12, 8), new MeshBasicMaterial({ color: 0xc8402a }));
  const lat = (TRANQUILITY.lat * Math.PI) / 180, lon = (TRANQUILITY.lon * Math.PI) / 180;
  // three's sphere maps u = 0 at -X going round; the texture's prime meridian sits at u = 0.5, which is +X... so
  // longitude 0 faces +X and east runs toward -Z, matching an equirectangular map on SphereGeometry.
  dot.position.set(Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon)).multiplyScalar(r * 1.005);
  globe.add(dot);
  const group = new Group();
  group.add(globe);
  return {
    object: group,
    update(dt, distance) {
      if (distance < 60) globe.rotation.y += (dt * 2 * Math.PI) / turn;
      // Walked into: solid until the eyes are a hand's breadth from the surface, then gone
      // over the last few centimetres rather than showing its inside; back when stepped out of.
      const near = Math.min(1, Math.max(0, (distance - r + 0.04) / 0.12));
      if (near < 1 || material.transparent) {
        material.transparent = near < 1;
        material.opacity = near;
        material.needsUpdate = material.transparent !== (near < 1);
        dot.visible = near > 0.5;
      }
    },
    dispose() {
      globe.geometry.dispose();
      material.map?.dispose();
      material.dispose();
      dot.geometry.dispose();
      (dot.material as MeshBasicMaterial).dispose();
    },
    residentBytes: 2048 * 1024 * 4,
  };
};
