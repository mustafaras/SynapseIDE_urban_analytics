// WGSL — Hillshade from a DEM elevation grid
//
// Each workgroup thread computes illumination for one pixel by
// deriving slope / aspect from a 3×3 neighbourhood (Horn's method)
// and evaluating the Lambertian cosine model.
//
// Uniforms: width, height, cellSize, azimuth (radians), altitude (radians).
// Input:    elevation grid (row-major f32).
// Output:   illumination value per pixel in [0, 1].

struct Params {
  width    : u32,
  height   : u32,
  cellSize : f32,     // cell size in metres
  azimuth  : f32,     // light azimuth (radians, 0 = north, CW)
  altitude : f32,     // light altitude angle (radians above horizon)
}

@group(0) @binding(0) var<uniform>       params : Params;
@group(0) @binding(1) var<storage, read> dem    : array<f32>;
@group(0) @binding(2) var<storage, read_write> result : array<f32>;

// Safe DEM lookup (clamps at edges)
fn elev(col : i32, row : i32) -> f32 {
  let c = clamp(col, 0, i32(params.width)  - 1);
  let r = clamp(row, 0, i32(params.height) - 1);
  return dem[u32(r) * params.width + u32(c)];
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) gid : vec3u) {
  let col = gid.x;
  let row = gid.y;
  if (col >= params.width || row >= params.height) {
    return;
  }

  let ic = i32(col);
  let ir = i32(row);

  // 3×3 neighbourhood (Horn 1981)
  let a = elev(ic - 1, ir - 1);
  let b = elev(ic,     ir - 1);
  let c = elev(ic + 1, ir - 1);
  let d = elev(ic - 1, ir);
  // e = centre, unused in gradient
  let f = elev(ic + 1, ir);
  let g = elev(ic - 1, ir + 1);
  let h = elev(ic,     ir + 1);
  let i = elev(ic + 1, ir + 1);

  let cs = params.cellSize;

  // Partial derivatives (dz/dx, dz/dy)
  let dzdx = ((c + 2.0 * f + i) - (a + 2.0 * d + g)) / (8.0 * cs);
  let dzdy = ((g + 2.0 * h + i) - (a + 2.0 * b + c)) / (8.0 * cs);

  // Slope & aspect
  let slope = atan(sqrt(dzdx * dzdx + dzdy * dzdy));
  var aspect = atan2(dzdy, -dzdx);
  if (aspect < 0.0) {
    aspect = aspect + 2.0 * 3.14159265;
  }

  // Lambertian illumination
  let zenith = 1.5707963 - params.altitude;   // π/2 − altitude
  let shade = cos(zenith) * cos(slope)
            + sin(zenith) * sin(slope) * cos(params.azimuth - aspect);

  result[row * params.width + col] = clamp(shade, 0.0, 1.0);
}
