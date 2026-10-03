import { Component } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideRouter, RouterOutlet } from "@angular/router";
import { wedding } from "./app/config/wedding.config";
@Component({
  selector: "app-root",
  imports: [RouterOutlet],
  template: "<router-outlet />",
})
class App {
  constructor() {
    for (const [key, value] of Object.entries(wedding.theme))
      document.documentElement.style.setProperty("--" + key, value);
  }
}
bootstrapApplication(App, {
  providers: [
    provideRouter([
      {
        path: "",
        loadComponent: () =>
          import("./app/features/invitation/invitation.component").then(
            (m) => m.InvitationComponent,
          ),
      },
      {
        path: "invite/:token",
        loadComponent: () =>
          import("./app/features/invitation/invitation.component").then(
            (m) => m.InvitationComponent,
          ),
      },
      {
        path: "preview",
        loadComponent: () =>
          import("./app/features/invitation/invitation.component").then(
            (m) => m.InvitationComponent,
          ),
      },
      {
        path: "admin/login",
        loadComponent: () =>
          import("./app/features/admin/login.component").then(
            (m) => m.LoginComponent,
          ),
      },
      {
        path: "admin",
        loadChildren: () =>
          import("./app/features/admin/admin.routes").then(
            (m) => m.ADMIN_ROUTES,
          ),
      },
      { path: "**", redirectTo: "" },
    ]),
  ],
}).catch(console.error);
