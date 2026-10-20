import { Component, inject, signal } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../core/auth.service";
@Component({
  selector: "app-login",
  imports: [ReactiveFormsModule, RouterLink],
  template: `<main class="admin-login">
    <a routerLink="/" class="monogram">TM</a>
    <p class="eyebrow">FOR THE HOSTS</p>
    <h1>A celebration to plan.</h1>
    <p>Sign in to manage your invitations and replies.</p>
    <form
      class="admin-panel admin-form"
      [formGroup]="form"
      (ngSubmit)="login()"
    >
      <label
        >Email<input
          type="email"
          formControlName="email"
          autocomplete="username"
          required /></label
      ><label
        >Password<input
          type="password"
          formControlName="password"
          autocomplete="current-password"
          required
      /></label>
      @if (error()) {
        <p role="alert" class="form-error">{{ error() }}</p>
      }
      <button class="button" [disabled]="busy() || form.invalid">
        {{ busy() ? "Signing in…" : "Sign in" }}
      </button>
      <button
        type="button"
        class="text-link"
        (click)="resetPassword()"
        [disabled]="busy() || resetting() || form.controls.email.invalid"
      >
        {{ resetting() ? "Sending password link…" : "Set or reset password" }}
      </button>
      @if (notice()) {
        <p role="status">{{ notice() }}</p>
      }
    </form>
    <p class="muted" style="font-size:.8rem;margin-top:1rem">
      Private access for Mostafa & Tasneem.
    </p>
  </main>`,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  readonly busy = signal(false);
  readonly error = signal("");
  readonly resetting = signal(false);
  readonly notice = signal("");
  readonly form = new FormGroup({
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
  async login() {
    if (this.form.invalid || this.busy() || this.resetting()) return;
    this.busy.set(true);
    this.error.set("");
    try {
      const v = this.form.getRawValue();
      await this.auth.login(v.email, v.password);
      await this.router.navigateByUrl("/admin");
    } catch (e) {
      this.error.set(
        e instanceof Error && !("code" in e)
          ? e.message
          : "Unable to sign in. Check your email, password, and connection.",
      );
    } finally {
      this.busy.set(false);
    }
  }
  async resetPassword() {
    if (this.form.controls.email.invalid || this.busy() || this.resetting())
      return;
    this.resetting.set(true);
    this.error.set("");
    this.notice.set("");
    try {
      await this.auth.resetPassword(this.form.controls.email.value);
      this.notice.set(
        "If this email has an account, a password link is on its way. Check your inbox and spam folder.",
      );
    } catch {
      this.error.set(
        "Unable to send a password link. Check the email and try again shortly.",
      );
    } finally {
      this.resetting.set(false);
    }
  }
}
