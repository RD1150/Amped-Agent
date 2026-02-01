declare module 'shotstack-sdk' {
  export class ApiClient {
    static instance: ApiClient;
    authentications: Record<string, any>;
    basePath: string;
  }

  export class EditApi {
    postRender(edit: Edit): Promise<any>;
    getRender(id: string): Promise<any>;
  }

  export class Edit {
    timeline?: Timeline;
    output?: Output;
  }

  export class Timeline {
    tracks?: Track[];
  }

  export class Track {
    clips?: Clip[];
  }

  export class Clip {
    asset?: any;
    start?: number;
    length?: number;
    fit?: string;
    transition?: any;
  }

  export class VideoAsset {
    src?: string;
    trim?: number;
  }

  export class TitleAsset {
    text?: string;
    style?: string;
    size?: string;
    position?: string;
    font?: Font;
  }

  export class AudioAsset {
    src?: string;
    volume?: number;
  }

  export class Output {
    format?: string;
    resolution?: string;
    aspectRatio?: string;
    size?: { width: number; height: number };
    fps?: number;
    quality?: string;
  }

  export class Font {
    family?: string;
    color?: string;
    size?: number;
  }

  export class Soundtrack {
    src?: string;
    effect?: string;
  }
}
