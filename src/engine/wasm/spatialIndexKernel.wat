(module
  (memory (export "memory") 512 512)
  (global $heap (mut i32) (i32.const 0))

  (func (export "reset_alloc")
    (i32.const 0)
    global.set $heap)

  (func (export "alloc") (param $size i32) (result i32)
    (local $ptr i32)
    (local $aligned i32)
    local.get $size
    i32.const 7
    i32.add
    i32.const -8
    i32.and
    local.set $aligned
    global.get $heap
    local.tee $ptr
    local.get $aligned
    i32.add
    global.set $heap
    local.get $ptr)

  (func (export "bbox_scan")
    (param $start i32)
    (param $end i32)
    (param $minXPtr i32)
    (param $minYPtr i32)
    (param $maxXPtr i32)
    (param $maxYPtr i32)
    (param $qMinX f64)
    (param $qMinY f64)
    (param $qMaxX f64)
    (param $qMaxY f64)
    (param $outPtr i32)
    (result i32)
    (local $i i32)
    (local $count i32)
    (local $skip i32)

    local.get $start
    local.set $i
    i32.const 0
    local.set $count

    block $exit
      loop $loop
        local.get $i
        local.get $end
        i32.ge_u
        br_if $exit

        i32.const 0
        local.set $skip

        local.get $maxXPtr
        local.get $i
        i32.const 3
        i32.shl
        i32.add
        f64.load
        local.get $qMinX
        f64.lt
        if
          i32.const 1
          local.set $skip
        end

        local.get $skip
        i32.eqz
        if
          local.get $minXPtr
          local.get $i
          i32.const 3
          i32.shl
          i32.add
          f64.load
          local.get $qMaxX
          f64.gt
          if
            i32.const 1
            local.set $skip
          end
        end

        local.get $skip
        i32.eqz
        if
          local.get $maxYPtr
          local.get $i
          i32.const 3
          i32.shl
          i32.add
          f64.load
          local.get $qMinY
          f64.lt
          if
            i32.const 1
            local.set $skip
          end
        end

        local.get $skip
        i32.eqz
        if
          local.get $minYPtr
          local.get $i
          i32.const 3
          i32.shl
          i32.add
          f64.load
          local.get $qMaxY
          f64.gt
          if
            i32.const 1
            local.set $skip
          end
        end

        local.get $skip
        i32.eqz
        if
          local.get $outPtr
          local.get $count
          i32.const 2
          i32.shl
          i32.add
          local.get $i
          i32.store

          local.get $count
          i32.const 1
          i32.add
          local.set $count
        end

        local.get $i
        i32.const 1
        i32.add
        local.set $i
        br $loop
      end
    end

    local.get $count)

  (func (export "distance_scan")
    (param $start i32)
    (param $end i32)
    (param $centroidXPtr i32)
    (param $centroidYPtr i32)
    (param $queryX f64)
    (param $queryY f64)
    (param $outPtr i32)
    (result i32)
    (local $i i32)
    (local $outIndex i32)
    (local $dx f64)
    (local $dy f64)

    local.get $start
    local.set $i
    i32.const 0
    local.set $outIndex

    block $exit
      loop $loop
        local.get $i
        local.get $end
        i32.ge_u
        br_if $exit

        local.get $centroidXPtr
        local.get $i
        i32.const 3
        i32.shl
        i32.add
        f64.load
        local.get $queryX
        f64.sub
        local.set $dx

        local.get $centroidYPtr
        local.get $i
        i32.const 3
        i32.shl
        i32.add
        f64.load
        local.get $queryY
        f64.sub
        local.set $dy

        local.get $outPtr
        local.get $outIndex
        i32.const 3
        i32.shl
        i32.add
        local.get $dx
        local.get $dx
        f64.mul
        local.get $dy
        local.get $dy
        f64.mul
        f64.add
        f64.store

        local.get $i
        i32.const 1
        i32.add
        local.set $i
        local.get $outIndex
        i32.const 1
        i32.add
        local.set $outIndex
        br $loop
      end
    end

    local.get $outIndex))