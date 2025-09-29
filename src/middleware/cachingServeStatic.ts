import { getMimeType } from "hono/utils/mime";

import type { Env, MiddlewareHandler } from "hono";
import { join } from "node:path/posix";

export type ServeStaticOptions<E extends Env = Env> = {
  root?: string;
  path?: string;
}

export const cachingServeStatic = <E extends Env = Env>(
  options: ServeStaticOptions<E>
) : MiddlewareHandler => {
  const root = options.root ?? "./";

  return async (c, next) => {
    if (c.finalized) {
      return next();
    }

    if (c.req.method !== "GET" && c.req.method !== "HEAD") {
      return next();
    }

    let path: string;

    if (options.path) {
      path = options.path;

    } else {
      let filename: string;

      try {
        filename = decodeURIComponent(c.req.path)
        if (/(?:^|[\/\\])\.\.(?:$|[\/\\])/.test(filename)) {
          throw new Error()
        }
      } catch {
        return next()
      }

      path = join(root, filename);
    }

    const file = Bun.file(path);
    if (!file.exists) {
      return next();
    }

    const lastModified = file.lastModified;
    c.header("Last-Modified", new Date(lastModified).toUTCString());

    const size = file.size;
    c.header("Content-Length", size.toString());

    const type = getMimeType(path) || "application/octet-stream";
    c.header("Content-Type", type);

    const ifModifiedSince = c.req.header("If-Modified-Since");
    if (ifModifiedSince) {
      const ifModifiedSinceTime = new Date(ifModifiedSince).getTime();
      const modifiedTime = Math.floor(lastModified / 1000) * 1000; // Round down to the nearest second

      if (!isNaN(ifModifiedSinceTime) && modifiedTime <= ifModifiedSinceTime) {
        c.status(304);
        return c.body(null);
      }
    }

    c.status(200);
    if (c.req.method === "HEAD") {
      return c.body(null);
    }

    return c.body(await file.bytes());
  };
}

