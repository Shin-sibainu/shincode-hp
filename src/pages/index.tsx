import NavBar from "@/components/Navbar";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { InView, useInView } from "react-intersection-observer";
import { useSpring, animated } from "react-spring";

export default function Home() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const getScaleBasedOnWindowWidth = () => {
    const width = window.innerWidth;
    if (width <= 480) {
      // for mobile devices
      return 0.5;
    } else if (width <= 768) {
      // for tablets
      return 0.75;
    } else {
      return 1;
    }
  };

  useEffect(() => {
    let frameId = null;
    if (!mountRef.current) return; // 追加

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer();
    const loader = new THREE.TextureLoader();

    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Earth
    const earthTexture = loader.load("/earth.jpg"); // path to your earth texture
    const earthGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const earthMaterial = new THREE.MeshPhongMaterial({ map: earthTexture });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);

    earth.position.set(0, 0, 0); // Set the position of the Earth relative to the scene
    scene.add(earth);

    // Initial scale for the earth
    earth.scale.set(0, 0, 0);

    // Moon
    const moonTexture = loader.load("/moon.jpg"); // path to your moon texture
    const moonGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    const moonMaterial = new THREE.MeshPhongMaterial({ map: moonTexture });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);

    moon.position.set(1.85, 0, 0); // Set the position of the moon relative to the Earth
    earth.add(moon); // Add the moon as a child of the earth

    camera.position.z = 2.8;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2;
    controls.enablePan = false;

    //light
    const light = new THREE.PointLight(0xffffff, 1.7, 0);
    light.position.set(4, 3.4, 1);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040, 1.4); // soft white light
    scene.add(ambientLight);

    //star
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.9,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    const starVertices = [];
    const starVelocities = [];

    // Generate random positions for the stars
    for (let i = 0; i < 2000; i++) {
      const x = THREE.MathUtils.randFloatSpread(1000);
      const y = THREE.MathUtils.randFloatSpread(1000);
      const z = THREE.MathUtils.randFloatSpread(1000);
      starVertices.push(x, y, z);
      starVelocities.push(
        THREE.MathUtils.randFloatSpread(0.1), // add this line
        THREE.MathUtils.randFloatSpread(0.1), // add this line
        THREE.MathUtils.randFloatSpread(0.1) // add this line
      );
    }

    starGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starVertices, 3)
    );
    starGeometry.setAttribute(
      // add this line
      "velocity",
      new THREE.Float32BufferAttribute(starVelocities, 3)
    );

    // Create the points object and add it to the scene
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    /* =================================================== */
    // 具体的なポイント（会社情報など）を表現するシンプルな球体を作成します。
    const pointsData = [
      { id: 1, lat: 35.6895, lon: 139.6917, name: "Tokyo", color: 0xff0000 },
      { id: 2, lat: 40.7128, lon: -74.006, name: "New York", color: 0x00ff00 },
      { id: 3, lat: 48.8566, lon: 2.3522, name: "Paris", color: 0x0000ff },
    ];

    const points = pointsData.map((pointData) => {
      const pointGeometry = new THREE.SphereGeometry(0.05, 32, 32);
      const pointMaterial = new THREE.MeshBasicMaterial({
        color: pointData.color,
      });
      const point = new THREE.Mesh(pointGeometry, pointMaterial);

      // 緯度と経度から位置を計算し、地球上にポイントを配置します。
      const radius = 1.5;
      const latRad = (pointData.lat * Math.PI) / 180;
      const lonRad = (-pointData.lon * Math.PI) / 180;
      point.position.set(
        radius * Math.cos(latRad) * Math.cos(lonRad),
        radius * Math.sin(latRad),
        radius * Math.cos(latRad) * Math.sin(lonRad)
      );

      point.userData = pointData; // userDataを使用して、ポイントに関連するデータを格納します。

      earth.add(point); // 地球にポイントを追加します。

      return point;
    });

    // イージング関数（ここでは3次のイージングを使用）
    function easeInOutCubic(t: number) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // クリックされたポイントの情報を表示する関数
    const showPointInfo = (point: any) => {
      // ここにポイントの情報を表示するロジックを書く
      // この例では、ポイントのuserDataフィールドに格納された情報をアラートとして表示
      // alert(JSON.stringify(point.userData, null, 2));
    };

    window.addEventListener("click", (event) => {
      // マウスの位置を正規化（-1から1の範囲）
      const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      );

      // レイキャスタを作成（マウスの位置からレイを投影）
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      // レイと交差するオブジェクトの配列を作成
      const intersects = raycaster.intersectObjects(points);

      // レイがオブジェクトと交差した場合（クリックされた場合）
      if (intersects.length > 0) {
        // 最も近いオブジェクトを取得
        const clickedPoint = intersects[0].object;

        // クリックされたポイントの情報を表示（この例ではコンソールに表示）
        console.log(clickedPoint.userData.name);
      }
    });
    /* =================================================== */

    let currentScale = 1;
    const animateScale = (mesh: any, targetScale: any, duration: any) => {
      const startTime = Date.now();
      const initialScale = mesh.scale.clone();

      const animate = function () {
        const elapsed = Date.now() - startTime;
        if (elapsed > duration) {
          currentScale = targetScale;
          mesh.scale.set(targetScale, targetScale, targetScale);
        } else {
          const currentScaleVector = initialScale.lerp(
            new THREE.Vector3(targetScale, targetScale, targetScale),
            elapsed / duration
          );
          currentScale = currentScaleVector.x;
          mesh.scale.set(
            currentScaleVector.x,
            currentScaleVector.y,
            currentScaleVector.z
          );
        }

        // Earth rotation (self-rotation)
        earth.rotation.y += 0.002;

        // Moon revolution (around the Earth)
        moon.rotation.y -= 0.01;
        moon.position.x = 1.85 * Math.sin(Date.now() / 5000);
        moon.position.z = 1.85 * Math.cos(Date.now() / 5000);

        //light position
        light.position.x = 20.65 * Math.sin(Date.now() / 5000);
        light.position.y = 13.85 * Math.sin(Date.now() / 5000);
        light.position.z = 3.85 * Math.sin(Date.now() / 5000);

        controls.update();

        renderer.render(scene, camera);

        // Animate stars
        for (let i = 0; i < stars.geometry.attributes.position.count; i++) {
          (stars.geometry.attributes.position.array as number[])[i * 3] += (
            stars.geometry.attributes.velocity.array as number[]
          )[i * 3];
          (stars.geometry.attributes.position.array as number[])[i * 3 + 1] += (
            stars.geometry.attributes.velocity.array as number[]
          )[i * 3 + 1];
          (stars.geometry.attributes.position.array as number[])[i * 3 + 2] += (
            stars.geometry.attributes.velocity.array as number[]
          )[i * 3 + 2];
        }
        stars.geometry.attributes.position.needsUpdate = true; // add this line

        requestAnimationFrame(animate); // この行を条件分岐の外に移動
      };

      animate();
    };

    const initialScale = getScaleBasedOnWindowWidth();
    animateScale(earth, initialScale, 4500);

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      // animateScale(earth, currentScale, 10); // この行でanimateScaleを再度呼び出す
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      scene.remove(earth, moon, stars);
      earthGeometry.dispose();
      earthMaterial.dispose();
      moonGeometry.dispose();
      moonMaterial.dispose();
      starGeometry.dispose(); // dispose starGeometry
      starMaterial.dispose(); // dispose starMaterial
      renderer.dispose();
    };
  }, []);

  return (
    <>
      <Head>
        <title>ShinCode株式会社</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <NavBar />
      <div className="relative overflow-hidden flex justify-center items-center">
        <h1 className="absolute z-10 sm:text-5xl text-white font-light text-2xl">
          Web開発ならShinCode
        </h1>
        <div ref={mountRef} className="w-screen h-screen"></div>
      </div>
    </>
  );
}
