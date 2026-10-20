import { Component, DestroyRef, inject, signal } from "@angular/core";
import { ScrollSceneDirective } from "../../shared/scroll-scene.directive";
import { UpperCasePipe } from "@angular/common";
import { ActivatedRoute, RouterLink } from "@angular/router";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { wedding } from "../../config/wedding.config";
import {
  countdown,
  emptyRsvp,
  type Invitation,
  type Rsvp,
} from "../../core/models";
import { InvitationService } from "../../core/invitation.service";
@Component({
  selector: "app-invitation",
  imports: [
    ReactiveFormsModule,
    RouterLink,
    UpperCasePipe,
    ScrollSceneDirective,
  ],
  templateUrl: "./invitation.component.html",
  styleUrls: ["./invitation.component.css", "./invitation-fan.css"],
})
export class InvitationComponent {
  readonly config = wedding;
  readonly pagePath = location.pathname;
  readonly dateParts = {
    day: new Intl.DateTimeFormat("en", {
      day: "numeric",
      timeZone: "Africa/Cairo",
    }).format(new Date(wedding.date)),
    month: new Intl.DateTimeFormat("en", {
      month: "long",
      timeZone: "Africa/Cairo",
    }).format(new Date(wedding.date)),
    weekday: new Intl.DateTimeFormat("en", {
      weekday: "long",
      timeZone: "Africa/Cairo",
    }).format(new Date(wedding.date)),
    year: new Intl.DateTimeFormat("en", {
      year: "numeric",
      timeZone: "Africa/Cairo",
    }).format(new Date(wedding.date)),
  };
  private readonly service = inject(InvitationService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy = inject(DestroyRef);
  readonly loading = signal(true);
  readonly error = signal("");
  readonly invitation = signal<Invitation | null>(null);
  readonly opened = signal(false);
  readonly opening = signal(false);
  readonly playing = signal(false);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly saveError = signal("");
  readonly musicError = signal("");
  readonly remaining = signal(countdown(wedding.date));
  readonly units = ["days", "hours", "minutes", "seconds"];
  readonly preview = this.route.snapshot.routeConfig?.path === "preview";
  readonly general =
    !this.route.snapshot.paramMap.get("token") && !this.preview;
  readonly form = new FormGroup({
    status: new FormControl<"attending" | "declined" | "">("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    attendingCount: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.min(1)],
    }),
    message: new FormControl("", {
      nonNullable: true,
      validators: [Validators.maxLength(1000)],
    }),
  });
  private audio: HTMLAudioElement | null = null;
  private focusTimer: ReturnType<typeof setTimeout> | undefined;
  private originalOverflow = "";
  private openingTimer: ReturnType<typeof setTimeout> | undefined;
  private openingResize: ResizeObserver | undefined;
  constructor() {
    void this.load();
    const timer = setInterval(
      () => this.remaining.set(countdown(wedding.date)),
      1000,
    );
    this.destroy.onDestroy(() => {
      clearInterval(timer);
      clearTimeout(this.openingTimer);
      clearTimeout(this.focusTimer);
      this.openingResize?.disconnect();
      if (this.opening())
        document.documentElement.style.overflow = this.originalOverflow;
      this.audio?.pause();
    });
  }
  get counts() {
    return Array.from(
      { length: this.invitation()?.invitedCount ?? 1 },
      (_, i) => i + 1,
    );
  }
  async load() {
    this.loading.set(true);
    this.error.set("");
    try {
      if (this.preview) {
        const demo: Invitation = {
          token: "preview",
          displayName: "Dear friends",
          invitedCount: 2,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          openedAt: null,
          rsvp: emptyRsvp(),
        };
        try {
          const stored = sessionStorage.getItem("tm-preview-rsvp");
          if (stored) demo.rsvp = JSON.parse(stored) as Rsvp;
        } catch {
          /* Preview storage is optional. */
        }
        this.invitation.set(demo);
      } else if (!this.general) {
        this.invitation.set(
          await this.service.load(
            this.route.snapshot.paramMap.get("token") ?? "",
          ),
        );
        if (!this.invitation())
          this.error.set(
            "This invitation could not be found. Please ask Mostafa or Tasneem to resend your private link.",
          );
      }
      const r = this.invitation()?.rsvp;
      if (r && r.status !== "pending")
        this.form.patchValue({
          status: r.status,
          attendingCount: Math.max(1, r.attendingCount),
          message: r.message,
        });
    } catch {
      this.error.set(
        "We couldn’t open your invitation right now. Please check your connection and try again.",
      );
    } finally {
      this.loading.set(false);
    }
  }
  open() {
    if (this.opening() || this.opened()) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const envelope = document.querySelector<HTMLElement>(".envelope");
    const chapter = document.querySelector<HTMLElement>(".opening-chapter");
    const viewport = chapter?.querySelector<HTMLElement>(".opening-viewport");
    const camera = chapter?.querySelector<HTMLElement>(".envelope-camera");
    const space = chapter?.querySelector<HTMLElement>(".envelope-space");
    if (camera && space && chapter) {
      // Hand the current arrival/float pose to the opening animation. Removing
      // the arrival animation otherwise makes the zoom snap to its final pose.
      const pose = new DOMMatrixReadOnly(getComputedStyle(camera).transform)
        .multiply(new DOMMatrixReadOnly(getComputedStyle(space).transform));
      chapter.style.setProperty("--camera-start-transform", pose.toString());
      chapter.style.setProperty("--camera-start-opacity", getComputedStyle(camera).opacity);
    }
    if (envelope && chapter && viewport) {
      const syncPocket = () => {
        // Untransformed dimensions keep the artwork and pocket aligned even
        // after an orientation change or mobile browser toolbar resize.
        const width = envelope.offsetWidth;
        const height = envelope.offsetHeight;
        if (!width || !height) return;
        const sceneHeight = reduced ? innerHeight : viewport.clientHeight;
        const zoom = Math.max(viewport.clientWidth / width, sceneHeight / height) * 1.08;
        chapter.style.setProperty("--camera-zoom", String(zoom));
        chapter.style.setProperty("--pocket-width", `${width * zoom}px`);
        chapter.style.setProperty("--pocket-height", `${height * zoom}px`);
      };
      syncPocket();
      this.openingResize = new ResizeObserver(syncPocket);
      this.openingResize.observe(envelope);
      this.openingResize.observe(viewport);
    }
    this.originalOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    this.opening.set(true);
    const invitation = this.invitation();
    if (!this.preview && invitation?.openedAt === null)
      void this.service
        .markOpened(invitation)
        .then(() =>
          this.invitation.update((current) =>
            current ? { ...current, openedAt: Date.now() } : current,
          ),
        )
        .catch(() => {
          /* Opening the invitation must not be blocked by telemetry failure. */
        });
    void this.toggleMusic();
    this.openingTimer = setTimeout(
      () => {
        this.opened.set(true);
        this.opening.set(false);
        document.documentElement.style.overflow = this.originalOverflow;
        this.focusTimer = setTimeout(() => {
          document
            .getElementById(reduced ? "welcome-heading" : "unfold-cue")
            ?.focus({ preventScroll: true });
        }, 0);
      },
      reduced ? 30 : 3650,
    );
  }
  continueStory() {
    const chapter = document.querySelector<HTMLElement>(".opening-chapter");
    if (!chapter) return;
    const top =
      chapter.offsetTop +
      Math.max(0, chapter.offsetHeight - innerHeight) * 0.87;
    window.scrollTo({
      top,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  downloadCalendar() {
    const stamp = (date: string) =>
      new Date(date)
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}Z$/, "Z");
    const escape = (value: string) =>
      value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;");
    const calendar = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//TM Wedding//Invitation//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:tm-wedding-20261127@${location.hostname}`,
      `DTSTAMP:${stamp(new Date().toISOString())}`,
      `DTSTART:${stamp(this.config.date)}`,
      `DTEND:${stamp(this.config.endDate)}`,
      `SUMMARY:${escape(`${this.config.groom} & ${this.config.bride}'s Wedding`)}`,
      `LOCATION:${escape(`${this.config.venue}, ${this.config.address}`)}`,
      `DESCRIPTION:${escape(this.config.invitationMessage)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob([calendar], { type: "text/calendar;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "mostafa-and-tasneem-wedding.ics";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
  async toggleMusic() {
    if (!this.config.music) return;
    if (!this.audio) {
      this.audio = new Audio(this.config.music);
      this.audio.loop = true;
      this.audio.volume = 0.25;
      this.audio.preload = "none";
    }
    if (this.playing()) {
      this.audio.pause();
      this.playing.set(false);
    } else {
      try {
        await this.audio.play();
        this.playing.set(true);
        this.musicError.set("");
      } catch {
        this.playing.set(false);
        this.musicError.set(
          "Music is unavailable. You can still enjoy the invitation.",
        );
      }
    }
  }
  async submit() {
    if (this.saving()) return;
    this.form.markAllAsTouched();
    const invitation = this.invitation();
    if (!invitation || this.form.invalid) return;
    const values = this.form.getRawValue();
    if (!values.status) return;
    const rsvp: Rsvp = {
      status: values.status,
      attendingCount:
        values.status === "attending" ? Number(values.attendingCount) : 0,
      message: values.message.trim(),
      updatedAt: Date.now(),
    };
    this.saving.set(true);
    this.saveError.set("");
    try {
      if (this.preview) {
        sessionStorage.setItem("tm-preview-rsvp", JSON.stringify(rsvp));
      } else {
        await this.service.saveRsvp(invitation, rsvp);
      }
      this.invitation.set({ ...invitation, rsvp });
      this.saved.set(true);
    } catch {
      this.saveError.set(
        "We couldn’t confirm your response. Please reconnect and retry. If a save was already in progress, it may finish when your connection returns.",
      );
    } finally {
      this.saving.set(false);
    }
  }
}
