precision highp float;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

uniform vec3 directionalLightColor[1];
uniform vec3 directionalLightDirection[1];
uniform sampler2D textures[7];

int whichTex() {
  float heightIncr = 50.0 / 7.0;

  for (int i = 0; i < 7; i += 1) {
    if (vPosition.y <= float(i) * heightIncr) {
      return i;
    }
  }
  return 6;
}

void main() {
	vec4 lights = vec4(0.0, 0.0, 0.0, 1.0);
	vec4 ambient = vec4(0.4, 0.4, 0.4, 1.0);
  vec3 lightVector = normalize(vPosition - vec3(0, 50, 0));
  lights.rgb += clamp(dot(-vec3(0, -1, 0), vNormal), 0.0, 1.0) * vec3(2,2,2);

  int textureIndex = whichTex();

  for (int k = 0; k < 7; ++k) {
    if (textureIndex == k) {
      vec4 lerp = texture2D(textures[k], vUv);
      gl_FragColor = (lerp * lights) + (lerp * ambient);
    }
  }
}
