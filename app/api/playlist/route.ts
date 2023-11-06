import {
  createStream,
  extractParamFromReqeust,
  getBestThumbnail,
} from "../_utils";
import sanitize from "sanitize-filename";
import { get_playlist } from "@/lib/muse/api";
import { downloadTracks } from "../_download";

export async function GET(request: Request) {
  const { stream, sendMessage, closeMessage } = createStream();

  (async () => {
    const playlist_id = extractParamFromReqeust("list", request);
    if (!playlist_id) {
      sendMessage("No playlist id found");
      closeMessage();
      return;
    }

    sendMessage(`Fetching playlist id: ${playlist_id}`);
    try {
      const playlist = await get_playlist(playlist_id);
      await downloadTracks(
        playlist.tracks.map((track) => ({
          videoId: track.videoId,
          title: track.title,
          artist: track.artists.map((a) => a.name).join(", "),
          album: track.album?.name,
          thumbnailUrl: getBestThumbnail(track.thumbnails),
        })),
        `./downloads/${sanitize(playlist.title)}/`,
        sendMessage,
      );
    } catch (e) {
      sendMessage(`Failed fetch playlist: ${e}`);
    }

    closeMessage();
  })();

  return new Response(stream);
}
