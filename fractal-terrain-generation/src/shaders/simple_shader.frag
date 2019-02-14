precision highp float;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vTextureIdx;

uniform vec3 directionalLightColor[1];
uniform vec3 directionalLightDirection[1];
uniform sampler2D textures[7];

void main() {
	vec4 lights = vec4(0.0, 0.0, 0.0, 1.0);
	vec4 ambient = vec4(0.4, 0.4, 0.4, 1.0);
  vec3 lightVector = normalize(vPosition - vec3(0, 50, 0));
  lights.rgb += clamp(dot(-vec3(0, -1, 0), vNormal), 0.0, 1.0) * vec3(2,2,2);

  for (int k = 0; k < 7; ++k) {
    if (vTextureIdx - float(k) <= 0.1) {
      vec4 lowTex = texture2D(textures[k], vUv);
      gl_FragColor = (lowTex * lights) + (lowTex * ambient);
      break;
    }
  }
}
