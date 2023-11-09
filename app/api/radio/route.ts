import { get_queue } from "@/lib/muse/api";
import { createStream, extractParamFromUrl, getBestThumbnail } from "../_utils";
import sanitize from "sanitize-filename";
import { downloadTracks } from "../_download";
import { safeParse } from "valibot";
import { DownloadRequestPostSchema } from "../_validate";
import * as path from "path";
import { DOWNLOAD_DIR } from "@/lib/constants";

export async function POST(request: Request) {
  const { stream, sendMessage, closeMessage } = createStream();

  (async () => {
    const parseRes = safeParse(DownloadRequestPostSchema, await request.json());
    if (!parseRes.success) {
      sendMessage("Invalid request body");
      closeMessage();
      return;
    }
    const opts = parseRes.output;

    const id = extractParamFromUrl(opts.url, "v");
    if (!id) {
      sendMessage("No video id found");
      closeMessage();
      return;
    }

    sendMessage(
      `Fetching video id: ${id}`,
    );
    try {
      const queue = await get_queue(id, null, { radio: true });
      let tracks = queue.tracks;
      if (opts.excludeVideo) {
        tracks = tracks.flatMap((t) => {
          if (t.videoType !== "MUSIC_VIDEO_TYPE_ATV") {
            if (t.counterpart) {
              if (t.counterpart.videoType == "MUSIC_VIDEO_TYPE_ATV") {
                sendMessage(
                  `Replaced video to counterpart: ${t.title} (${t.videoId}) -> ${t.counterpart.title} (${t.counterpart.videoId})`,
                );
                return [t.counterpart];
              }
            }
            sendMessage(`Excluding ${t.title} (${t.videoId})`);
            return [];
          }
          return [t];
        });
      }
      await downloadTracks(
        tracks.map((track) => {
          return {
            videoId: track.videoId,
            title: track.title,
            artist: track.artists.map((a) => a.name).join(", "),
            album: track.album?.name,
            year: track.year ?? undefined,
            thumbnailUrl: getBestThumbnail(track.thumbnails),
          };
        }),
        path.join(
          DOWNLOAD_DIR,
          sanitize(`Radio of ${queue.tracks[0].title} (${id}) ${Date.now()}`),
        ),
        sendMessage,
        opts,
      );
    } catch (e) {
      sendMessage(`Failed fetch radio of video: ${e}`);
    }

    closeMessage();
  })();

  return new Response(stream);
}
