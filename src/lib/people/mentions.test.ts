import { describe, expect, it } from "vitest";
import { botsToAnswer, MAX_GROUP_REPLIES } from "./mentions";

const bots = [{ name: "Analyst" }, { name: "مساعد" }, { name: "Writer" }];

describe("botsToAnswer", () => {
  it("lets every bot reply when nobody is mentioned", () => {
    expect(botsToAnswer("plan my week", bots).map((b) => b.name)).toEqual(["Analyst", "مساعد", "Writer"]);
  });
  it("limits the reply to mentioned bots", () => {
    expect(botsToAnswer("@مساعد help", bots).map((b) => b.name)).toEqual(["مساعد"]);
  });
  it("caps replies per message", () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ name: `Bot${i}` }));
    expect(botsToAnswer("hi", many)).toHaveLength(MAX_GROUP_REPLIES);
  });
});
