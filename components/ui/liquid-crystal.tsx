"use client";

import React, { useRef, useEffect, RefObject } from "react";

interface ShaderProps {
  hue: number;
  speed: number;
  noise: number;
  warp: number;
  zoom: number;
  brightness: number;
}

const FRAGMENT_SHADER = `
  precision highp float;
  uniform float iTime;
  uniform vec2 iResolution;
  uniform vec2 iMouse;
  uniform float uHue;
  uniform float uNoise;
  uniform float uWarp;
  uniform float uZoom;
  uniform float uBrightness;

  vec3 hsv2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z * mix(vec3(1.0), rgb, c.y);
  }

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289v(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289v(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);
    uv *= uZoom;
    vec2 mouseUv = (iMouse * 2.0 - 1.0);
    mouseUv.y *= -1.0;
    uv += mouseUv * uWarp;
    float time = iTime * 0.5;
    float noise_pattern = snoise(uv * 1.5 + vec2(time * 0.3, -time * 0.2)) * 0.5;
    noise_pattern += snoise(uv * 3.0 + vec2(-time * 0.2, time * 0.3)) * 0.25;
    noise_pattern = (noise_pattern + 1.0) * 0.5;
    float bands = sin(noise_pattern * 15.0 - time * 2.0);
    bands = smoothstep(0.4, 0.6, bands);
    float detail = snoise(uv * 10.0 + time) * 0.5 + 0.5;
    bands = mix(bands, bands + detail, uNoise);
    vec3 baseColor = hsv2rgb(vec3(uHue / 360.0, 0.7, 1.0));
    vec3 color = baseColor * bands * uBrightness;
    gl_FragColor = vec4(color, 1.0);
  }
`;

const VERTEX_SHADER = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

function compileShader(gl: WebGLRenderingContext, source: string, type: number): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function useWebGLShader(canvasRef: RefObject<HTMLCanvasElement | null>, props: ShaderProps) {
  const mousePos = useRef({ x: 0.5, y: 0.5 });
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { antialias: true });
    if (!gl) return;
    glRef.current = gl;

    const vert = compileShader(gl, VERTEX_SHADER, gl.VERTEX_SHADER);
    const frag = compileShader(gl, FRAGMENT_SHADER, gl.FRAGMENT_SHADER);
    if (!vert || !frag) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    uniformsRef.current = {
      iTime: gl.getUniformLocation(program, "iTime"),
      iResolution: gl.getUniformLocation(program, "iResolution"),
      iMouse: gl.getUniformLocation(program, "iMouse"),
      uHue: gl.getUniformLocation(program, "uHue"),
      uNoise: gl.getUniformLocation(program, "uNoise"),
      uWarp: gl.getUniformLocation(program, "uWarp"),
      uZoom: gl.getUniformLocation(program, "uZoom"),
      uBrightness: gl.getUniformLocation(program, "uBrightness"),
    };

    const handleResize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePos.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: 1.0 - (e.clientY - rect.top) / rect.height,
      };
    };
    window.addEventListener("mousemove", handleMouse);

    const startTime = performance.now();
    const animate = () => {
      const u = uniformsRef.current;
      const time = ((performance.now() - startTime) / 1000) * props.speed;
      gl.uniform1f(u.iTime as WebGLUniformLocation, time);
      gl.uniform2f(u.iResolution as WebGLUniformLocation, canvas.width, canvas.height);
      gl.uniform2f(u.iMouse as WebGLUniformLocation, mousePos.current.x, mousePos.current.y);
      gl.uniform1f(u.uHue as WebGLUniformLocation, props.hue);
      gl.uniform1f(u.uNoise as WebGLUniformLocation, props.noise);
      gl.uniform1f(u.uWarp as WebGLUniformLocation, props.warp);
      gl.uniform1f(u.uZoom as WebGLUniformLocation, props.zoom);
      gl.uniform1f(u.uBrightness as WebGLUniformLocation, props.brightness);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouse);
      gl.deleteProgram(program);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      gl.deleteBuffer(buf);
    };
  }, [canvasRef, props.hue, props.speed, props.noise, props.warp, props.zoom, props.brightness]);
}

export function LiquidCrystal(props: ShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useWebGLShader(canvasRef, props);
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
