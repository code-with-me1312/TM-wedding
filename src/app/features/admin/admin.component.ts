import { Component, computed, inject, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { InvitationService } from "../../core/invitation.service";
import { AuthService } from "../../core/auth.service";
import {
  statistics,
  type Invitation,
  type RsvpStatus,
} from "../../core/models";
import { wedding } from "../../config/wedding.config";
@Component({
  selector: "app-admin",
  imports: [DatePipe, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: "./admin.component.html",
  styleUrl: "./admin.component.css",
})
export class AdminComponent {
  private service = inject(InvitationService);
  private auth = inject(AuthService);
  private router = inject(Router);
  readonly invitations = signal<Invitation[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal("");
  readonly notice = signal("");
  readonly search = signal("");
  readonly filter = signal("all");
  readonly showForm = signal(false);
  readonly editing = signal<Invitation | null>(null);
  readonly deleting = signal<Invitation | null>(null);
  readonly stats = computed(() => {
    const s = statistics(this.invitations());
    return [
      { label: "Invitations", value: s.total },
      { label: "Confirmed invitations", value: s.confirmed },
      { label: "Declined", value: s.declined },
      { label: "Awaiting reply", value: s.pending },
      { label: "Opened", value: s.opened },
    ];
  });
  readonly filtered = computed(() =>
    this.invitations().filter(
      (i) =>
        i.displayName.toLowerCase().includes(this.search().toLowerCase()) &&
        (this.filter() === "all" || i.rsvp.status === this.filter()),
    ),
  );
  readonly form = new FormGroup({
    displayName: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
  });
  constructor() {
    void this.refresh();
  }
  async refresh() {
    this.loading.set(true);
    this.error.set("");
    try {
      this.invitations.set(await this.service.list());
    } catch {
      this.error.set(
        "Could not load invitations. Check your connection and administrator access, then retry.",
      );
    } finally {
      this.loading.set(false);
    }
  }
  create() {
    this.editing.set(null);
    this.form.reset({ displayName: "" });
    this.showForm.set(true);
  }
  edit(i: Invitation) {
    this.editing.set(i);
    this.form.reset({ displayName: i.displayName });
    this.showForm.set(true);
  }
  async save() {
    if (this.form.invalid || this.busy()) return;
    const value = this.form.getRawValue();
    if (!value.displayName.trim()) {
      this.form.controls.displayName.setErrors({ required: true });
      return;
    }
    this.busy.set(true);
    this.error.set("");
    try {
      const editing = this.editing();
      if (editing)
        await this.service.edit(editing, value.displayName.trim());
      else await this.service.create(value.displayName.trim());
      this.showForm.set(false);
      this.notice.set(
        editing
          ? "Invitation updated."
          : "Invitation created. Your private link is ready.",
      );
      await this.refresh();
    } catch (e) {
      this.error.set(
        e instanceof Error && !("code" in e)
          ? e.message
          : "Unable to save. Please check your connection and try again.",
      );
    } finally {
      this.busy.set(false);
    }
  }
  async remove() {
    const i = this.deleting();
    if (!i || this.busy()) return;
    this.busy.set(true);
    try {
      await this.service.delete(i.token);
      this.deleting.set(null);
      this.notice.set("Invitation deleted. Its link is no longer valid.");
      await this.refresh();
    } catch {
      this.error.set("Unable to delete this invitation. Please retry.");
    } finally {
      this.busy.set(false);
    }
  }
  url(i: Invitation) {
    return `${location.origin}/invite/${i.token}`;
  }
  whatsapp(i: Invitation) {
    const text = wedding.whatsappTemplate
      .replaceAll("{name}", i.displayName)
      .replaceAll("{url}", this.url(i));
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }
  async copy(i: Invitation) {
    try {
      await navigator.clipboard.writeText(this.url(i));
      this.notice.set(`Link copied for ${i.displayName}.`);
    } catch {
      this.notice.set(
        "Clipboard unavailable. Select and copy the invitation URL below.",
      );
    }
  }
  async logout() {
    await this.auth.logout();
    await this.router.navigateByUrl("/admin/login");
  }
  statusLabel(status: RsvpStatus) {
    return {
      pending: "Awaiting reply",
      attending: "Attending",
      declined: "Declined",
    }[status];
  }
}
