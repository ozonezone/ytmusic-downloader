"use client";

import { useState } from "react";

export default function () {
  const [downloading, setDownloading] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [log, setLog] = useState("");

  const startDownload = async (type: "radio" | "playlist") => {
    setDownloading(true);
    setLog((prev) => prev + "Sent request\n");
    if (type === "playlist") {
      const res = await fetch(`/api/playlist?url=${playlistUrl}`);
      const stream = res.body?.getReader();
      if (!stream) return;

      while (true) {
        const { done, value } = await stream.read();
        if (done) break;
        const str = new TextDecoder("utf-8").decode(value);
        setLog((prev) => prev + str);
      }
    }
    setLog((prev) => prev + "Downloaded\n");
    setDownloading(false);
  };

  return (
    <div>
      <fieldset
        disabled={downloading}
        className="flex flex-col justify-center items-center"
      >
        <h1 className="text-2xl">Download playlist</h1>
        <div className="flex gap-2">
          <input
            type="text"
            value={playlistUrl}
            onChange={(e) => setPlaylistUrl(e.target.value)}
            className="p-2 bg-gray-100 rounded-md"
          />
          <button onClick={() => startDownload("playlist")}>Start</button>
        </div>
      </fieldset>
      <pre>
        <code>
          {log}
        </code>
      </pre>
    </div>
  );
}
