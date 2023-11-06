import { get_queue } from "@/lib/muse/api";
import {
  createStream,
  extractParamFromReqeust,
  getBestThumbnail,
} from "../_utils";
import sanitize from "sanitize-filename";
import { downloadTracks } from "../_download";

export async function GET(request: Request) {
  const { stream, sendMessage, closeMessage } = createStream();

  (async () => {
    const video_id = extractParamFromReqeust("v", request);
    if (!video_id) {
      sendMessage("No video id found");
      closeMessage();
      return;
    }

    sendMessage(
      `Fetching video id: ${video_id}`,
    );
    try {
      const queue = await get_queue(video_id, null, { radio: true });
      await downloadTracks(
        queue.tracks.map((track) => ({
          videoId: track.videoId,
          title: track.title,
          artist: track.artists.map((a) => a.name).join(", "),
          album: track.album?.name,
          year: track.year ?? undefined,
          thumbnailUrl: getBestThumbnail(track.thumbnails),
        })),
        `./downloads/${sanitize("Radio of " + video_id)}/`,
        sendMessage,
      );
    } catch (e) {
      sendMessage(`Failed fetch radio of video: ${e}`);
    }

    closeMessage();
  })();

  return new Response(stream);
}
