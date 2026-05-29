import { describe, expect, test } from "vitest";
import { createApiClient } from "./api.ts";

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init
  });
}

describe("web API client", () => {
  test("uploads selected files to the imports endpoint as multipart form data", async () => {
    const requests: Array<{ input: RequestInfo | URL; init: RequestInit | undefined }> = [];
    const client = createApiClient(async (input, init) => {
      requests.push({ input, init });
      return jsonResponse({
        ok: true,
        data: {
          packId: "pack_1",
          sourceCount: 1,
          duplicateCount: 0,
          preview: {
            messages: [{ speaker: "Me", text: "coffee later?", timestamp: "10:02" }]
          }
        }
      });
    });

    const file = new File(["Me: coffee later?"], "chat.txt", { type: "text/plain" });
    const result = await client.uploadImport({
      packName: "Rain",
      type: "pursuit",
      language: "en",
      consentConfirmed: true,
      files: [file]
    });

    expect(requests).toHaveLength(1);
    expect(requests[0]?.input).toBe("/api/imports");
    expect(requests[0]?.init?.method).toBe("POST");
    const body = requests[0]?.init?.body;
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("packName")).toBe("Rain");
    expect((body as FormData).get("type")).toBe("pursuit");
    expect((body as FormData).get("language")).toBe("en");
    expect((body as FormData).get("consentConfirmed")).toBe("true");
    expect((body as FormData).getAll("files")).toHaveLength(1);
    expect(result.packId).toBe("pack_1");
    expect(result.preview?.messages[0]?.speaker).toBe("Me");
  });

  test("normalizes pack lists and pursuit responses from API envelopes", async () => {
    const client = createApiClient(async (input) => {
      if (input === "/api/packs") {
        return jsonResponse({ ok: true, data: { packs: [{ id: "pack_1", name: "Rain", type: "pursuit", language: "zh" }] } });
      }
      return jsonResponse({
        ok: true,
        data: {
          reportId: "report_1",
          report: {
            stage: "warm",
            goal: "ask_out",
            confidence: 0.81,
            warmthSignals: [],
            riskSignals: [],
            evidence: [],
            strategy: { action: "soft_invite", summary: "low pressure invite", nextMove: "ask around the exhibit" },
            safety: { boundaryDetected: false, nonManipulation: ["no pressure"] },
            communicationStyle: { sentenceLength: "mixed", initiative: "medium", tone: ["responsive"], replyRhythm: "balanced" },
            interestMap: { strong: ["coffee"], possible: [], avoid: [] }
          },
          replies: [{ label: "Safe", text: "Sounds good", why: "low pressure", expectedEffect: "keeps it easy", risk: "none", boundarySafe: true }],
          topicPlan: { lowRiskTopics: ["coffee"], interestBasedTopics: [], inviteTopics: [], avoidTopics: [], boundaries: [], markdown: "" }
        }
      });
    });

    await expect(client.listPacks()).resolves.toEqual([{ id: "pack_1", name: "Rain", type: "pursuit", language: "zh" }]);
    const pursuit = await client.createPursuitReport("pack_1", {
      me: "我",
      ta: "TA",
      goal: "ask_out",
      latest: "你也喜欢这种吗？",
      style: "natural"
    });
    expect(pursuit.reportId).toBe("report_1");
    expect(pursuit.report.stage).toBe("warm");
    expect(pursuit.replies[0]?.label).toBe("Safe");
  });

  test("creates exports and fetches downloadable blobs", async () => {
    const client = createApiClient(async (input, init) => {
      if (input === "/api/packs/pack_1/exports") {
        expect(init?.method).toBe("POST");
        expect(init?.body).toBe(JSON.stringify({ target: "sillytavern" }));
        return jsonResponse({ ok: true, data: { exportId: "export_1" } });
      }
      if (input === "/api/exports/export_1/download") {
        return new Response(new Uint8Array([0x50, 0x4b]), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    });

    const created = await client.createExport("pack_1", "sillytavern");
    const blob = await client.downloadExport(created.exportId);

    expect(created.exportId).toBe("export_1");
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(new Uint8Array([0x50, 0x4b]));
  });

  test("renders an avatar video by posting image + audio to /api/avatar/render", async () => {
    const requests: Array<{ input: RequestInfo | URL; init: RequestInit | undefined }> = [];
    const client = createApiClient(async (input, init) => {
      requests.push({ input, init });
      return new Response(new Uint8Array([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]), { status: 200 });
    });

    const blob = await client.renderAvatarVideo({
      image: new File([new Uint8Array([1])], "face.png", { type: "image/png" }),
      audio: new File([new Uint8Array([2])], "voice.wav", { type: "audio/wav" })
    });

    expect(requests[0]?.input).toBe("/api/avatar/render");
    expect(requests[0]?.init?.method).toBe("POST");
    const body = requests[0]?.init?.body;
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("image")).toBeInstanceOf(File);
    expect((body as FormData).get("audio")).toBeInstanceOf(File);
    expect((await blob.arrayBuffer()).byteLength).toBe(8);
  });
});
