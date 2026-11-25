import {useLoader} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import * as THREE from 'three';

export type LanyardTheme = 'dark' | 'light';
export const cardModel = '/card-rig.glb';
const maps = ['/lanyard.png', '/card-texture-dark.webp', '/card-texture-light.webp'];

class LanyardMapLoader extends THREE.TextureLoader {
    override load(url: string, onLoad?: (texture: THREE.Texture<HTMLImageElement>) => void,
                  onProgress?: (event: ProgressEvent) => void, onError?: (error: unknown) => void) {
        const strap = url === maps[0];
        const attempt = (source: string, fallback?: string): THREE.Texture<HTMLImageElement> => {
            const fail = (error: unknown) => {
                if (fallback) attempt(fallback);
                else onError?.(error);
            };
            return super.load(source, async texture => {
                try {
                    await texture.image.decode();
                    texture.anisotropy = 16;
                    if (strap) {
                        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                    } else {
                        texture.flipY = false;
                        texture.colorSpace = THREE.SRGBColorSpace;
                    }
                    onLoad?.(texture);
                } catch (error) {
                    texture.dispose();
                    fail(error);
                }
            }, onProgress, fail);
        };
        return attempt(url, strap ? undefined : url.replace(/\.webp$/, '.png'));
    }
}

export function preloadLanyard() {
    useGLTF.preload(cardModel);
    useLoader.preload(LanyardMapLoader, maps);
}

export function clearLanyardLoadError() {
    useGLTF.clear(cardModel);
    useLoader.clear(LanyardMapLoader, maps);
}

export function useLanyardMaps() {
    return useLoader(LanyardMapLoader, maps);
}
