varying vec3 worldPosition;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vTextureIdx;

void main() {
    vUv = uv;
		vNormal = (modelMatrix * vec4(normal, 0.0)).xyz;
    vPosition = position;
    vec4 mPosition = modelMatrix * vec4(position, 1.0 );	
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    worldPosition = mPosition.xyz;
}
