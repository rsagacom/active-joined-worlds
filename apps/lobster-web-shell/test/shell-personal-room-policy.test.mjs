// shell-personal-room-policy.test.mjs — 私宅访问策略控件纯状态测试
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  appliedPersonalRoomAccessPolicy,
  personalRoomAccessPolicyControlState,
  personalRoomAccessPolicyForRoom,
  personalRoomAccessPolicyLabel,
  personalRoomAccessPolicySubmitRequestState,
} from "../shell-personal-room-policy.js";

function ownership(value) {
  return () => value;
}

test("personalRoomAccessPolicyForRoom defaults to friends_only and accepts registered_all", () => {
  assert.equal(personalRoomAccessPolicyForRoom(null), "friends_only");
  assert.equal(personalRoomAccessPolicyForRoom({ personal_room_access_policy: "unknown" }), "friends_only");
  assert.equal(personalRoomAccessPolicyForRoom({ personal_room_access_policy: "registered_all" }), "registered_all");
});

test("personalRoomAccessPolicyLabel returns compact UI copy with safe fallback", () => {
  assert.equal(personalRoomAccessPolicyLabel("friends_only"), "好友");
  assert.equal(personalRoomAccessPolicyLabel("registered_all"), "注册");
  assert.equal(personalRoomAccessPolicyLabel("bad-policy"), "好友");
});

test("personalRoomAccessPolicyControlState hides for non-owner rooms", () => {
  assert.deepEqual(
    personalRoomAccessPolicyControlState({
      room: { personal_room_access_policy: "registered_all" },
      currentIdentity: "alice",
      gatewayUrl: "http://gateway",
      saving: false,
      roomOwnershipForState: ownership("visitor"),
    }),
    {
      hidden: true,
      ariaHidden: "true",
      policy: "registered_all",
      disabled: true,
      statusText: "",
      statusIsError: false,
    },
  );
});

test("personalRoomAccessPolicyControlState disables owner control while offline", () => {
  assert.deepEqual(
    personalRoomAccessPolicyControlState({
      room: { personal_room_access_policy: "friends_only" },
      currentIdentity: "alice",
      gatewayUrl: "",
      saving: false,
      roomOwnershipForState: ownership("own"),
    }),
    {
      hidden: false,
      ariaHidden: "false",
      policy: "friends_only",
      disabled: true,
      statusText: "离线",
      statusIsError: true,
    },
  );
});

test("personalRoomAccessPolicyControlState reports saving state before online label", () => {
  assert.deepEqual(
    personalRoomAccessPolicyControlState({
      room: { personal_room_access_policy: "registered_all" },
      currentIdentity: "alice",
      gatewayUrl: "http://gateway",
      saving: true,
      roomOwnershipForState: ownership("own"),
    }),
    {
      hidden: false,
      ariaHidden: "false",
      policy: "registered_all",
      disabled: true,
      statusText: "保存中",
      statusIsError: false,
    },
  );
});

test("personalRoomAccessPolicyControlState enables owner control online", () => {
  assert.deepEqual(
    personalRoomAccessPolicyControlState({
      room: { personal_room_access_policy: "registered_all" },
      currentIdentity: "alice",
      gatewayUrl: "http://gateway",
      saving: false,
      roomOwnershipForState: ownership("own"),
    }),
    {
      hidden: false,
      ariaHidden: "false",
      policy: "registered_all",
      disabled: false,
      statusText: "注册",
      statusIsError: false,
    },
  );
});

test("personalRoomAccessPolicySubmitRequestState ignores invalid policies without UI churn", () => {
  assert.deepEqual(
    personalRoomAccessPolicySubmitRequestState({
      policy: "public",
      room: { personal_room_access_policy: "friends_only" },
      currentIdentity: "alice",
      gatewayUrl: "http://gateway",
      roomOwnershipForState: ownership("own"),
    }),
    {
      allowed: false,
      reason: "invalid-policy",
      statusText: "",
      statusIsError: false,
      shouldSyncControl: false,
    },
  );
});

test("personalRoomAccessPolicySubmitRequestState blocks non-owners and offline owners with status copy", () => {
  assert.deepEqual(
    personalRoomAccessPolicySubmitRequestState({
      policy: "registered_all",
      room: { personal_room_access_policy: "friends_only" },
      currentIdentity: "alice",
      gatewayUrl: "http://gateway",
      roomOwnershipForState: ownership("visitor"),
    }),
    {
      allowed: false,
      reason: "not-owner",
      statusText: "房主",
      statusIsError: true,
      shouldSyncControl: true,
    },
  );
  assert.deepEqual(
    personalRoomAccessPolicySubmitRequestState({
      policy: "registered_all",
      room: { personal_room_access_policy: "friends_only" },
      currentIdentity: "alice",
      gatewayUrl: "",
      roomOwnershipForState: ownership("own"),
    }),
    {
      allowed: false,
      reason: "offline",
      statusText: "离线",
      statusIsError: true,
      shouldSyncControl: true,
    },
  );
});

test("personalRoomAccessPolicySubmitRequestState returns the gateway request for owner submissions", () => {
  assert.deepEqual(
    personalRoomAccessPolicySubmitRequestState({
      policy: "registered_all",
      room: { personal_room_access_policy: "friends_only" },
      currentIdentity: "alice",
      gatewayUrl: "http://gateway",
      roomOwnershipForState: ownership("own"),
    }),
    {
      allowed: true,
      reason: "",
      endpoint: "/v1/personal-room/access-policy",
      payload: {
        resident_id: "alice",
        policy: "registered_all",
      },
    },
  );
});

test("appliedPersonalRoomAccessPolicy trusts valid gateway policy and falls back to requested policy", () => {
  assert.equal(
    appliedPersonalRoomAccessPolicy({ policy: "friends_only" }, "registered_all"),
    "friends_only",
  );
  assert.equal(
    appliedPersonalRoomAccessPolicy({ policy: "unknown" }, "registered_all"),
    "registered_all",
  );
  assert.equal(
    appliedPersonalRoomAccessPolicy({ policy: "unknown" }, "unknown"),
    "friends_only",
  );
});
