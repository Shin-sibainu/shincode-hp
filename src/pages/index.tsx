import NavBar from "@/components/Navbar";
import Head from "next/head";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

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
    const light = new THREE.PointLight(0xffffff, 1.3, 0);
    light.position.set(4, 3.4, 1);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040, 1); // soft white light
    scene.add(ambientLight);

    //star
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.9,
      transparent: true,
      blending: THREE.AdditiveBlending,
    }); // change this line
    // Create an array to hold the star positions
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

    // Set the vertices for the geometry
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
        light.rotation.x = 1.65 * Math.sin(Date.now() / 5000);

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
      <section id="product" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center">Products</h2>
          <p className="text-center mt-4">Our amazing products...</p>
          {/* Add your product details */}
        </div>
      </section>
      <section id="about" className="py-20 bg-gray-200">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center">About Us</h2>
          <p className="text-center mt-4">We are a great company...</p>
          {/* Add your about details */}
        </div>
      </section>
      <section id="contact" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center">Contact Us</h2>
          <p className="text-center mt-4">Get in touch with us...</p>
          {/* Add your contact form */}
        </div>
      </section>
    </>
  );
}
