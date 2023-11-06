"use client";

import { User } from "libmuse";
import { useState } from "react";

export default function ({ me }: { me: User }) {
  const [downloading, setDownloading] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [radioUrl, setRadioUrl] = useState("");
  const [log, setLog] = useState("");

  const startDownload = async (type: "radio" | "playlist") => {
    setDownloading(true);
    setLog((prev) => prev + "Sent request\n");
    let api = "";
    if (type === "radio") {
      api = `/api/radio?url=${encodeURIComponent(radioUrl)}`;
    } else {
      api = `/api/playlist?url=${encodeURIComponent(playlistUrl)}`;
    }
    const res = await fetch(api);
    const stream = res.body;
    if (!stream) return;

    const pump = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
      const content = await reader.read();
      if (content.done) {
        setLog((prev) => prev + "Downloaded\n");
        return;
      }
      const value = new TextDecoder().decode(content.value);
      setLog((prev) => prev + value);
      pump(reader);
    };
    pump(stream.getReader());

    setDownloading(false);
  };

  return (
    <div className="flex flex-col">
      <h1 className="text-2xl">YTMusic downloader</h1>
      <div>Logged in as {me.name}</div>
      <fieldset
        disabled={downloading}
        className="flex flex-col justify-center items-center w-full gap-2 p-2"
      >
        <div className="flex flex-col w-full gap-1">
          <h2 className="text-xl">Download playlist</h2>
          <div className="flex gap-2 w-full">
            <input
              type="text"
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              className="p-2 bg-gray-100 rounded-md border border-black flex-grow"
            />
            <button
              onClick={() => startDownload("playlist")}
              className="bg-gray-200 hover:bg-gray-300 rounded-md p-2"
            >
              Start
            </button>
          </div>
        </div>
        <div className="flex flex-col w-full gap-1">
          <h2 className="text-xl">Download radio</h2>
          <div className="flex gap-2 w-full">
            <input
              type="text"
              value={radioUrl}
              onChange={(e) => setRadioUrl(e.target.value)}
              className="p-2 bg-gray-100 rounded-md border border-black flex-grow"
            />
            <button
              onClick={() => startDownload("radio")}
              className="bg-gray-200 hover:bg-gray-300 rounded-md p-2"
            >
              Start
            </button>
          </div>
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
