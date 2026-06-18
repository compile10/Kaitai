import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  userAc,
} from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements,
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
