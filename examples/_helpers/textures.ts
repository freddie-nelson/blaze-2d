import TextureAtlas from "@blz/texture/atlas";
import Texture from "@blz/texture/texture";
import Color, { RGBAColor } from "@blz/utils/color";

export function randomTexs(count: number, atlas: TextureAtlas) {
  const texs = new Array(500).fill(undefined).map(() => {
    const color = new Color(<RGBAColor>{
      r: Math.floor(Math.random() * 255),
      g: Math.floor(Math.random() * 255),
      b: Math.floor(Math.random() * 255),
      a: 1,
    });

    const tex = new Texture(color);
    if (atlas) atlas.addTexture(tex);

    return tex;
  });

  atlas.refreshAtlas();
  return texs;
}
