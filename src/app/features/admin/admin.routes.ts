import type { Routes } from "@angular/router";
import { adminGuard } from "../../core/admin.guard";
export const ADMIN_ROUTES: Routes = [
  {
    path: "",
    canActivate: [adminGuard],
    loadComponent: () =>
      import("./admin.component").then((m) => m.AdminComponent),
  },
];
