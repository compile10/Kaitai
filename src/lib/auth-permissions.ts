import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  userAc,
} from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements,
  // Stable gate for "can enter the admin area", decoupled from any feature so
  // that removing a feature (e.g. invites) never affects panel visibility.
  adminPanel: ["access"],
  invite: ["create"],
} as const;

export const ac = createAccessControl(statement);

export const adminRole = ac.newRole({
  ...adminAc.statements,
  adminPanel: ["access"],
  invite: ["create"],
});

export const userRole = ac.newRole({
  ...userAc.statements,
  adminPanel: [],
  invite: [],
});
