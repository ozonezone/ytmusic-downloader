import { setup } from "@/lib/muse/auth";
import { get_option, get_playlist } from "libmuse";
import ytdl from "youtube-dl-exec";

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
  tracks: { videoId: string; title: string }[],
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
    try {
      // console.log(track);
      const res = await ytdl(
        `https://music.youtube.com/watch?v=${track.videoId}`,
        {
          output: `${outputFolder}/${
            nameIndex ? `${i + 1} - ` : ""
          }${track.title}.m4a`,
          format: "bestaudio/best",
          addMetadata: true,
          addHeader: [`Authorization: Bearer ${auth.token!.access_token}`],
          embedThumbnail: true,
          //@ts-ignore
          ppa:
            "EmbedThumbnail+ffmpeg_o:-c:v mjpeg -vf crop=\"'if(gt(ih,iw),iw,ih)':'if(gt(iw,ih),ih,iw)'\"",
        },
      );
      // console.log(res);
      sendMessage(`Downloaded ${track.title}`);
    } catch (e: any) {
      if ("shortMessage" in e) {
        sendMessage(`Failed to download ${track.title}: ${e.shortMessage}`);
      } else {
        sendMessage(`Failed to download ${track.title}: ${e}`);
      }
    }
  }));

  sendMessage(`Finished downloading ${tracks.length} tracks`);
}
