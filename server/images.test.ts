import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

describe("images router", () => {
  it("has generate procedure defined", () => {
    expect(appRouter.images.generate).toBeDefined();
  });

  it("has generateTemplate procedure defined", () => {
    expect(appRouter.images.generateTemplate).toBeDefined();
  });

  it("has searchStock procedure defined", () => {
    expect(appRouter.images.searchStock).toBeDefined();
  });
});

describe("ghl router", () => {
  it("has getSettings procedure defined", () => {
    expect(appRouter.ghl.getSettings).toBeDefined();
  });

  it("has saveSettings procedure defined", () => {
    expect(appRouter.ghl.saveSettings).toBeDefined();
  });

  it("has testConnection procedure defined", () => {
    expect(appRouter.ghl.testConnection).toBeDefined();
  });

  it("has pushToSocialPlanner procedure defined", () => {
    expect(appRouter.ghl.pushToSocialPlanner).toBeDefined();
  });

  it("has syncCalendar procedure defined", () => {
    expect(appRouter.ghl.syncCalendar).toBeDefined();
  });
});
