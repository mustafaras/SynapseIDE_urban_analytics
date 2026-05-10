// WGSL — Band math operations for raster analysis
//
// Dispatched as a 1-D workgroup over raster pixels.
// Supports: NDVI, add, subtract, multiply, divide, normalised difference.
//
// Operation selector (uniform `op`):
//   0 = add          (A + B)
//   1 = subtract     (A - B)
//   2 = multiply     (A * B)
//   3 = divide       (A / B)
//   4 = ndiff        (A - B) / (A + B)   [normalised difference, e.g. NDVI]

struct Params {
  count : u32,      // total number of pixels
  op    : u32,      // operation selector (0–4)
}

@group(0) @binding(0) var<uniform>       params : Params;
@group(0) @binding(1) var<storage, read> bandA  : array<f32>;
@group(0) @binding(2) var<storage, read> bandB  : array<f32>;
@group(0) @binding(3) var<storage, read_write> result : array<f32>;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid : vec3u) {
  let idx = gid.x;
  if (idx >= params.count) {
    return;
  }

  let a = bandA[idx];
  let b = bandB[idx];

  var out : f32 = 0.0;

  switch params.op {
    case 0u {                   // add
      out = a + b;
    }
    case 1u {                   // subtract
      out = a - b;
    }
    case 2u {                   // multiply
      out = a * b;
    }
    case 3u {                   // divide
      if (abs(b) > 1e-10) {
        out = a / b;
      }
    }
    case 4u {                   // normalised difference (NDVI)
      let denom = a + b;
      if (abs(denom) > 1e-10) {
        out = (a - b) / denom;
      }
    }
    default {
      out = 0.0;
    }
  }

  result[idx] = out;
}
