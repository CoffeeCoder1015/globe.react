"use client"

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { TextureLoader, Vector3, ShaderMaterial } from 'three'
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLoader } from '@react-three/fiber'
import { getSubsolarCoordinates } from '@/lib/sunpos'

function latLonToCartesian(lat: number, lon: number, radius = 1) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  const x = -radius * Math.sin(phi) * Math.cos(theta)
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)
  return new Vector3(x, y, z)
}

const radiusEarth = 10
function GlobeMesh({ lightPosition, ambientLightIntensity }: {
  lightPosition: Vector3,
  ambientLightIntensity: number
}) {
  const dayTexture = useLoader(TextureLoader, '/globe/earth-day.jpg')
  const nightTexture = useLoader(TextureLoader, '/globe/earth-night.jpg')

  const shaderMaterialRef = useRef<ShaderMaterial>(null!)
  const [vertexShader, setVertexShader] = useState('')
  const [fragmentShader, setFragmentShader] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/globe/vert.glsl').then(res => res.text()),
      fetch('/globe/frag.glsl').then(res => res.text())
    ]).then(([vert, frag]) => {
      setVertexShader(vert)
      setFragmentShader(frag)
    })
  }, [])

  useFrame(() => {
    if (shaderMaterialRef.current) {
      shaderMaterialRef.current.uniforms.lightPosition.value.copy(lightPosition)
    }
  })

  const uniforms = useMemo(() => ({
    dayTexture: { value: dayTexture },
    nightTexture: { value: nightTexture },
    lightPosition: { value: lightPosition },
    ambientLightIntensity: { value: ambientLightIntensity },
  }), [dayTexture, nightTexture, lightPosition])

  if (!vertexShader || !fragmentShader) return null

  return (
    <mesh renderOrder={2}>
      <sphereGeometry args={[radiusEarth, 100, 50]} />
      <shaderMaterial
        ref={shaderMaterialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}

function AtmosphereMesh({ lightPosition, ambientLightIntensity }: {
  lightPosition: Vector3,
  ambientLightIntensity: number
}) {
  const radiusAtmosphere = radiusEarth * 1.1

  const shaderMaterialRef = useRef<ShaderMaterial>(null!)
  const [vertexShader, setVertexShader] = useState('')
  const [fragmentShader, setFragmentShader] = useState('')
  const [haloShader, setHaloShader] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/atmosphere/vert.glsl').then(res => res.text()),
      fetch('/atmosphere/newfrag.glsl').then(res => res.text()),
      fetch('/atmosphere/halo.glsl').then(res => res.text())
    ]).then(([vert, frag, halo]) => {
      setVertexShader(vert)
      setFragmentShader(frag)
      setHaloShader(halo)
    })
  }, [])

  useFrame(() => {
    if (shaderMaterialRef.current) {
      shaderMaterialRef.current.uniforms.lightPosition.value.copy(lightPosition)
    }
  })

  const uniforms = useMemo(() => ({
    lightPosition: { value: lightPosition },
    ambientLightIntensity: { value: ambientLightIntensity },
    radiusEarth: { value: radiusEarth },
    radiusAtmosphere: { value: radiusAtmosphere },
  }), [lightPosition])

  if (!vertexShader || !fragmentShader) return null

  return (
    <>
    <mesh renderOrder={0}>
      <sphereGeometry args={[radiusEarth, 64, 64]} />
      <meshBasicMaterial
        colorWrite={false}
        depthWrite={false}
        stencilWrite={true}
        stencilFunc={THREE.AlwaysStencilFunc}
        stencilRef={1}
        stencilZPass={THREE.ReplaceStencilOp}
      />
    </mesh>
    <mesh renderOrder={1}>
      <sphereGeometry args={[radiusAtmosphere, 160, 80]} />
      <shaderMaterial
        ref={shaderMaterialRef}
        vertexShader={vertexShader}
        fragmentShader={haloShader}
        uniforms={uniforms}
        stencilWrite
        stencilFunc={THREE.NotEqualStencilFunc}
        stencilRef={1}
      />
    </mesh>
    <mesh renderOrder={2}>
      <sphereGeometry args={[radiusEarth*1.01, 160, 80]} />
      <shaderMaterial
        ref={shaderMaterialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
    </>
  )
}

function GlobeScene() {
  const lightPosition = useRef(new Vector3(100, 0, 0)).current
  const ambientLightIntensity = 0.06

  const { camera } = useThree()

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const vec = latLonToCartesian(pos.coords.latitude, pos.coords.longitude, 20)
      camera.position.copy(vec)
      camera.lookAt(0, 0, 0)

    })
  }, [camera])

  useEffect(() => {
    const interval = setInterval(() => {
      const [lon, lat] = getSubsolarCoordinates(new Date())
      lightPosition.copy(latLonToCartesian(lat, lon - 180, 100))
    }, 100)

    const interval2 = setInterval(() => {
        camera.position.applyAxisAngle(new THREE.Vector3(0,1,0),1/200);
        camera.lookAt(new THREE.Vector3(0,0,0))
    }, 20)
    return () => { 
        clearInterval(interval) 
        clearInterval(interval2) 
    }
  }, [])

  return (
    <>
      <GlobeMesh lightPosition={lightPosition} ambientLightIntensity={ambientLightIntensity} />
      <AtmosphereMesh lightPosition={lightPosition} ambientLightIntensity={ambientLightIntensity} />
    </>
  )
}

export function Globe() {
  return (
    <div className="w-[100vw] h-[100vh]">
      <Canvas camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 0, 20] }} gl={{stencil:true}}>
        <GlobeScene />
      </Canvas>
    </div>
  )
}
