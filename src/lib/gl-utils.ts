/**
 * gl-utils.ts
 * WebGL2 utilities: shader compilation, FBO management, multi-pass renderer
 * Modeled after liquid-glass-studio/src/utils/GLUtils.ts
 */

export interface ShaderProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
  vao: WebGLVertexArrayObject;
  buf: WebGLBuffer;
}

export interface FrameBuffer {
  fbo: WebGLFramebuffer;
  texture: WebGLTexture;
  width: number;
  height: number;
  internalFormat: GLenum;
  format: GLenum;
  type: GLenum;
}

interface FrameBufferOptions {
  preferHalfFloat?: boolean;
}

/* ── Vertex shader shared across all passes ── */
const VERTEX_SRC = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FULL_SCREEN_QUAD = new Float32Array([
  -1, -1,  1, -1, -1,  1,
  -1,  1,  1, -1,  1,  1,
]);

/** Compile a shader. Throws on error. */
function compileShader(gl: WebGL2RenderingContext, type: GLenum, src: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? '';
    gl.deleteShader(shader);
    throw new Error(`Shader compile error:\n${log}`);
  }
  return shader;
}

/** Link a program from pre-compiled shaders. Throws on error. */
function linkProgram(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram {
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog) ?? '';
    gl.deleteProgram(prog);
    throw new Error(`Program link error:\n${log}`);
  }
  return prog;
}

/** Create a ShaderProgram with the standard full-screen quad VAO. */
export function createShaderProgram(
  gl: WebGL2RenderingContext,
  fragmentSrc: string,
  uniformNames: string[],
): ShaderProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);
  const program = linkProgram(gl, vs, fs);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  // Collect uniform locations
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  for (const name of uniformNames) {
    uniforms[name] = gl.getUniformLocation(program, name);
  }

  // Full-screen quad VAO
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  const buf = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, FULL_SCREEN_QUAD, gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  return { program, uniforms, vao, buf };
}

/** Create a colour-only FBO at the given size. */
export function createFrameBuffer(
  gl: WebGL2RenderingContext,
  w: number,
  h: number,
  options: FrameBufferOptions = {},
): FrameBuffer {
  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  const supportsFloat =
    options.preferHalfFloat !== false && Boolean(gl.getExtension("EXT_color_buffer_float"));

  let internalFormat: GLenum = gl.RGBA8;
  let format: GLenum = gl.RGBA;
  let type: GLenum = gl.UNSIGNED_BYTE;

  if (supportsFloat) {
    internalFormat = gl.RGBA16F;
    type = gl.HALF_FLOAT;
  }

  const allocate = (nextInternalFormat: GLenum, nextFormat: GLenum, nextType: GLenum) => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, nextInternalFormat, w, h, 0, nextFormat, nextType, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  };

  allocate(internalFormat, format, type);

  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    internalFormat = gl.RGBA8;
    format = gl.RGBA;
    type = gl.UNSIGNED_BYTE;
    allocate(internalFormat, format, type);
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return { fbo, texture, width: w, height: h, internalFormat, format, type };
}

/** Resize an existing FBO to new dimensions. */
export function resizeFrameBuffer(gl: WebGL2RenderingContext, fb: FrameBuffer, w: number, h: number): void {
  fb.width = w;
  fb.height = h;
  gl.bindTexture(gl.TEXTURE_2D, fb.texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, fb.internalFormat, w, h, 0, fb.format, fb.type, null);
}

export function destroyFrameBuffer(gl: WebGL2RenderingContext, fb: FrameBuffer): void {
  gl.deleteFramebuffer(fb.fbo);
  gl.deleteTexture(fb.texture);
}

/** Load an HTMLImageElement into a WebGL texture. */
export function loadTexture(gl: WebGL2RenderingContext, img: HTMLImageElement): WebGLTexture {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  return tex;
}

/** Update an existing texture from a new image element. */
export function updateTexture(gl: WebGL2RenderingContext, tex: WebGLTexture, img: HTMLImageElement): void {
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
}

/** Draw a full-screen quad using the given program and VAO. */
export function drawQuad(gl: WebGL2RenderingContext, sp: ShaderProgram): void {
  gl.bindVertexArray(sp.vao);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.bindVertexArray(null);
}

export function destroyShaderProgram(gl: WebGL2RenderingContext, sp: ShaderProgram): void {
  gl.deleteBuffer(sp.buf);
  gl.deleteVertexArray(sp.vao);
  gl.deleteProgram(sp.program);
}

/** Bind a texture to a texture unit and set the corresponding uniform. */
export function bindTexture(
  gl: WebGL2RenderingContext,
  sp: ShaderProgram,
  uniformName: string,
  tex: WebGLTexture,
  unit: number,
): void {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  if (sp.uniforms[uniformName] !== null) {
    gl.uniform1i(sp.uniforms[uniformName]!, unit);
  }
}
