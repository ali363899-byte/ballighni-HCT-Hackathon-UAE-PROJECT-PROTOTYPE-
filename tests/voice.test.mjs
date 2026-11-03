import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveVoiceCommand } from "../frontend/voice.js";

test("voice navigation recognizes explicit English and Arabic commands only", () => {
  assert.equal(resolveVoiceCommand("Open my cases."), "cases");
  assert.equal(resolveVoiceCommand("افتح بلاغ جديد"), "report");
  assert.equal(resolveVoiceCommand("Read this page!"), "read");
  assert.equal(resolveVoiceCommand("إيقاف القراءة"), "stop");
  assert.equal(resolveVoiceCommand("submit this report"), null);
  assert.equal(resolveVoiceCommand("call police"), null);
  assert.equal(resolveVoiceCommand("delete everything"), null);
  assert.equal(
    resolveVoiceCommand("I saw someone open my cases before the incident"),
    null,
  );
});
