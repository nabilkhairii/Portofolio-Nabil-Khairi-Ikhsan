'use client';
import {useEffect, useRef, useState} from 'react';
import {Canvas, extend, useFrame} from '@react-three/fiber';
import {useGLTF, useTexture, Environment, Lightformer} from '@react-three/drei';
import {
    BallCollider,
    CuboidCollider,
    Physics,
    RigidBody,
    useRopeJoint,
    useSphericalJoint,
    RigidBodyProps
} from '@react-three/rapier';
import {MeshLineGeometry, MeshLineMaterial} from 'meshline';
import * as THREE from 'three';
import clsx from 'clsx';

// Aset dari public/, bukan static image import: card.glb dibaca lewat path
// string oleh useGLTF, jadi teksturnya ikut di sana supaya semuanya satu
// tempat. Model aslinya dari React Bits ada di tools/source/.
const cardGLB = '/card.glb';

/* Tali: satu tekstur untuk kedua tema (pita #BABABA bertulisan hitam, dibuat
   tools/lanyard-texture.mjs). Abu-abu terang itu punya kontras ke dua-duanya —
   tidak lebur di halaman gelap, tidak menyilaukan di halaman terang.

   Kartu: satu tekstur per tema, dibuat tools/card-texture.mjs, sengaja
   berlawanan dengan latar halaman — di tema gelap kartunya terang, di tema
   terang kartunya gelap. Fotonya sendiri sama di kedua varian.

   Warna kartu tidak diatur lewat prop material: peta DIKALIKAN dengan warnanya,
   jadi menggelapkan badan kartu ikut menggelapkan fotonya. Hanya tekstur
   berbeda yang bisa membalik kontras. */
const BAND_TEXTURE = '/lanyard.png';
const CARD_TEXTURE = { dark: '/card-texture-dark.png', light: '/card-texture-light.png' } as const;

export type LanyardTheme = keyof typeof CARD_TEXTURE;

extend({MeshLineGeometry, MeshLineMaterial});

interface LanyardProps {
    position?: [number, number, number];
    gravity?: [number, number, number];
    fov?: number;
    transparent?: boolean;
    containerClassName?: string;
    /* Tema halaman. Menentukan pasangan tekstur yang dipakai; keduanya tetap
       dimuat sekaligus, jadi menukarnya tidak memuat apa pun dari jaringan. */
    theme?: LanyardTheme;
    canvasRef?: React.RefObject<HTMLCanvasElement | null>;
    /* Dipanggil sekali begitu Band terpasang — artinya useGLTF/useTexture sudah
       selesai dan kartunya benar-benar berdiri, bukan sekadar konteks WebGL
       sudah jadi. Wadahnya transparan sampai saat itu (lihat .lanyard-box di
       globals.css); memudarkannya lebih awal memperlihatkan kotak kosong. */
    onReady?: () => void;
}

export default function Lanyard({
                                    position = [0, 0, 30],
                                    gravity = [0, -40, 0],
                                    fov = 20,
                                    transparent = true,
                                    containerClassName,
                                    theme = 'dark',
                                    canvasRef,
                                    onReady
                                }: LanyardProps) {
    const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 768);

    useEffect(() => {
        const handleResize = (): void => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div
            className={clsx(containerClassName || "relative z-0 w-full h-screen flex justify-center items-center transform scale-100 origin-center")}>
            <Canvas
                ref={canvasRef}
                camera={{position, fov}}
                dpr={[1, isMobile ? 1.5 : 2]}
                gl={{alpha: transparent, preserveDrawingBuffer: true}}
                onCreated={({gl}) => gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)}
            >
                <ambientLight intensity={Math.PI}/>
                <Physics gravity={gravity} timeStep={isMobile ? 1 / 30 : 1 / 60}>
                    <Band isMobile={isMobile} theme={theme} onReady={onReady}/>
                </Physics>
                <Environment blur={0.75}>
                    <Lightformer
                        intensity={2}
                        color="white"
                        position={[0, -1, 5]}
                        rotation={[0, 0, Math.PI / 3]}
                        scale={[100, 0.1, 1]}
                    />
                    <Lightformer
                        intensity={3}
                        color="white"
                        position={[-1, -1, 1]}
                        rotation={[0, 0, Math.PI / 3]}
                        scale={[100, 0.1, 1]}
                    />
                    <Lightformer
                        intensity={3}
                        color="white"
                        position={[1, 1, 1]}
                        rotation={[0, 0, Math.PI / 3]}
                        scale={[100, 0.1, 1]}
                    />
                    <Lightformer
                        intensity={10}
                        color="white"
                        position={[-10, 0, 14]}
                        rotation={[0, Math.PI / 2, Math.PI / 3]}
                        scale={[100, 10, 1]}
                    />
                </Environment>
            </Canvas>
        </div>
    );
}

interface BandProps {
    maxSpeed?: number;
    minSpeed?: number;
    isMobile?: boolean;
    theme?: LanyardTheme;
    onReady?: () => void;
}

function Band({maxSpeed = 50, minSpeed = 0, isMobile = false, theme = 'dark', onReady}: BandProps) {
    // Using "any" for refs since the exact types depend on Rapier's internals
    const band = useRef<any>(null);
    const fixed = useRef<any>(null);
    const j1 = useRef<any>(null);
    const j2 = useRef<any>(null);
    const j3 = useRef<any>(null);
    const card = useRef<any>(null);

    const vec = new THREE.Vector3();
    const ang = new THREE.Vector3();
    const rot = new THREE.Vector3();
    const dir = new THREE.Vector3();

    const segmentProps: any = {
        type: 'dynamic' as RigidBodyProps['type'],
        canSleep: true,
        colliders: false,
        angularDamping: 4,
        linearDamping: 4
    };

    const {nodes, materials} = useGLTF(cardGLB) as any;

    const texture = useTexture(BAND_TEXTURE) as THREE.Texture;

    /* Muka kartu memakai TextureLoader, bukan useTexture: flipY harus false
       (UV card.glb terbalik terhadap bawaan three) dan warnanya harus dibaca
       sebagai sRGB. Kedua varian dimuat sekaligus lalu tinggal dipilih — bukan
       dimuat ulang saat tema berganti: useTexture menangguhkan render
       (suspense) begitu URL-nya berubah, dan penangguhan di dalam <Physics>
       melepas Band, jadi talinya ter-reset dan kartunya terjun ulang tiap kali
       tombol tema ditekan. */
    const [cardTextures, setCardTextures] = useState<Partial<Record<LanyardTheme, THREE.Texture>>>({});

    useEffect(() => {
        const loader = new THREE.TextureLoader();
        const loaded: Partial<Record<LanyardTheme, THREE.Texture>> = {};
        let alive = true;
        Promise.all((Object.entries(CARD_TEXTURE) as [LanyardTheme, string][]).map(([key, url]) =>
            new Promise<void>((done) => {
                loader.load(url, (t) => {
                    t.flipY = false;
                    t.colorSpace = THREE.SRGBColorSpace;
                    loaded[key] = t;
                    done();
                }, undefined, () => done());        // gagal muat: pakai peta bawaan card.glb
            })
        )).then(() => { if (alive) setCardTextures(loaded); });

        return () => {
            alive = false;
            Object.values(loaded).forEach(t => t.dispose());
        };
    }, []);
    const [curve] = useState(
        () =>
            new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()])
    );
    const [dragged, drag] = useState<false | THREE.Vector3>(false);
    const [hovered, hover] = useState(false);

    useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
    useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
    useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
    useSphericalJoint(j3, card, [
        [0, 0, 0],
        [0, 1.45, 0]
    ]);

    useEffect(() => {
        if (hovered) {
            document.body.style.cursor = dragged ? 'grabbing' : 'grab';
            return () => {
                document.body.style.cursor = 'auto';
            };
        }
    }, [hovered, dragged]);

    // Kartunya sudah berdiri: aman memudarkan wadahnya masuk.
    useEffect(() => { onReady?.(); }, []);

    useFrame((state, delta) => {
        if (dragged && typeof dragged !== 'boolean') {
            vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
            dir.copy(vec).sub(state.camera.position).normalize();
            vec.add(dir.multiplyScalar(state.camera.position.length()));
            [card, j1, j2, j3, fixed].forEach(ref => ref.current?.wakeUp());
            card.current?.setNextKinematicTranslation({
                x: vec.x - dragged.x,
                y: vec.y - dragged.y,
                z: vec.z - dragged.z
            });
        }
        if (fixed.current) {
            [j1, j2].forEach(ref => {
                if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
                const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())));
                // SATU-SATUNYA baris yang beda dari berkas varcellanyard: Math.min(1, ...).
                // Aslinya faktornya delta * 50 mentah, jadi di bawah ~50 fps nilainya > 1,
                // lerp melompati targetnya, dan frame berikutnya melompat lebih jauh lagi.
                // Terukur di halaman ini: titik kendali tali sampai orde 1e16 dan strap-nya
                // hilang dari layar. Alpha lerp di atas 1 memang tidak punya arti.
                ref.current.lerped.lerp(
                    ref.current.translation(),
                    Math.min(1, delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)))
                );
            });
            curve.points[0].copy(j3.current.translation());
            curve.points[1].copy(j2.current.lerped);
            curve.points[2].copy(j1.current.lerped);
            curve.points[3].copy(fixed.current.translation());
            band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));
            ang.copy(card.current.angvel());
            rot.copy(card.current.rotation());
            card.current.setAngvel({x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z});
        }
    });

    curve.curveType = 'chordal';
    // RepeatWrapping: petanya diulang di sepanjang tali; tanpa ini pengulangan
    // kedua dan seterusnya cuma meregangkan piksel tepi.
    // anisotropy: pita ini sempit dan hampir selalu terlihat menyerong, jadi
    // tanpa penyaringan anisotropik tulisannya luntur duluan sebelum sempat
    // terbaca — sama seperti map-anisotropy pada muka kartu di bawah.
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 16;

    return (
        <>
            <group position={[0, 4, 0]}>
                <RigidBody ref={fixed} {...segmentProps} type={'fixed' as RigidBodyProps['type']}/>
                <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps} type={'dynamic' as RigidBodyProps['type']}>
                    <BallCollider args={[0.1]}/>
                </RigidBody>
                <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps} type={'dynamic' as RigidBodyProps['type']}>
                    <BallCollider args={[0.1]}/>
                </RigidBody>
                <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps} type={'dynamic' as RigidBodyProps['type']}>
                    <BallCollider args={[0.1]}/>
                </RigidBody>
                <RigidBody
                    position={[2, 0, 0]}
                    ref={card}
                    {...segmentProps}
                    type={dragged ? ('kinematicPosition' as RigidBodyProps['type']) : ('dynamic' as RigidBodyProps['type'])}
                >
                    <CuboidCollider args={[0.8, 1.125, 0.01]}/>
                    <group
                        scale={2.25}
                        position={[0, -1.2, -0.05]}
                        onPointerOver={() => hover(true)}
                        onPointerOut={() => hover(false)}
                        onPointerUp={(e: any) => {
                            e.target.releasePointerCapture(e.pointerId);
                            drag(false);
                        }}
                        onPointerDown={(e: any) => {
                            e.target.setPointerCapture(e.pointerId);
                            drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())));
                        }}
                    >
                        <mesh geometry={nodes.card.geometry}>
                            <meshPhysicalMaterial
                                map={cardTextures[theme] ?? materials.base.map}
                                map-anisotropy={16}
                                clearcoat={isMobile ? 0 : 1}
                                clearcoatRoughness={0.15}
                                roughness={0.9}
                                metalness={0.8}
                            />
                        </mesh>
                        <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3}/>
                        <mesh geometry={nodes.clamp.geometry} material={materials.metal}/>
                    </group>
                </RigidBody>
            </group>
            {/* Digeser ke DEPAN pengait. Titik kendali talinya datang dari
                fisika, dan fisikanya hidup di z=0 — persis bidang yang sama
                dengan cincin pengait, jadi cincin itu setengah tergambar di
                depan pita dan setengah lagi di belakangnya, dan pitanya
                terpotong lurus di atas cincin. Dengan pergeseran ini talinya
                utuh menutupi cincin: pengait di belakang, tali di depan.

                0,3 unit: cukup untuk melewati tebal cincin (jari-jarinya ~0,1
                model x skala 2,25), belum cukup jauh untuk terlihat sebagai
                celah — pada jarak kamera 30 unit pergeseran itu ~1% dan tidak
                mengubah ukuran talinya di layar. Bekerja hanya karena
                depthTest di bawah menyala; keduanya satu keputusan. */}
            <mesh ref={band} position={[0, 0, 0.3]}>
                <meshLineGeometry/>
                <meshLineMaterial
                    color="white"
                    /* Aslinya depthTest={false} — pita jadi selalu tergambar di
                       depan, termasuk di atas gelang logam yang seharusnya
                       menahannya. Tanpa satu pun piksel tali yang hilang di
                       belakang clip, sambungannya terbaca "ditempel", bukan
                       "terkait". Dinyalakan supaya clip dan kartu benar-benar
                       menutupi tali saat ada di depannya. */
                    depthTest={true}
                    resolution={isMobile ? [1000, 2000] : [1000, 1000]}
                    useMap
                    map={texture}
                    /* Aslinya [-4, 1]. Satu salinan peta harus sebangun dengan
                       bidangnya di layar: seluruh tali terukur ~416x48 px, jadi
                       4 salinan memberi bidang 104x48 (rasio 2,2) sementara
                       petanya 4,5 — tulisannya tergencet mendatar sampai
                       setengahnya. Logo "v0" bawaan tidak memperlihatkan itu
                       karena nyaris bujur sangkar. Dua salinan mengembalikan
                       proporsinya.

                       Angka ini harus berubah bersamaan dengan REPEAT di
                       tools/lanyard-texture.mjs — rasio petanya diturunkan dari
                       situ. Pernah dicoba 1 salinan (tulisan sekali, di tengah
                       tali); ditolak, kembali ke 2. */
                    repeat={[-2, 1]}
                    lineWidth={1}
                />
            </mesh>
        </>
    );
}
