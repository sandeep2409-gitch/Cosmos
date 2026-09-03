import * as THREE from 'three';

/**
 * Custom Photorealistic GLSL Shaders for Atmosphere Rayleigh Scattering, Sun Corona & Earth Day/Night
 */

export class Shaders {
  /**
   * Atmospheric Rayleigh Scattering Shader Material
   */
  static createAtmosphereMaterial(colorHex = 0x38bdf8, power = 3.5, coefficient = 0.9) {
    const color = new THREE.Color(colorHex);

    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: color },
        power: { value: power },
        coefficient: { value: coefficient }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform vec3 color;
        uniform float power;
        uniform float coefficient;
        void main() {
          vec3 viewVector = normalize(-vPosition);
          float intensity = pow(clamp(coefficient - dot(vNormal, viewVector), 0.0, 1.0), power);
          gl_FragColor = vec4(color, intensity);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });
  }

  /**
   * Earth Day / Night City Lights Shader Material
   */
  static createEarthDayNightMaterial(dayTexture, nightTexture, cloudTexture, sunPosition) {
    return new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: dayTexture },
        nightTexture: { value: nightTexture },
        cloudTexture: { value: cloudTexture },
        sunPosition: { value: sunPosition }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        void main() {
          vUv = uv;
          vNormal = normalize(mat3(modelMatrix) * normal);
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
        uniform sampler2D cloudTexture;
        uniform vec3 sunPosition;

        void main() {
          vec3 sunDir = normalize(sunPosition - vWorldPosition);
          float lightIntensity = dot(vNormal, sunDir);

          vec4 dayColor = texture2D(dayTexture, vUv);
          vec4 nightColor = texture2D(nightTexture, vUv);
          vec4 cloudColor = texture2D(cloudTexture, vUv);

          // Smooth transition between day and night (terminator line)
          float mixFactor = smoothstep(-0.25, 0.25, lightIntensity);

          // Combine day and night textures
          vec3 surfaceColor = mix(nightColor.rgb * 1.8, dayColor.rgb * (max(0.15, lightIntensity) + 0.1), mixFactor);

          // Add clouds on day and night sides
          vec3 finalColor = mix(surfaceColor, vec3(1.0), cloudColor.a * cloudColor.r * (mixFactor * 0.8 + 0.2));

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    });
  }

  /**
   * Dynamic Sun Solar Plasma Pulsating Shader Material
   */
  static createSunMaterial(sunTexture) {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        sunTexture: { value: sunTexture }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        uniform float time;
        uniform sampler2D sunTexture;

        void main() {
          vec2 uv = vUv;
          uv.x += sin(uv.y * 25.0 + time * 0.8) * 0.003;
          uv.y += cos(uv.x * 25.0 + time * 0.8) * 0.003;

          vec4 texColor = texture2D(sunTexture, uv);
          
          vec3 viewVector = vec3(0.0, 0.0, 1.0);
          float fresnel = pow(1.0 - dot(vNormal, viewVector), 2.0);
          vec3 glowColor = vec3(1.2, 0.7, 0.2) * fresnel;

          gl_FragColor = vec4(texColor.rgb * 1.3 + glowColor, 1.0);
        }
      `,
      side: THREE.FrontSide
    });
  }
}
