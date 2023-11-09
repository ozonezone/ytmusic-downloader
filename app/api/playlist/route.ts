import { createStream, extractParamFromUrl, getBestThumbnail } from "../_utils";
import sanitize from "sanitize-filename";
import { get_playlist } from "@/lib/muse/api";
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

    const id = extractParamFromUrl(opts.url, "list");
    if (!id) {
      sendMessage("No playlist id found");
      closeMessage();
      return;
    }

    sendMessage(`Fetching playlist id: ${id}`);

    try {
      const playlist = await get_playlist(id);
      let tracks = playlist.tracks;
      if (opts.excludeVideo) {
        tracks = tracks.filter((t) => {
          if (t.videoType !== "MUSIC_VIDEO_TYPE_ATV") {
            sendMessage(`Excluding ${t.title} ( ${t.videoId} )`);
            return false;
          }
          return true;
        });
      }

      const download_tracks = tracks.map((track) => {
        return {
          videoId: track.videoId,
          title: track.title,
          artist: track.artists.map((a) => a.name).join(", "),
          album: track.album?.name,
          thumbnailUrl: getBestThumbnail(track.thumbnails),
        };
      });
      await downloadTracks(
        download_tracks,
        path.join(DOWNLOAD_DIR, sanitize(playlist.title)),
        sendMessage,
        opts,
      );
    } catch (e) {
      sendMessage(`Failed fetch playlist: ${e}`);
    }

    closeMessage();
  })();

  return new Response(stream);
}
