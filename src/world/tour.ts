/**
 * A guided first visit: a short path through the museum, one line about
 * each stop, for someone who does not yet know what to look for. T (or
 * the tour buttons on a phone) goes to the next stop; Shift T goes back.
 * Where you are in it is remembered in the browser, so a visit can be
 * picked up where it was left. Walking off between stops is fine; the
 * next press carries on from the next stop.
 *
 * Stops name works by id; one that is not on display is skipped, so the
 * tour survives the collection changing under it.
 */
import type { Artwork } from "../data/types";

export interface Stop {
  id: string;
  /** One line, said on arrival. */
  line: string;
}

export const TOUR: Stop[] = [
  { id: "zen-21530762", line: "A hand axe from 300,000 years ago: the oldest thing here, and already a shape someone chose." },
  { id: "wm-29686577", line: "The Lion-man: a being that never existed, carved 40,000 years ago. Imagination, in ivory." },
  { id: "sf-e8f121d0545247318781ef3981fdfdaa", line: "A wall of Lascaux, cast from the cave. Look at how the deer's neck is one stroke." },
  { id: "sf-5c56a4feeb8e4c67b5a4d903b4a96e5a", line: "Khufu's ship, 4,500 years old, drawn from a million laser points. The pyramid it was buried beside is out to the east." },
  { id: "sf-7e7febabef2045a68755cc39c8c7c91f", line: "Stonehenge. Wait a moment: the sun rises along the axis of the stones, as it does at midsummer." },
  { id: "wm-164288965", line: "The Nebra sky disc, and above you the night it was made under: the Pleiades are low in the west." },
  { id: "eq-pythagorean-theorem", line: "The first equation on the lane. Beside it, a scrap of papyrus with Euclid's own diagram." },
  { id: "sf-5f35ab370082403e8c7829388f4e0c30", line: "Walk into the Pantheon. It is noon on 21 April and the sun through the oculus is on the arch over the door." },
  { id: "wm-50738349", line: "The Big Temple at Thanjavur: 66 metres of granite, in a place with no granite." },
  { id: "sf-6862a3c673d4434a8dc39ced2a5b5720", line: "A Chola Nataraja, scanned in Cleveland. In VR you can pick it up." },
  { id: "sf-da8c663b974f4902bf79bb9595e76d5e", line: "Step onto the plan and the Alhambra rises around you." },
  { id: "wm-50410532", line: "The Last Supper at its real size, nearly nine metres across." },
  { id: "wm-11812879", line: "Newton's Principia, the title page. Three laws and gravity, 1687." },
  { id: "sim-fourier-series", line: "Fourier's claim, drawn live: circles on circles trace a square wave. Add more circles, sharper corners." },
  { id: "si-nasm_A19610048000", line: "The 1903 Wright Flyer, the Smithsonian's own scan. Twelve seconds, the first time." },
  { id: "sim-lorenz-attractor", line: "The Lorenz attractor. The red point is flying the equations right now; nobody can say which wing it takes next." },
  { id: "wm-91010657", line: "The Apollo 11 broadcast, as the world saw it. Come close and it plays." },
  { id: "sim-game-of-life", line: "Three rules on a grid: the Game of Life, running in the floor. The gun at the top left fires a glider every 30 generations." },
  { id: "sim-mandelbrot-set", line: "The Mandelbrot set, computed every frame. It is zooming in; the edge never runs out." },
  { id: "sf-5f7176a2ae284d6b99fc970c9d265c04", line: "Discovery, 39 flights. Walk under the wing and look up at the tiles." },
  { id: "sf-485c51878bc7449e81379a863ec862f5", line: "The first iPhone, at its true 11 cm. The end of the lane, for now." },
];

const KEY = "20watts.tour.v1";
const SHOW_SECONDS = 14;

export class Tour {
  private readonly stops: Stop[];
  private at = -1;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    visible: Artwork[],
    private readonly goTo: (id: string) => boolean,
    private readonly caption: HTMLElement | null,
  ) {
    const ids = new Set(visible.map((a) => a.id));
    this.stops = TOUR.filter((s) => ids.has(s.id));
    try {
      const saved = Number(localStorage.getItem(KEY));
      if (Number.isInteger(saved) && saved >= -1 && saved < this.stops.length) this.at = saved;
    } catch {
      /* no storage: the tour starts at the beginning each time */
    }
  }

  /** From the beginning. */
  start() {
    this.at = -1;
    this.step(1);
  }

  /** The next stop (dir 1) or the previous (dir -1). At either end it says so and stays. */
  step(dir: 1 | -1) {
    const next = this.at + dir;
    if (next < 0 || next >= this.stops.length) {
      this.say(dir > 0 ? "That is the end of the tour. Wander." : "This is the first stop.", null);
      return;
    }
    this.at = next;
    try {
      localStorage.setItem(KEY, String(this.at));
    } catch {
      /* fine */
    }
    const stop = this.stops[this.at]!;
    this.goTo(stop.id);
    this.say(stop.line, `${this.at + 1} of ${this.stops.length}`);
  }

  private say(text: string, count: string | null) {
    if (!this.caption) return;
    this.caption.replaceChildren();
    if (count) {
      const n = document.createElement("span");
      n.className = "n";
      n.textContent = count;
      this.caption.append(n);
    }
    this.caption.append(document.createTextNode(text));
    if (count && this.at < this.stops.length - 1) {
      const hint = document.createElement("span");
      hint.className = "next";
      hint.textContent = "T for the next stop";
      this.caption.append(hint);
    }
    this.caption.classList.add("on");
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => this.caption?.classList.remove("on"), SHOW_SECONDS * 1000);
  }
}
