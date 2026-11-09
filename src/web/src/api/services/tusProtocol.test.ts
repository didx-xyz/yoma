import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { AxiosInstance } from "axios";
import {
  TusUploadRejectedError,
  isTusUploadRejected,
  uploadFileInChunks,
} from "./tusProtocol";

/** An Axios-shaped failure: the server answered with `status`. */
class HttpError extends Error {
  response: { status: number };
  constructor(status: number) {
    super(`Request failed with status code ${status}`);
    this.response = { status };
  }
}

type Reply = { status: number } | { offset: number; length: number };

/**
 * A fake Axios instance for one upload path. `head` and `patch` take their answers from the
 * queues in order; a queue that runs dry keeps answering with its last entry. Every call is
 * recorded so a test can assert exactly which requests went out.
 */
const fakeInstance = (heads: Reply[], patches: Reply[]) => {
  const calls: string[] = [];
  const next = (queue: Reply[]): Reply => {
    const reply = queue.length > 1 ? queue.shift()! : queue[0]!;
    if ("status" in reply) throw new HttpError(reply.status);
    return reply;
  };
  const instance = {
    head: async (path: string) => {
      calls.push(`HEAD ${path}`);
      const reply = next(heads) as { offset: number; length: number };
      return {
        headers: {
          "upload-offset": String(reply.offset),
          "upload-length": String(reply.length),
        },
      };
    },
    patch: async (path: string, data: ArrayBuffer) => {
      calls.push(`PATCH ${path} ${data.byteLength}`);
      const reply = next(patches) as { offset: number; length: number };
      return { headers: { "upload-offset": String(reply.offset) } };
    },
  } as unknown as AxiosInstance; // only head/patch are exercised by uploadFileInChunks
  return { instance, calls };
};

const file = new File([new Uint8Array(10)], "proof.pdf", {
  type: "application/pdf",
});
const path = "/uploads/abc";
const noDelays: number[] = [0, 0, 0];
const silence = () => {
  const { log, warn, error } = console;
  console.log = console.warn = console.error = () => {};
  return () => Object.assign(console, { log, warn, error });
};

describe("uploadFileInChunks", () => {
  test("uploads the file in chunks and reports progress", async () => {
    const restore = silence();
    try {
      const { instance, calls } = fakeInstance(
        [
          { offset: 0, length: 10 },
          { offset: 4, length: 10 },
          { offset: 8, length: 10 },
        ],
        [
          { offset: 4, length: 10 },
          { offset: 8, length: 10 },
          { offset: 10, length: 10 },
        ],
      );
      const progress: number[] = [];
      await uploadFileInChunks(instance, path, file, 4, noDelays, (n) =>
        progress.push(n),
      );
      assert.deepEqual(calls, [
        "HEAD /uploads/abc",
        "PATCH /uploads/abc 4",
        "HEAD /uploads/abc",
        "PATCH /uploads/abc 4",
        "HEAD /uploads/abc",
        "PATCH /uploads/abc 2",
      ]);
      assert.deepEqual(progress, [4, 8, 10]);
    } finally {
      restore();
    }
  });

  test("a 409 on PATCH re-syncs the offset from HEAD and continues (recoverable)", async () => {
    const restore = silence();
    try {
      const { instance, calls } = fakeInstance(
        [
          { offset: 0, length: 10 },
          { offset: 6, length: 10 }, // the server had already taken the first chunk
          { offset: 6, length: 10 },
        ],
        [{ status: 409 }, { offset: 10, length: 10 }],
      );
      await uploadFileInChunks(instance, path, file, 6, noDelays);
      assert.deepEqual(calls, [
        "HEAD /uploads/abc",
        "PATCH /uploads/abc 6",
        "HEAD /uploads/abc",
        "HEAD /uploads/abc",
        "PATCH /uploads/abc 4",
      ]);
    } finally {
      restore();
    }
  });

  test("a failed HEAD without a terminal status is tolerated and the PATCH retried", async () => {
    const restore = silence();
    try {
      const { instance, calls } = fakeInstance(
        [{ status: 500 }],
        [{ status: 500 }, { offset: 10, length: 10 }],
      );
      await uploadFileInChunks(instance, path, file, 10, noDelays);
      assert.deepEqual(calls, [
        "HEAD /uploads/abc",
        "PATCH /uploads/abc 10",
        "HEAD /uploads/abc",
        "PATCH /uploads/abc 10",
      ]);
    } finally {
      restore();
    }
  });

  test("retries run out: the last PATCH error is thrown, not a rejection", async () => {
    const restore = silence();
    try {
      const { instance, calls } = fakeInstance(
        [{ offset: 0, length: 10 }],
        [{ status: 500 }],
      );
      await assert.rejects(
        uploadFileInChunks(instance, path, file, 10, [0, 0]),
        (error: unknown) =>
          error instanceof HttpError &&
          error.response.status === 500 &&
          !isTusUploadRejected(error),
      );
      assert.equal(calls.filter((c) => c.startsWith("PATCH")).length, 3);
    } finally {
      restore();
    }
  });

  for (const status of [403, 404, 410]) {
    test(`a ${status} on PATCH is terminal: no retry, TusUploadRejectedError`, async () => {
      const restore = silence();
      try {
        const { instance, calls } = fakeInstance(
          [{ offset: 0, length: 10 }],
          [{ status }],
        );
        await assert.rejects(
          uploadFileInChunks(instance, path, file, 10, noDelays),
          (error: unknown) =>
            isTusUploadRejected(error) &&
            error.status === status &&
            error.uploadPath === path &&
            error.cause instanceof HttpError,
        );
        assert.deepEqual(calls, ["HEAD /uploads/abc", "PATCH /uploads/abc 10"]);
      } finally {
        restore();
      }
    });
  }

  test("a 403 on the HEAD before the first PATCH is terminal: nothing is sent", async () => {
    const restore = silence();
    try {
      const { instance, calls } = fakeInstance([{ status: 403 }], []);
      await assert.rejects(
        uploadFileInChunks(instance, path, file, 10, noDelays),
        TusUploadRejectedError,
      );
      assert.deepEqual(calls, ["HEAD /uploads/abc"]);
    } finally {
      restore();
    }
  });

  test("a 403 on the re-sync HEAD after a failed PATCH is terminal: no second PATCH", async () => {
    const restore = silence();
    try {
      const { instance, calls } = fakeInstance(
        [{ offset: 0, length: 10 }, { status: 403 }],
        [{ status: 500 }],
      );
      await assert.rejects(
        uploadFileInChunks(instance, path, file, 10, noDelays),
        TusUploadRejectedError,
      );
      assert.deepEqual(calls, [
        "HEAD /uploads/abc",
        "PATCH /uploads/abc 10",
        "HEAD /uploads/abc",
      ]);
    } finally {
      restore();
    }
  });

  test("a 401 that the interceptor could not refresh stays on the retry path", async () => {
    const restore = silence();
    try {
      const { instance, calls } = fakeInstance(
        [{ offset: 0, length: 10 }],
        [{ status: 401 }, { offset: 10, length: 10 }],
      );
      await uploadFileInChunks(instance, path, file, 10, noDelays);
      assert.equal(calls.filter((c) => c.startsWith("PATCH")).length, 2);
    } finally {
      restore();
    }
  });
});
