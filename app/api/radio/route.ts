import { get_queue } from "@/lib/muse/api";
import { createStream, extractParamFromUrl, getBestThumbnail } from "../_utils";
import sanitize from "sanitize-filename";
import { downloadTracks } from "../_download";
import { safeParse } from "valibot";
import { DownloadRequestPostSchema } from "../_validate";

export async function POST(request: Request) {
  const { stream, sendMessage, closeMessage } = createStream();

  (async () => {
    const parseRes = safeParse(DownloadRequestPostSchema, request.json());
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
      if (opts.excludeUserGeneratedContents) {
        tracks = tracks.filter((t) => {
          if (t.videoType === "MUSIC_VIDEO_TYPE_UGC") {
            sendMessage(`Excluding ${t.title} (${t.videoId})`);
            return false;
          }
          return true;
        });
      }
      await downloadTracks(
        tracks.map((track) => ({
          videoId: track.videoId,
          title: track.title,
          artist: track.artists.map((a) => a.name).join(", "),
          album: track.album?.name,
          year: track.year ?? undefined,
          thumbnailUrl: getBestThumbnail(track.thumbnails),
        })),
        `./downloads/${sanitize("Radio of " + id)}/`,
        sendMessage,
        { indexName: opts.indexName, overwrite: opts.overwrite },
      );
    } catch (e) {
      sendMessage(`Failed fetch radio of video: ${e}`);
    }

    closeMessage();
  })();

  return new Response(stream);
}
