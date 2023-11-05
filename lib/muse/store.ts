import { Store } from "libmuse";
import * as fs from "fs";

export class NodeFileStore extends Store {
  map: Map<string, unknown> = new Map();

  constructor(private path: string) {
    super();
    try {
      const content = fs.readFileSync(path, { encoding: "utf-8" });

      const json = JSON.parse(content);

      if (json.version !== this.version) {
        throw "";
      } else {
        this.map = new Map(Object.entries(json));
      }
    } catch (_error) {
      this.map = new Map();
      this.set("version", this.version);
    }
  }

  get<T>(key: string): T | null {
    return this.map.get(key) as T ?? null;
  }

  set(key: string, value: unknown): void {
    console.log(key, value);
    this.map.set(key, value);

    this.save();
  }

  delete(key: string): void {
    this.map.delete(key);

    this.save();
  }

  private save() {
    const json = JSON.stringify(Object.fromEntries(this.map), null, 2);
    fs.writeFileSync(this.path, json);
  }
}
