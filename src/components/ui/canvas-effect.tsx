// @ts-nocheck
"use client";

import React, { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export const CanvasRevealEffect = ({
  animationSpeed = 0.4,
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[0, 255, 255]],
  containerClassName,
  dotSize,
}) => {
  return (
    <div className={cn("relative h-full w-full bg-black", containerClassName)}>
      <div className="h-full w-full">
        <DotMatrix
          colors={colors ?? [[0, 255, 255]]}
          dotSize={dotSize ?? 3}
          opacities={opacities ?? [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1]}
          shader={`float animation_speed_factor = ${animationSpeed.toFixed(1)};float intro_offset = distance(u_resolution / 2.0 / u_total_size, st2) * 0.01 + (random(st2) * 0.15);opacity *= step(intro_offset, u_time * animation_speed_factor);opacity *= clamp((1.0 - step(intro_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);`}
          center={["x", "y"]}
        />
      </div>
    </div>
  );
};

const DotMatrix = ({
  colors = [[0, 0, 0]],
  opacities = [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14],
  totalSize = 4,
  dotSize = 2,
  shader = "",
  center = ["x", "y"],
}) => {
  const uniforms = React.useMemo(() => {
    let colorsArray = [colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]];
    if (colors.length === 2) colorsArray = [colors[0], colors[0], colors[0], colors[1], colors[1], colors[1]];
    else if (colors.length === 3) colorsArray = [colors[0], colors[0], colors[1], colors[1], colors[2], colors[2]];
    return {
      u_colors: { value: colorsArray.map((c) => [c[0] / 255, c[1] / 255, c[2] / 255]), type: "uniform3fv" },
      u_opacities: { value: opacities, type: "uniform1fv" },
      u_total_size: { value: totalSize, type: "uniform1f" },
      u_dot_size: { value: dotSize, type: "uniform1f" },
    };
  }, [colors, opacities, totalSize, dotSize]);

  const xCenter = center.includes("x")
    ? "st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));"
    : "";
  const yCenter = center.includes("y")
    ? "st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));"
    : "";

  const glslSource = `precision mediump float;
in vec2 fragCoord;
uniform float u_time;
uniform float u_opacities[10];
uniform vec3 u_colors[6];
uniform float u_total_size;
uniform float u_dot_size;
uniform vec2 u_resolution;
out vec4 fragColor;
float PHI = 1.61803398874989484820459;
float random(vec2 xy){ return fract(tan(distance(xy*PHI,xy)*0.5)*xy.x); }
void main(){
  vec2 st = fragCoord.xy;
  ${xCenter}
  ${yCenter}
  float opacity = step(0.0, st.x);
  opacity *= step(0.0, st.y);
  vec2 st2 = vec2(int(st.x/u_total_size), int(st.y/u_total_size));
  float frequency = 5.0;
  float show_offset = random(st2);
  float rand = random(st2 * floor((u_time/frequency) + show_offset + frequency) + 1.0);
  opacity *= u_opacities[int(rand * 10.0)];
  opacity *= 1.0 - step(u_dot_size/u_total_size, fract(st.x/u_total_size));
  opacity *= 1.0 - step(u_dot_size/u_total_size, fract(st.y/u_total_size));
  vec3 color = u_colors[int(show_offset * 6.0)];
  ${shader}
  fragColor = vec4(color, opacity);
  fragColor.rgb *= fragColor.a;
}`;

  return <Shader source={glslSource} uniforms={uniforms} maxFps={60} />;
};

const ShaderMaterial = ({ source, uniforms, maxFps = 60 }) => {
  const { size } = useThree();
  const ref = useRef();
  let lastFrameTime = 0;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const ts = clock.getElapsedTime();
    if (ts - lastFrameTime < 1 / maxFps) return;
    lastFrameTime = ts;
    ref.current.material.uniforms.u_time.value = ts;
  });

  const getUniforms = () => {
    const p = {};
    for (const n in uniforms) {
      const u = uniforms[n];
      if (u.type === "uniform1f") p[n] = { value: u.value };
      else if (u.type === "uniform1fv") p[n] = { value: u.value };
      else if (u.type === "uniform3fv") p[n] = { value: u.value.map((v) => new THREE.Vector3(...v)) };
      else if (u.type === "uniform3f") p[n] = { value: new THREE.Vector3(...u.value) };
      else if (u.type === "uniform2f") p[n] = { value: new THREE.Vector2(...u.value) };
    }
    p["u_time"] = { value: 0 };
    p["u_resolution"] = { value: new THREE.Vector2(size.width * 2, size.height * 2) };
    return p;
  };

  const vertexShader = `precision mediump float;
in vec2 coordinates;
uniform vec2 u_resolution;
out vec2 fragCoord;
void main(){
  gl_Position = vec4(position.x, position.y, 0.0, 1.0);
  fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
  fragCoord.y = u_resolution.y - fragCoord.y;
}`;

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: source,
        uniforms: getUniforms(),
        glslVersion: THREE.GLSL3,
        blending: THREE.CustomBlending,
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.OneFactor,
      }),
    [size.width, size.height, source]
  );

  return (
    <mesh ref={ref}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

const Shader = ({ source, uniforms, maxFps = 60 }) => (
  <Canvas className="absolute inset-0 h-full w-full">
    <ShaderMaterial source={source} uniforms={uniforms} maxFps={maxFps} />
  </Canvas>
);
