import * as THREE from 'three';
import { TextureGenerator } from '../components/textureGen.js';

/**
 * Centralized Texture Manager & Asset Pipeline for COSMOS
 * Handles texture caching, colorSpace configuration, sRGB encoding,
 * anisotropy tuning, and graceful procedural canvas fallbacks.
 */
export class TextureManager {
  static cache = new Map();
  static maxAnisotropy = 16;
  static loader = new THREE.TextureLoader();

  /**
   * Sets renderer capabilities (max anisotropy)
   */
  static init(renderer) {
    if (renderer && renderer.capabilities) {
      this.maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    }
  }

  /**
   * Primary entry point for getting a planet/satellite texture.
   * Checks cache first, attempts static asset loading if a path is provided,
   * and falls back to procedural Canvas generation if missing or failed.
   */
  static getTexture(type, assetPath = null) {
    const cacheKey = assetPath || type;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let texture;

    if (assetPath) {
      // Load static image texture with procedural fallback
      texture = this.loader.load(
        assetPath,
        (loadedTex) => {
          this._configureTexture(loadedTex);
        },
        undefined,
        (err) => {
          console.warn(`[TextureManager] Failed to load static asset '${assetPath}'. Falling back to procedural '${type}'.`, err);
          const fallbackTex = TextureGenerator.getTexture(type);
          this._configureTexture(fallbackTex);
          // Copy image data to pre-created texture object if possible
          if (texture && fallbackTex.image) {
            texture.image = fallbackTex.image;
            texture.needsUpdate = true;
          }
        }
      );
    } else {
      // Generate procedural texture directly
      texture = TextureGenerator.getTexture(type);
    }

    this._configureTexture(texture);
    this.cache.set(cacheKey, texture);
    return texture;
  }

  /**
   * Applies proper Three.js color space, wrapping, anisotropy, and filtering rules.
   */
  static _configureTexture(texture) {
    if (!texture) return;

    // Apply sRGB Color Space for proper PBR albedo rendering
    if ('colorSpace' in THREE && THREE.SRGBColorSpace) {
      texture.colorSpace = THREE.SRGBColorSpace;
    } else if ('encoding' in THREE && THREE.sRGBEncoding) {
      texture.encoding = THREE.sRGBEncoding;
    }

    texture.anisotropy = Math.min(16, this.maxAnisotropy);
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
  }

  /**
   * Clears texture cache to free GPU memory when needed
   */
  static clearCache() {
    this.cache.forEach((tex) => {
      if (tex && typeof tex.dispose === 'function') {
        tex.dispose();
      }
    });
    this.cache.clear();
  }
}
