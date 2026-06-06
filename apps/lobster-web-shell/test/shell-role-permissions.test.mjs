import test from "node:test";
import assert from "node:assert/strict";
import {
  roleAllowsApproveJoin,
  roleAllowsCreatePublicRoom,
  roleAllowsFreezeRoom,
  roleAllowsManageStewards,
  roleAllowsUpdateFederation,
} from "../shell-role-permissions.js";

test("Lord can perform all city governance role actions", () => {
  assert.equal(roleAllowsCreatePublicRoom("Lord"), true);
  assert.equal(roleAllowsApproveJoin("Lord"), true);
  assert.equal(roleAllowsFreezeRoom("Lord"), true);
  assert.equal(roleAllowsManageStewards("Lord"), true);
  assert.equal(roleAllowsUpdateFederation("Lord"), true);
});

test("Steward can freeze rooms but cannot mutate lord-only governance", () => {
  assert.equal(roleAllowsCreatePublicRoom("Steward"), false);
  assert.equal(roleAllowsApproveJoin("Steward"), false);
  assert.equal(roleAllowsFreezeRoom("Steward"), true);
  assert.equal(roleAllowsManageStewards("Steward"), false);
  assert.equal(roleAllowsUpdateFederation("Steward"), false);
});

test("Resident and empty roles cannot perform city governance role actions", () => {
  for (const role of ["Resident", "", null, undefined]) {
    assert.equal(roleAllowsCreatePublicRoom(role), false);
    assert.equal(roleAllowsApproveJoin(role), false);
    assert.equal(roleAllowsFreezeRoom(role), false);
    assert.equal(roleAllowsManageStewards(role), false);
    assert.equal(roleAllowsUpdateFederation(role), false);
  }
});
