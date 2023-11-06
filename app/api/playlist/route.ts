import {
  createStream,
  downloadTracks,
  extractParamFromReqeust,
} from "../_utils";
import sanitize from "sanitize-filename";
import { get_playlist } from "@/lib/muse/api";

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
        playlist.tracks,
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
