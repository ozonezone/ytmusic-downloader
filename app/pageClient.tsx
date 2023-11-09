"use client";

import { useState } from "react";
import { Input } from "valibot";
import { DownloadRequestPostSchema } from "./api/_validate";

type Log = {
  title: string;
  content: string;
  completed: boolean;
};

export default function () {
  const [downloading, setDownloading] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [radioUrl, setRadioUrl] = useState("");
  const [checkExcludeVideo, setCheckExcludeVideo] = useState(true);
  const [checkOverwrite, setCheckOverwrite] = useState(true);
  const [checkIndexName, setCheckIndexName] = useState(false);
  const [checkWriteYoutubeId, setCheckWriteYoutubeId] = useState(true);
  const [log, setLog] = useState<Log[]>([]);

  const startLog = (title: string) => {
    setLog((prev) => [...prev, { title, content: "", completed: false }]);
  };
  const endLog = () => {
    setLog((prev) => {
      const last = prev[prev.length - 1];
      return [...prev.slice(0, prev.length - 1), {
        ...last,
        completed: true,
      }];
    });
  };

  const appendLog = (content: string) => {
    setLog((prev) => {
      const last = prev[prev.length - 1];
      return [...prev.slice(0, prev.length - 1), {
        ...last,
        content: last.content + content,
      }];
    });
  };

  const startDownload = async (type: "radio" | "playlist") => {
    startLog(
      `${type}: ${type === "radio" ? radioUrl : playlistUrl}`,
    );
    setDownloading(true);
    appendLog("Download starting...\n");
    let api = "";
    if (type === "radio") {
      api = `/api/radio`;
    } else {
      api = `/api/playlist`;
    }

    const body: Input<typeof DownloadRequestPostSchema> = {
      url: type === "radio" ? radioUrl : playlistUrl,
      excludeVideo: checkExcludeVideo,
      overwrite: checkOverwrite,
      indexName: checkIndexName,
      writeYoutubeId: checkWriteYoutubeId,
    };

    const res = await fetch(api, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const stream = res.body;
    if (!stream) return;

    const pump = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
      const content = await reader.read();
      if (content.done) {
        appendLog("Download completed!\n");
        setDownloading(false);
        endLog();
        return;
      }
      const value = new TextDecoder().decode(content.value);
      appendLog(value);
      pump(reader);
    };
    pump(stream.getReader());
  };

  return (
    <div className="flex flex-col">
      <h1 className="text-2xl">YTMusic downloader</h1>
      <fieldset
        disabled={downloading}
        className="flex flex-col w-full gap-2 p-2"
      >
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setLog([])}
            className="bg-gray-200 hover:bg-gray-300 rounded-md p-2"
          >
            Clear log
          </button>
          <label>
            <input
              type="checkbox"
              checked={checkExcludeVideo}
              onChange={() => setCheckExcludeVideo((prev) => !prev)}
            />
            Exclude video (if counterpart audio exists, it will be downloaded)
          </label>
          <label>
            <input
              type="checkbox"
              checked={checkOverwrite}
              onChange={() => setCheckOverwrite((prev) => !prev)}
            />
            Overwrite existing files
          </label>
          <label>
            <input
              type="checkbox"
              checked={checkWriteYoutubeId}
              onChange={() => setCheckWriteYoutubeId((prev) => !prev)}
            />
            Write youtube_id tag to metadata
          </label>
          <label>
            <input
              type="checkbox"
              checked={checkIndexName}
              onChange={() => setCheckIndexName((prev) => !prev)}
            />
            Index name
          </label>
        </div>
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
      <div className="flex flex-col-reverse m-2 overflow-scroll">
        {log.map((l, i) => (
          <div className="p-2 border border-black rounded-lg">
            <h2 className={"text-xl " + (l.completed ? "" : "text-red-600")}>
              {l.completed ? "Downloaded" : "Downloading"} {l.title}
            </h2>
            <div>
              <pre>
                <code>{l.content}</code>
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
