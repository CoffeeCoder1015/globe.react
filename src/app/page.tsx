"use client"
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { getSubsolarCoordinates } from "@/lib/sunpos";

function latLonToCartesian(lat: number, lon: number, radius = 1) {
	const phi = (90 - lat) * (Math.PI / 180);
	const theta = (lon + 180) * (Math.PI / 180);

	const x = -radius * Math.sin(phi) * Math.cos(theta);
	const z = radius * Math.sin(phi) * Math.sin(theta);
	const y = radius * Math.cos(phi);

	return new THREE.Vector3(x, y, z);
}

let canvas: HTMLCanvasElement;

function initScene(currentMount: HTMLDivElement) {
	const scene = new THREE.Scene()
	const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000)
	camera.position.z = 20
	// eye balling prime meridian 2.0
	const yAxis = new THREE.Vector3(0, 1, 0)
	const xAxis = new THREE.Vector3(1, 0, 0)
	camera.position.applyAxisAngle(yAxis, Math.PI / 2);
	camera.lookAt(new THREE.Vector3(0, 0, 0))

	function moveTo(lat: number, lon: number) {
		const current = latLonToCartesian(lat, lon).multiplyScalar(20);
		camera.position.copy(current)
		camera.lookAt(new THREE.Vector3(0, 0, 0))
	}
	navigator.geolocation.getCurrentPosition((pos) => {
		moveTo(pos.coords.latitude, pos.coords.longitude)
	})

	const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
	renderer.setClearColor(0x000000, 0)
	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setSize(currentMount.clientWidth, currentMount.clientHeight)

	canvas = renderer.domElement;

	const lightPosition = new THREE.Vector3(100, 0, 0)
	const ambientLightIntensity = 0.06

	const radiusEarth = 10;
	const radiuSAtmosphere = 1.1 * radiusEarth;
	const globe = new THREE.Mesh(new THREE.SphereGeometry(radiusEarth, 100, 50), new THREE.ShaderMaterial());
	scene.add(globe);
	const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(radiuSAtmosphere, 160, 80), new THREE.ShaderMaterial());
	scene.add(atmosphere);

	async function render() {
		const [vertexGlobe, fragmentGlobe] = await Promise.all([
			fetch("./globe/vert.glsl").then(res => res.text()),
			fetch("./globe/frag.glsl").then(res => res.text())
		])

		const [vertexAtmosphere, fragmentAtmosphere] = await Promise.all([
			fetch("./atmosphere/vert.glsl").then(res => res.text()),
			fetch("./atmosphere/frag.glsl").then(res => res.text())
		])

		const shaderGlobe = new THREE.ShaderMaterial({
			vertexShader: vertexGlobe,
			fragmentShader: fragmentGlobe,
			uniforms: {
				dayTexture: {
					value: new THREE.TextureLoader().load("./globe/earth-day.jpg")
				},
				nightTexture: {
					value: new THREE.TextureLoader().load("./globe/earth-night.jpg")
				},
				lightPosition: {
					value: lightPosition
				},
				ambientLightIntensity: {
					value: ambientLightIntensity
				}
			}
		})
		globe.material = shaderGlobe

		const shaderAtmosphere = new THREE.ShaderMaterial({
			vertexShader: vertexAtmosphere,
			fragmentShader: fragmentAtmosphere,
			transparent: true,
			uniforms: {
				lightPosition: {
					value: lightPosition
				},
				ambientLightIntensity: {
					value: ambientLightIntensity
				},
				radiusEarth: {
					value: radiusEarth
				},
				radiusAtmosphere: {
					value: radiuSAtmosphere
				}
			}
		})
		atmosphere.material = shaderAtmosphere
	}
	render()

	setInterval(() => {
		const d = new Date();
		const [longitude, latitude] = getSubsolarCoordinates(d);
		const pos = latLonToCartesian(latitude, longitude - 180).multiplyScalar(100)
		lightPosition.copy(pos)
	}, 100);


	function animate() {
		requestAnimationFrame(animate)
		const glp = globe.material.uniforms.lightPosition
		const alp = atmosphere.material.uniforms.lightPosition

		// camera orbit
		// camera.position.applyAxisAngle(new THREE.Vector3(0,1,1),1/200);
		// camera.lookAt(new THREE.Vector3(0,0,0))

		if (glp != undefined) {
			glp.value.set(...lightPosition)
			alp.value.set(...lightPosition)
		}
		renderer.render(scene, camera)
	}
	animate()
}


export default function Home() {
	const renderRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		const currentMount = renderRef.current
		if (!currentMount) {
			return
		}

		if (!canvas) {
			initScene(currentMount)
		}

		if (canvas && !currentMount.contains(canvas)) {
			currentMount.appendChild(canvas);
		}
	}, [])

	return (
		<div className="flex flex-col items-center justify-center w-screen h-screen">
			<div ref={renderRef} className="w-[50vw] h-[50vh]"></div>
		</div>
	)
}
