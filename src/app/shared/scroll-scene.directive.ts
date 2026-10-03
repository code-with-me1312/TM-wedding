import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  NgZone,
} from "@angular/core";
import {
  clamp,
  openingFrame,
  sceneProgress,
  smoothRange,
} from "./scroll-motion";

/** Native scrolling stays in charge. Only compositor properties change per frame. */
@Directive({ selector: "[scrollScene]" })
export class ScrollSceneDirective {
  readonly scrollScene = input<"opening" | "vow" | "date" | "reveal">("reveal");
  private readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly zone = inject(NgZone);
  private readonly destroy = inject(DestroyRef);
  constructor() {
    afterNextRender(() =>
      this.zone.runOutsideAngular(() => {
        const media = matchMedia(
          "(prefers-reduced-motion: reduce), (max-height: 600px)",
        );
        let frame = 0;
        let last = -1;
        const set = (name: string, value: number, unit = "") =>
          this.element.style.setProperty(name, `${value.toFixed(4)}${unit}`);
        const render = () => {
          frame = 0;
          const rect = this.element.getBoundingClientRect();
          const height = document.documentElement.clientHeight;
          const kind = this.scrollScene();
          const progress = media.matches
            ? 1
            : kind === "reveal"
              ? clamp(
                  (height * 0.94 - rect.top) /
                    (Math.min(rect.height, height) * 0.7),
                )
              : sceneProgress(rect.top, rect.height, height);
          if (Math.abs(progress - last) < 0.0001) return;
          last = progress;
          set("--progress", progress);
          if (kind === "opening") {
            const f = openingFrame(progress);
            set("--envelope-lift", f.envelopeLift, "vh");
            set("--envelope-opacity", f.envelopeOpacity);
            set("--paper-opacity", f.paperOpacity);
            set("--paper-scale", f.paperScale);
            set("--paper-y", f.paperY, "vh");
            set("--paper-rotation", f.paperRotation, "deg");
            set("--names-opacity", f.namesOpacity);
            set("--names-y", f.namesY, "px");
            set("--welcome-details", f.detailsOpacity);
            set("--fan-exit", smoothRange(0, 0.48, progress));
            set("--fan-opacity", 1 - smoothRange(0.16, 0.4, progress));
            set("--scroll-hint", 1 - smoothRange(0.75, 0.95, progress));
          } else if (kind === "vow") {
            for (let i = 0; i < 3; i++) {
              const part = smoothRange(
                0.04 + i * 0.17,
                0.33 + i * 0.17,
                progress,
              );
              set(`--line-${i}`, part);
              set(`--line-y-${i}`, (1 - part) * 65, "px");
            }
            set("--vow-copy", smoothRange(0.52, 0.8, progress));
            set(
              "--vow-copy-y",
              (1 - smoothRange(0.52, 0.8, progress)) * 30,
              "px",
            );
            set("--watermark-y", -progress * 80, "px");
          } else if (kind === "date") {
            const entry = smoothRange(0, 0.68, progress);
            set("--date-y", (1 - entry) * 180, "px");
            set("--date-rotate", (1 - entry) * 14 - 2, "deg");
            set("--date-scale", 0.76 + entry * 0.24);
            set("--date-copy", smoothRange(0.05, 0.4, progress));
            set(
              "--date-copy-y",
              (1 - smoothRange(0.05, 0.4, progress)) * 55,
              "px",
            );
          } else {
            const entry = smoothRange(0, 1, progress);
            set("--reveal", entry);
            set("--reveal-y", (1 - entry) * 70, "px");
            set("--art-rotate", (1 - entry) * -7, "deg");
          }
        };
        const schedule = () => {
          if (!frame) frame = requestAnimationFrame(render);
        };
        const resize = new ResizeObserver(() => {
          last = -1;
          schedule();
        });
        resize.observe(this.element);
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule, { passive: true });
        media.addEventListener("change", schedule);
        // Keyboard navigation never leaves an active control visually hidden.
        const focus = () => {
          if (this.scrollScene() === "reveal")
            this.element.classList.add("has-focus");
        };
        this.element.addEventListener("focusin", focus);
        render();
        this.destroy.onDestroy(() => {
          cancelAnimationFrame(frame);
          resize.disconnect();
          window.removeEventListener("scroll", schedule);
          window.removeEventListener("resize", schedule);
          media.removeEventListener("change", schedule);
          this.element.removeEventListener("focusin", focus);
        });
      }),
    );
  }
}
