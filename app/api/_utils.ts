import { setup } from "@/lib/muse/auth";
import { get_option, Thumbnail } from "libmuse";
import tempfile from "tempfile";
import { spawn } from "child_process";
import * as fs from "fs/promises";

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

export async function downloadTracks(
  tracks: { videoId: string | null; title: string; thumbnails: Thumbnail[] }[],
  outputFolder: string,
  sendMessage: (message: string) => void,
  nameIndex: boolean = false,
) {
  setup();
  const auth = get_option("auth");

  sendMessage(`Downloading ${tracks.length} tracks to ${outputFolder}`);
  tracks.forEach((track) => {
    sendMessage(`|  Downloading ${track.title}`);
  });

  await Promise.all(tracks.map(async (track, i) => {
    if (!track.videoId) {
      sendMessage(
        "No video id found for " + track.title + ". Maybe not authed.?",
      );
      return;
    }
    // const t = tempfile({ extension: "m4a" });
    const t = "/tmp/020e308e-38c3-4957-896a-422394eeccff.m4a";

    try {
      // await new Promise((resolve, reject) => {
      //   let stdout = "";
      //   let stderr = "";
      //   // deno-fmt-ignore
      //   const proc = spawn("yt-dlp", [
      //     `https://music.youtube.com/watch?v=${track.videoId}`,
      //     "--output", t,
      //     "--format", "bestaudio/best",
      //     "--no-embed-metadata", "--no-embed-thumbnail",
      //     "--add-header", `Authorization:Bearer ${auth.token!.access_token}`,
      //     "--fixup", "never",
      //     "--verbose"
      //   ]);
      //   proc.stderr.on("data", (data) => {
      //     stderr += data.toString();
      //   });
      //   proc.stdout.on("data", (data) => {
      //     stdout += data.toString();
      //   });
      //   proc.on("close", (code) => {
      //     if (code === 0) {
      //       resolve(stdout);
      //     } else {
      //       reject(`yt-dlp exited with code ${code}: ${stderr}`);
      //     }
      //   });
      // });

      await new Promise((resolve, reject) => {
        let stdout = "";
        let stderr = "";
        // deno-fmt-ignore
        const proc = spawn("ffmpeg", [
          "-i", t,
          "-i", track.thumbnails[0].url,
          "-map", "0",
          "-map", "1",
          "-c", "copy",
          "-disposition:v:1", "attached_pic",
          "-y",
          `${outputFolder}/${nameIndex ? `${i + 1} - ` : ""}${track.title}.m4a`,
        ]);
        proc.stderr.on("data", (data) => {
          console.log("e:",data.toString())
          stderr += data.toString();
        });
        proc.stdout.on("data", (data) => {
          console.log("o:",data.toString())
          stdout += data.toString();
        });
        proc.on("close", (code) => {
          if (code === 0) {
            resolve(stdout);
          } else {
            reject(`ffmpeg exited with code ${code}: ${stderr}`);
          }
        });
      });
      sendMessage(`Downloaded ${track.title}`);
    } catch (e) {
      if (e && typeof e === "object") {
        if ("shortMessage" in e) {
          sendMessage(`Failed to download ${track.title}: ${e.shortMessage}`);
          return;
        }
      }
      sendMessage(`Failed to download ${track.title}: ${e}`);
    } finally {
      // await fs.rm(t);
    }
  }));

  sendMessage(`Finished downloading ${tracks.length} tracks`);
}
