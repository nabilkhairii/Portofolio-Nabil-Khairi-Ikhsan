'use client';
import {Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {Canvas, events, extend, useFrame, useThree} from '@react-three/fiber';
import type {RootStore, ThreeEvent} from '@react-three/fiber';
import {useGLTF, Environment, Lightformer} from '@react-three/drei';
import {
    BallCollider,
    CuboidCollider,
    Physics,
    RigidBody,
    useBeforePhysicsStep,
    useRapier,
    useRopeJoint,
    useSphericalJoint,
    type RapierRigidBody,
    type RigidBodyProps
} from '@react-three/rapier';
import {MeshLineGeometry, MeshLineMaterial} from 'meshline';
import * as THREE from 'three';
import clsx from 'clsx';

import {cardModel, useLanyardMaps, type LanyardTheme} from './lanyard-assets';

extend({MeshLineGeometry, MeshLineMaterial});

/* ═══ PITA YANG MENGEMBANG DI TIKUNGAN ═══
   meshline menebalkan pitanya dengan menambahkan vektor normal ke posisi clip,
   dan pembagian perspektif setelahnya mengalikan komponen x dengan LEBAR canvas
   sementara komponen y dengan TINGGInya. Di canvas persegi keduanya sama besar
   dan tak ada yang terlihat. Di luar itu vektor tadi tidak lagi tegak lurus
   terhadap pitanya: bagian yang menyerong tergambar lebih tebal (atau lebih
   tipis) daripada yang tegak, tepat sebesar tinggi/lebar canvas.

   Terukur di halaman ini: canvas hero 2743x1229 (faktor 0,45 — tikungan
   dipipihkan jadi baji tumpul) dan canvas HP 176x1150 (faktor 6,5 — tikungan
   yang sama memanjang jadi paku yang menimpa muka kartu). Selisih 14x antara
   dua tampilan yang seharusnya sama. Batang pita yang tegak lurus tidak
   terpengaruh sama sekali, jadi yang terlihat cuma bagian dekat pengait —
   satu-satunya tempat pita ini menikung — dan bentuknya berubah tiap kali
   kartunya berayun.

   Mengalikan y dengan aspect membuat panjang vektor itu kembali sama ke segala
   arah: normal.y x (lebar/tinggi) x tinggi = normal.y x lebar, sama dengan
   sisi x-nya. Tidak bisa diperbaiki lewat prop `resolution` — satu skalar tak
   bisa membetulkan penyimpangan dua sumbu; sudah dicoba, aspect apa pun
   menyisakan rasio tinggi/lebar yang sama. Karena itu shader-nya yang ditambal.

   Ditambal lewat prop, bukan salinan berkas meshline: yang diganti dua baris
   dan sisa shader-nya tetap milik pustakanya. Kalau salah satu baris itu hilang
   di versi meshline berikutnya, tambalan ini diam-diam tidak berbuat apa-apa —
   itu yang dijaga tests/check-meshline-patch.mjs.

   ═══ UJUNG PITA YANG BERGANTI-GANTI BENTUK ═══
   Ujung pita seharusnya terpotong rata. meshline mengenalinya dengan menyamakan
   titik ini dengan tetangganya — di ujung, `previous` memang disalin dari titik
   itu sendiri:

       if (nextP == currentP) dir = normalize(currentP - prevP);   // ujung: rata
       else ...                                                    // tengah: miter

   Tapi kedua sisi perbandingan itu dihitung lewat jalan yang berbeda. currentP
   datang dari posisi yang sudah DIKALIKAN aspect, prevP/nextP dari yang belum:

       vec4 finalPosition = m * vec4(position, 1.0) * aspect;
       vec2 currentP = fix(finalPosition, aspect);   // (x*a)/(w*a)
       vec2 prevP    = fix(prevPos, aspect);         //  x / w

   Secara matematika keduanya sama; dalam float32 tidak selalu — (x*a)/(w*a)
   dibulatkan lain dari x/w. Selisih satu ULP sudah cukup membuat `==` gagal,
   dan ujungnya jatuh ke cabang miter: dir1 = normalize(selisih sekecil itu)
   yang arahnya praktis acak, jadi tutup ujungnya tergambar menyerong — segitiga,
   baji, entah apa — dan berganti tiap frame karena pembulatannya ikut berubah
   saat kartunya bergerak.

   Ini tidak pernah terlihat sebelum `resolution` memakai ukuran canvas
   sungguhan: aspect-nya dulu 1000/1000 dan 1000/2000, alias 1 dan 0,5 — dua
   pengali yang di biner tidak membulatkan apa pun, jadi perbandingannya
   kebetulan selalu tepat. Aspect sungguhan (2,23 dan 0,153) tidak sebaik itu.

   Perbaikannya menghitung currentP dari posisi yang BELUM dikalikan aspect,
   jadi ketiganya lahir dari bentuk ungkapan yang sama dan titik yang identik
   menghasilkan bit yang identik. Nilainya sendiri tidak berubah — (x*a)/(w*a)
   memang x/w — yang berubah cuma pembulatannya. */
const BAND_SIDE = 'finalPosition.xy += normal.xy * side;';
const BAND_CURRENT = 'vec2 currentP = fix(finalPosition, aspect);';
const patchBandShader = (shader: {vertexShader: string}) => {
    shader.vertexShader = shader.vertexShader
        .replace(BAND_SIDE, 'finalPosition.xy += vec2(normal.x, normal.y * aspect) * side;')
        .replace(BAND_CURRENT, 'vec2 currentP = fix(m * vec4(position, 1.0), aspect);');
};

const PHYSICS_STEP = 1 / 60;
// Limit catch-up to three fixed steps on a late handheld frame.
class MobileClock extends THREE.Clock {
    override getDelta() { return Math.min(super.getDelta(), PHYSICS_STEP * 3); }
}

const GRIP_BLEND = 1 - Math.exp(-45 * PHYSICS_STEP);
const MAX_GRIP_STEP = 90 * PHYSICS_STEP;
const MAX_CANVAS_PIXELS = 6_000_000;
type PointerCapture = Pick<Element, 'setPointerCapture' | 'hasPointerCapture' | 'releasePointerCapture'>;

const segmentProps = {
    canSleep: true,
    colliders: false,
    angularDamping: 4,
    linearDamping: 4,
} satisfies RigidBodyProps;

const bandAttributes = ['position', 'previous', 'next'] as const;

function updateBandGeometry(geometry: MeshLineGeometry, samples: THREE.Vector3[]) {
    if (geometry.getAttribute('position')?.count !== samples.length * 2) {
        geometry.setPoints(samples);
        for (const name of bandAttributes) {
            (geometry.getAttribute(name) as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
        }
        return;
    }

    // Indeks, UV, dan sisi pita tetap sama. Tiga atribut ini saja yang bergerak.
    const position = geometry.getAttribute('position');
    const previous = geometry.getAttribute('previous');
    const next = geometry.getAttribute('next');
    const end = samples.length - 1;
    const closed = samples[0].equals(samples[end]);
    for (let i = 0; i <= end; i++) {
        const point = samples[i];
        const before = samples[i - 1] ?? samples[closed ? end - 1 : 0];
        const after = samples[i + 1] ?? samples[closed ? 1 : end];
        const vertex = i * 2;
        position.setXYZ(vertex, point.x, point.y, point.z);
        position.setXYZ(vertex + 1, point.x, point.y, point.z);
        previous.setXYZ(vertex, before.x, before.y, before.z);
        previous.setXYZ(vertex + 1, before.x, before.y, before.z);
        next.setXYZ(vertex, after.x, after.y, after.z);
        next.setXYZ(vertex + 1, after.x, after.y, after.z);
    }
    position.needsUpdate = previous.needsUpdate = next.needsUpdate = true;
}

interface LanyardProps {
    position?: [number, number, number];
    gravity?: [number, number, number];
    fov?: number;
    transparent?: boolean;
    containerClassName?: string;
    /* Tema halaman. Menentukan pasangan tekstur yang dipakai; keduanya tetap
       dimuat sekaligus, jadi menukarnya tidak memuat apa pun dari jaringan. */
    theme?: LanyardTheme;
    running?: boolean;
    ready: boolean;
    visualOnly: boolean;
    frameScale?: number;
    canvasRef?: React.RefObject<HTMLCanvasElement | null>;
    /* Dipanggil sekali begitu Band terpasang — artinya useGLTF/useTexture sudah
       selesai dan kartunya benar-benar berdiri, bukan sekadar konteks WebGL
       sudah jadi. Wadahnya transparan sampai saat itu (lihat .lanyard-box di
       globals.css); memudarkannya lebih awal memperlihatkan kotak kosong. */
    onReady?: () => void;
    /* Dipanggil tiap kali kartunya mulai/berhenti bergerak karena tangan
       pengguna: true saat digenggam, dan tetap true sampai ayunan sesudah
       dilepas mereda. Dipakai app/portfolio.css untuk melebarkan kotak canvas
       selama itu — lihat #lanyard-3d.is-active di blok HP. */
    onActive?: (active: boolean) => void;
}

export default function Lanyard({
                                    position = [0, 0, 30],
                                    gravity = [0, -40, 0],
                                    fov = 20,
                                    transparent = true,
                                    containerClassName,
                                    theme = 'dark',
                                    running = true,
                                    ready, visualOnly, frameScale = 1,
                                    canvasRef,
                                    onReady,
                                    onActive
                                }: LanyardProps) {
    const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 768);
    // Crop transparent overscan. Projection and band thickness keep the same pixel scale.
    const visibleFov = THREE.MathUtils.radToDeg(2 * Math.atan(frameScale * Math.tan(THREE.MathUtils.degToRad(fov) / 2)));
    const wrapper = useRef<HTMLDivElement>(null);
    const [dprCap, setDprCap] = useState(2);
    const gripId = useRef<number | null>(null);
    const [pointerPosition] = useState(() => new THREE.Vector2());

    const canvasEvents = useCallback((store: RootStore) => {
        if (visualOnly) return {enabled: false, priority: 1};
        const manager = events(store);
        const handlers = manager.handlers;
        if (!handlers) return manager;
        return {
            ...manager,
            handlers: {
                ...handlers,
                onPointerMove(event: Event) {
                    const pointer = event as PointerEvent;
                    if (pointer.pointerType === 'touch') return;
                    if (pointer.pointerId === gripId.current) {
                        // Kartu sudah tertangkap. Fisika hanya perlu koordinat terbaru.
                        pointerPosition.set(pointer.clientX, pointer.clientY);
                    } else {
                        handlers.onPointerMove(event);
                    }
                },
            },
        };
    }, [pointerPosition, visualOnly]);

    useEffect(() => {
        const handleResize = (): void => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const element = wrapper.current;
        if (!element) return;
        const observe = new ResizeObserver(([entry]) => {
            const {width, height} = entry.contentRect;
            // Kanvas melewati slot agar kartu dapat ditarik. Batasi piksel
            // bantalan transparan pada layar besar tanpa mengubah proyeksi.
            const budget = Math.sqrt(MAX_CANVAS_PIXELS / Math.max(1, width * height));
            setDprCap(Math.max(1, Math.min(2, Math.floor(budget * 100) / 100)));
        });
        observe.observe(element);
        return () => observe.disconnect();
    }, []);

    return (
        <div
            ref={wrapper}
            className={clsx(containerClassName || "relative z-0 w-full h-screen flex justify-center items-center transform scale-100 origin-center")}>
            <Canvas
                ref={canvasRef}
                events={canvasEvents}
                resize={{scroll: false}}
                /* Rapier meminta bingkai selama masih ada benda yang bergerak.
                   Visibilitas tetap dapat menjeda seluruh adegan. */
                frameloop={running ? 'demand' : 'never'}
                /* rotation eksplisit, walau nilainya identitas: tanpa kunci itu
                   R3F memanggil camera.lookAt(0,0,0) sendiri, dan kamera yang
                   digeser tegak (lihat position di lanyard-mount.tsx) jadi
                   MENOLEH ke pusat scene alih-alih menggeser bingkainya —
                   kartunya balik ke tengah canvas dan geserannya sia-sia. */
                camera={{position, fov: visibleFov, rotation: [0, 0, 0]}}
                /* Desktop turun dari [1,2] ke 1.5: kotaknya besar
                   (clamp(480px,58vw,640px)) dan isinya kartu berayun, bukan
                   teks, jadi piksel yang dihemat langsung jadi bingkai yang
                   tidak patah saat kartunya ditarik.

                   HP naik dari 1 ke 2. Batas 1 itu salah sasaran: layar HP
                   ber-devicePixelRatio 2,6-3,5, jadi canvas-nya digambar
                   sepertiga ukuran lalu diregangkan — mukanya kabur padahal
                   teksturnya 1376x1376. Ongkosnya tidak seperti di desktop
                   karena kotaknya di HP cuma #lanyard-slot-about 230px tinggi:
                   di dpr 2 itu ~120 ribu piksel, seperempat beban desktop.

                   preserveDrawingBuffer dilepas — tidak ada satu pun pembaca
                   canvas.toDataURL di repo ini (uji pun memotret lewat
                   Page.captureScreenshot), dan bendera itu memaksa peramban
                   menyalin buffer tiap frame. */
                dpr={[1, Math.min(dprCap, isMobile ? (visualOnly ? 1.75 : 2) : 1.5)]}
                gl={{alpha: transparent}}
                onCreated={({gl, set}) => {
                    gl.setClearColor(0x000000, transparent ? 0 : 1);
                    if (visualOnly) set({clock: new MobileClock()});
                }}
            >
                {/* Keep the canvas mounted while Rapier and the materials suspend. */}
                <Suspense fallback={null}>
                    <ambientLight intensity={Math.PI}/>
                    <Physics paused={!ready || !running} gravity={gravity} timeStep={PHYSICS_STEP} updatePriority={-1}>
                        <Band running={ready && running} visualOnly={visualOnly} frameScale={frameScale} isMobile={isMobile} theme={theme} onReady={onReady} onActive={onActive}
                            gripId={gripId} pointerPosition={pointerPosition}/>
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
                </Suspense>
            </Canvas>
        </div>
    );
}

interface BandProps {
    visualOnly: boolean;
    running: boolean;
    frameScale: number;
    isMobile?: boolean;
    theme?: LanyardTheme;
    onReady?: () => void;
    onActive?: (active: boolean) => void;
    gripId: React.RefObject<number | null>;
    pointerPosition: THREE.Vector2;
}

function Band({visualOnly, running, frameScale, isMobile = false, theme = 'dark', onReady, onActive, gripId, pointerPosition}: BandProps) {
    const band = useRef<THREE.Mesh<MeshLineGeometry>>(null);
    // Hook sambungan Rapier memakai tipe RefObject non-null.
    const fixed = useRef<RapierRigidBody>(null!);
    const j1 = useRef<RapierRigidBody>(null!);
    const j2 = useRef<RapierRigidBody>(null!);
    const j3 = useRef<RapierRigidBody>(null!);
    const card = useRef<RapierRigidBody>(null!);
    const joints = useMemo(() => [j3, j2, j1, fixed], []);
    const {rapier, rigidBodyStates} = useRapier();
    const getScene = useThree(state => state.get);
    const size = useThree(state => state.size);
    const {nodes, materials} = useGLTF(cardModel) as any;
    const [texture, dark, light] = useLanyardMaps();
    const painted = useRef(false);
    useLayoutEffect(() => {
        const state = getScene();
        state.clock.getDelta();
        state.invalidate();
    }, [getScene, running]);

    const [motion] = useState(() => ({
        curve: new THREE.CatmullRomCurve3(Array.from({length: 4}, () => new THREE.Vector3()), false, 'chordal'),
        point: new THREE.Vector3(),
        plane: new THREE.Plane(new THREE.Vector3(0, 0, 1)),
        ndc: new THREE.Vector2(),
        raycaster: new THREE.Raycaster(),
        hit: new THREE.Vector3(),
        offset: new THREE.Vector3(),
        target: new THREE.Vector3(),
        position: new THREE.Vector3(),
        motionStep: new THREE.Vector3(),
        angular: new THREE.Vector3(),
    }));
    const samples = useMemo(
        () => Array.from({length: isMobile ? 13 : 25}, () => new THREE.Vector3()), [isMobile]
    );
    const hovered = useRef(false);
    const activeRef = useRef(false);

    useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
    useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
    useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
    useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.45, 0]]);

    const release = useCallback(() => {
        if (gripId.current === null) return;
        gripId.current = null;
        const body = card.current;
        if (body) {
            const velocity = body.linvel();
            body.setBodyType(rapier.RigidBodyType.Dynamic, true);
            body.setLinvel(velocity, true);
        }
        document.body.style.cursor = hovered.current ? 'grab' : '';
        getScene().invalidate();
    }, [getScene, gripId, rapier]);

    useEffect(() => {
        if (visualOnly) return;
        const cancelPointer = (event: PointerEvent) => {
            if (event.pointerId === gripId.current) release();
        };
        const hide = () => {
            if (document.hidden) release();
        };
        window.addEventListener('pointercancel', cancelPointer, true);
        window.addEventListener('lostpointercapture', cancelPointer, true);
        window.addEventListener('blur', release);
        document.addEventListener('visibilitychange', hide);
        return () => {
            window.removeEventListener('pointercancel', cancelPointer, true);
            window.removeEventListener('lostpointercapture', cancelPointer, true);
            window.removeEventListener('blur', release);
            document.removeEventListener('visibilitychange', hide);
            if (hovered.current || gripId.current !== null) document.body.style.cursor = '';
        };
    }, [release, visualOnly]);

    function grab(event: ThreeEvent<PointerEvent>) {
        const body = card.current;
        const capture = event.target as PointerCapture | null;
        if (visualOnly || event.pointerType === 'touch' || !body || !capture || event.button !== 0 || gripId.current !== null) return;

        // Bidang tarik melewati pusat kartu agar kedalamannya bertahan saat ditangkap.
        motion.position.copy(body.translation());
        motion.plane.constant = -motion.position.z;
        if (!event.ray.intersectPlane(motion.plane, motion.hit)) return;
        motion.offset.copy(motion.hit).sub(motion.position);
        motion.target.copy(motion.position);
        pointerPosition.set(event.clientX, event.clientY);

        capture.setPointerCapture(event.pointerId);
        gripId.current = event.pointerId;
        const state = getScene();
        // Buang delta saat kanvas tidur sebelum pegangan membangunkan fisika.
        if (body.isSleeping()) state.clock.getDelta();
        body.setBodyType(rapier.RigidBodyType.KinematicPositionBased, true);
        j1.current?.wakeUp();
        j2.current?.wakeUp();
        j3.current?.wakeUp();
        document.body.style.cursor = 'grabbing';
        if (!activeRef.current) {
            activeRef.current = true;
            onActive?.(true);
        }
        state.invalidate();
    }

    // Satu sampel pointer terbaru per bingkai, dengan geometri kanvas saat ini.
    useFrame(({camera, gl}) => {
        if (gripId.current === null) return;
        const bounds = gl.domElement.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        motion.ndc.set(
            2 * (pointerPosition.x - bounds.left) / bounds.width - 1,
            1 - 2 * (pointerPosition.y - bounds.top) / bounds.height,
        );
        motion.raycaster.setFromCamera(motion.ndc, camera);
        if (motion.raycaster.ray.intersectPlane(motion.plane, motion.hit)) {
            motion.target.copy(motion.hit).sub(motion.offset);
        }
    }, -2);

    useBeforePhysicsStep(() => {
        const body = card.current;
        if (!body || body.isSleeping()) return;
        if (gripId.current !== null) {
            motion.position.copy(body.translation());
            motion.motionStep.copy(motion.target).sub(motion.position)
                .multiplyScalar(GRIP_BLEND).clampLength(0, MAX_GRIP_STEP);
            body.setNextKinematicTranslation(motion.position.add(motion.motionStep));
        }
        motion.angular.copy(body.angvel());
        motion.angular.y -= body.rotation().y * 0.25;
        body.setAngvel(motion.angular, false);
    });

    useFrame(state => {
        const body = card.current;
        const geometry = band.current?.geometry;
        if (!body || !geometry) return;
        // Rapier can have no registered active bodies before its first complete fixed tick.
        if (running && !body.isSleeping()) state.invalidate();

        // Tali mengikuti transformasi bergambar yang sudah diinterpolasi Rapier.
        let changed = geometry.getAttribute('position')?.count !== samples.length * 2;
        for (let index = 0; index < joints.length; index++) {
            const jointBody = joints[index].current;
            const visual = jointBody && rigidBodyStates.get(jointBody.handle)?.object;
            if (!visual) return;
            visual.getWorldPosition(motion.point);
            const point = motion.curve.points[index];
            if (point.distanceToSquared(motion.point) > 1e-8) {
                changed = true;
                point.copy(motion.point);
            }
        }
        if (changed) {
            for (let index = 0; index < samples.length; index++) {
                motion.curve.getPoint(index / (samples.length - 1), samples[index]);
            }
            updateBandGeometry(geometry, samples);
        }

        if (visualOnly) return;
        const held = gripId.current !== null;
        const velocity = body.linvel();
        const active = held || velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2 > 0.5;
        if (active !== activeRef.current) {
            activeRef.current = active;
            onActive?.(active);
        }

    });
    return (
        <>
            {/* Mobile starts with both ends of the spherical joint aligned. */}
            <group position={[0, 4, 0]}>
                <RigidBody ref={fixed} {...segmentProps} type="fixed"/>
                <RigidBody position={visualOnly ? [2 / 3, 1.45 / 3, 0] : [0.5, 0, 0]} ref={j1} {...segmentProps} type="dynamic">
                    <BallCollider args={[0.1]}/>
                </RigidBody>
                <RigidBody position={visualOnly ? [4 / 3, 2.9 / 3, 0] : [1, 0, 0]} ref={j2} {...segmentProps} type="dynamic">
                    <BallCollider args={[0.1]}/>
                </RigidBody>
                <RigidBody position={visualOnly ? [2, 1.45, 0] : [1.5, 0, 0]} ref={j3} {...segmentProps} type="dynamic">
                    <BallCollider args={[0.1]}/>
                </RigidBody>
                <RigidBody
                    position={[2, 0, 0]}
                    ref={card}
                    {...segmentProps}
                    type="dynamic"
                >
                    <CuboidCollider args={[0.8, 1.125, 0.01]}/>
                    <group
                        scale={2.25}
                        position={[0, -1.2, -0.05]}
                        onPointerOver={visualOnly ? undefined : event => {
                            if (event.pointerType === 'touch') return;
                            hovered.current = true;
                            if (gripId.current === null) document.body.style.cursor = 'grab';
                        }}
                        onPointerOut={visualOnly ? undefined : () => {
                            hovered.current = false;
                            if (gripId.current === null) document.body.style.cursor = '';
                        }}
                        onPointerUp={visualOnly ? undefined : event => {
                            if (event.pointerId !== gripId.current) return;
                            const capture = event.target as PointerCapture | null;
                            release();
                            if (capture?.hasPointerCapture(event.pointerId)) {
                                capture.releasePointerCapture(event.pointerId);
                            }
                        }}
                        onPointerDown={visualOnly ? undefined : grab}
                    >
                        <mesh geometry={nodes.card.geometry} onAfterRender={renderer => {
                            if (!painted.current && renderer.getRenderTarget() === null) {
                                painted.current = true;
                                queueMicrotask(() => onReady?.());
                            }
                        }}>
                            <meshPhysicalMaterial
                                map={theme === 'dark' ? dark : light}
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
            <mesh ref={band} position={[0, 0, 0.3]} frustumCulled={false}>
                <meshLineGeometry/>
                <meshLineMaterial
                    color="white"
                    /* Lihat patchBandShader di kepala berkas. */
                    onBeforeCompile={patchBandShader}
                    /* Aslinya depthTest={false} — pita jadi selalu tergambar di
                       depan, termasuk di atas gelang logam yang seharusnya
                       menahannya. Tanpa satu pun piksel tali yang hilang di
                       belakang clip, sambungannya terbaca "ditempel", bukan
                       "terkait". Dinyalakan supaya clip dan kartu benar-benar
                       menutupi tali saat ada di depannya. */
                    depthTest={true}
                    /* Ukuran canvas sungguhan, bukan [1000,1000] mati. Yang
                       dibaca shader meshline dari uniform ini cuma
                       resolution.x/resolution.y — aspeknya — dan lewat itu
                       tebal tali di layar = lineWidth x tinggi canvas / jarak
                       kamera. Dengan aspek dipalsukan jadi 1, "tinggi" di rumus
                       itu berganti jadi LEBAR canvas, dan lebar #lanyard-3d
                       dipatok 60vw ke kiri-kanan: talinya menebal mengikuti
                       lebar jendela sementara kartunya tidak (fov itu sudut
                       tegak, jadi kartu ikut TINGGI canvas). Terukur: tali 39px
                       pada jendela 1440 dan 49px pada 1902, kartunya 187px di
                       keduanya.
                       Di HP selisih itu jadi jurang. Kotaknya sempit dan
                       jangkung — 176x1150 — dan [1000,2000] memberi tali 3px di
                       sebelah kartu 84px: pita bertulisan yang tergambar
                       sebagai benang. Dengan aspek sungguhan tebal tali ikut
                       kartunya di mana pun, 19% dari lebar kartu, di HP maupun
                       di desktop selebar apa pun. */
                    resolution={[size.width, size.height]}
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
                       tali); ditolak, kembali ke 2.

                       Jumlah salinan tidak ikut berubah saat lineWidth di bawah
                       diturunkan ke 1,75; yang ikut adalah rasio PETAnya (kini
                       1459x251 alias 5,8), karena pitanya menyempit sementara
                       panjangnya tetap. */
                    repeat={[-2, 1]}
                    /* Selebar pengaitnya, tidak lebih. Dengan resolution yang
                       jujur di atas, rumus tebal tali di layar disederhanakan
                       jadi satu baris yang tinggi canvas maupun jarak kameranya
                       saling menghapus:

                           lebar pita (satuan dunia) = lineWidth x tan(fov/2)

                       Jadi angka ini SATU-SATUNYA yang menentukan lebar tali,
                       dan lebarnya sama di HP maupun desktop tanpa cabang —
                       kotak canvas boleh 2743x1229 atau 176x1150, kamera boleh
                       z=29 atau z=60, hasilnya tidak bergeser sedikit pun.

                       Targetnya cincin pengait di puncak kartu: nodes.clip
                       lebarnya 0,1372 di card.glb, dikali skala group 2,25 jadi
                       0,3087 satuan dunia. 0,3087 / tan(10°) = 1,75. Sebelumnya
                       2,24 alias 0,395 — pitanya 28% lebih lebar dari cincin
                       yang seharusnya menahannya, jadi terlihat menjulur keluar
                       di kiri-kanan pengait.

                       Berpasangan dengan repeat di bawah: mengubah angka ini
                       mengubah rasio bidang pita di layar, dan tekstur harus
                       ikut (tools/lanyard-texture.mjs) atau bintangnya melar. */
                    lineWidth={1.75 / frameScale}
                />
            </mesh>
        </>
    );
}
