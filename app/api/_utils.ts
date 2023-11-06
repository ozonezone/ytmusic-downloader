import { Thumbnail } from "libmuse";

export function createStream() {
  let sendMessage = (_: string) => {};
  let closeMessage = () => {};
  const stream = new ReadableStream({
    start(controller) {
      sendMessage = (message: string) => {
        console.log("[route::sendMessage] " + message);
        controller.enqueue(message + "\n");
      };
      closeMessage = () => {
        controller.close();
      };
    },
  }).pipeThrough(new TextEncoderStream());

  return {
    stream,
    sendMessage,
    closeMessage,
  };
}

export function extractParamFromReqeust(key: string, request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const url_s = params.get("url");
    if (!url_s) {
      return;
    }
    try {
      const url = new URL(url_s);
      const url_params = url.searchParams;
      const val = url_params.get(key);
      return val;
    } catch {
      return url_s;
    }
  } catch {
    return;
  }
}

export function getBestThumbnail(thumbnails: Thumbnail[]) {
  const squareThumbnail = thumbnails.find((t) => t.width === t.height);
  if (!squareThumbnail) {
    const t = thumbnails.reduce((prev, curr) => {
      if (prev.width > curr.width) {
        return prev;
      } else {
        return curr;
      }
    });
    return t.url;
  } else {
    const url = squareThumbnail.url;
    const url_s = url.split("=");
    url_s[url_s.length - 1] = url_s[url_s.length - 1].replace(/h\d+/, "h2000");
    url_s[url_s.length - 1] = url_s[url_s.length - 1].replace(/w\d+/, "w2000");
    const newUrl = url_s.join("=");
    return newUrl;
  }
}
