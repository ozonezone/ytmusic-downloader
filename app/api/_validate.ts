import * as v from "valibot";

export const DownloadRequestPostSchema = v.object({
  url: v.string(),
  excludeUserGeneratedContents: v.optional(v.boolean(), true),
  overwrite: v.optional(v.boolean(), true),
  /// If true, the file name will be prefixed with the index of the song in the playlist.
  indexName: v.optional(v.boolean(), false),
});
