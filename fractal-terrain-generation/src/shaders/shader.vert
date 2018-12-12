/* attribute float textureIdx; */

varying vec3 worldPosition;

// declare variables to pass to fragment shaders
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vTextureIdx;

void main() {
    /* vTextureIdx = textureIdx; */
    vUv = uv;
    /* vNormal = normal; */
		vNormal = (modelMatrix * vec4(normal, 0.0)).xyz;
    vPosition = position;
    vec4 mPosition = modelMatrix * vec4(position, 1.0 );	
		/* vPosition = mPosition.xyz; */
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    worldPosition = mPosition.xyz;
}
