export function roleAllowsCreatePublicRoom(role) {
  return role === "Lord";
}

export function roleAllowsApproveJoin(role) {
  return role === "Lord";
}

export function roleAllowsFreezeRoom(role) {
  return role === "Lord" || role === "Steward";
}

export function roleAllowsManageStewards(role) {
  return role === "Lord";
}

export function roleAllowsUpdateFederation(role) {
  return role === "Lord";
}
