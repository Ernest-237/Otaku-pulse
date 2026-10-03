import * as THREE from 'three'

// All architecture, paper, wood and lettering are generated locally. The distant
// buildings share instanced geometry; interactive rooms use the same materials.
const ROOM_DATA = {
  threshold: { position: [0, 0, 3], name: 'Le seuil', mark: '門', next: ['lanterns', 'stairs'], item: 'seal' },
  lanterns: { position: [35, 13, -38], name: 'Les lanternes', mark: '灯', next: ['threshold', 'biwa'], item: 'lantern' },
  stairs: { position: [-36, -9, -42], name: 'Les escaliers', mark: '階', next: ['threshold', 'biwa'], item: 'seal' },
  biwa: { position: [30, -25, -82], name: 'La salle du biwa', mark: '弦', next: ['stairs', 'heart'], item: 'biwa' },
  heart: { position: [-8, 29, -94], name: 'Le cœur du château', mark: '心', next: ['biwa', 'threshold'], item: 'heart' },
}

function randomGenerator(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
}

function canvasTexture(draw, width = 256, height = 256) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Le navigateur ne peut pas préparer les textures du château.')
  draw(context, width, height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function makeRoofGeometry() {
  const geometry = new THREE.BufferGeometry()
  const points = [[-.6, .04], [-.47, -.035], [0, .3], [.47, -.035], [.6, .04]]
  const positions = []
  const uvs = []
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[i + 1]
    positions.push(x1, y1, -.62, x2, y2, -.62, x2, y2, .62, x1, y1, -.62, x2, y2, .62, x1, y1, .62)
    uvs.push(i / 4, 0, (i + 1) / 4, 0, (i + 1) / 4, 1, i / 4, 0, (i + 1) / 4, 1, i / 4, 1)
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.computeVertexNormals()
  return geometry
}

function makeGableGeometry() {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -.47, -.035, -.61, 0, .3, -.61, .47, -.035, -.61,
    .47, -.035, .61, 0, .3, .61, -.47, -.035, .61,
  ], 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, .5, 1, 1, 0, 1, 0, .5, 1, 0, 0], 2))
  geometry.computeVertexNormals()
  return geometry
}

export function createCastleEngine(host, initial = {}) {
  let disposed = false
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
  } catch {
    throw new Error('La visite 3D nécessite WebGL. Le carnet de visite reste disponible.')
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.5 : 1.75))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.35
  renderer.setClearColor('#160c10')
  const canvas = renderer.domElement
  canvas.tabIndex = 0
  canvas.dataset.testid = 'verse-canvas'
  canvas.setAttribute('role', 'img')
  canvas.setAttribute('aria-label', 'Château de l’Infini en trois dimensions. Glissez pour regarder, utilisez les flèches pour marcher et E pour interagir. Les mêmes actions sont disponibles dans le carnet de visite.')
  host.appendChild(canvas)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#160c10')
  scene.fog = new THREE.FogExp2('#241014', .0075)
  const camera = new THREE.PerspectiveCamera(60, 1, .12, 440)
  camera.rotation.order = 'YXZ'
  scene.add(new THREE.HemisphereLight('#ffe0a5', '#322022', 2.2))
  const keyLight = new THREE.DirectionalLight('#ffd59d', 3.3)
  keyLight.position.set(25, 55, 50)
  scene.add(keyLight)
  const fillLight = new THREE.DirectionalLight('#b4655c', 1.1)
  fillLight.position.set(-50, -25, -20)
  scene.add(fillLight)

  const random = randomGenerator(728191)
  const textures = []
  const paperTexture = canvasTexture((ctx, width, height) => {
    ctx.fillStyle = '#f0cb8c'
    ctx.fillRect(0, 0, width, height)
    for (let i = 0; i < 5500; i++) {
      ctx.fillStyle = `rgba(94, 47, 17, ${random() * .075})`
      ctx.fillRect(random() * width, random() * height, random() * 2 + .5, random() * 6 + .5)
    }
    const gradient = ctx.createRadialGradient(128, 100, 5, 128, 120, 170)
    gradient.addColorStop(0, 'rgba(255,248,207,.4)')
    gradient.addColorStop(1, 'rgba(111,49,18,.13)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  })
  const woodTexture = canvasTexture((ctx, width, height) => {
    ctx.fillStyle = '#a76a48'
    ctx.fillRect(0, 0, width, height)
    for (let i = 0; i < 240; i++) {
      ctx.strokeStyle = `rgba(${random() > .45 ? '41,16,12' : '239,173,96'},${random() * .22})`
      ctx.lineWidth = .4 + random() * 1.2
      const y = random() * height
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.bezierCurveTo(80, y + random() * 8, 180, y - random() * 8, width, y + random() * 4)
      ctx.stroke()
    }
    for (let y = 0; y < height; y += 32) {
      ctx.fillStyle = 'rgba(25,7,4,.7)'
      ctx.fillRect(0, y, width, 2)
      ctx.fillStyle = 'rgba(255,200,121,.15)'
      ctx.fillRect(0, y + 2, width, 1)
    }
  })
  woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping
  const roofTexture = canvasTexture((ctx, width, height) => {
    ctx.fillStyle = '#374343'
    ctx.fillRect(0, 0, width, height)
    for (let x = 0; x < width; x += 16) {
      const gradient = ctx.createLinearGradient(x, 0, x + 16, 0)
      gradient.addColorStop(0, '#1b2829')
      gradient.addColorStop(.4, '#6c7060')
      gradient.addColorStop(.8, '#404843')
      gradient.addColorStop(1, '#172326')
      ctx.fillStyle = gradient
      ctx.fillRect(x, 0, 16, height)
    }
    for (let y = 0; y < height; y += 40) {
      ctx.fillStyle = 'rgba(8,13,12,.3)'
      ctx.fillRect(0, y, width, 2)
    }
  })
  textures.push(paperTexture, woodTexture, roofTexture)
  const materials = {
    wood: new THREE.MeshStandardMaterial({ color: '#86634c', map: woodTexture, roughness: .82 }),
    red: new THREE.MeshStandardMaterial({ color: '#79372e', roughness: .78 }),
    dark: new THREE.MeshStandardMaterial({ color: '#201719', roughness: .9 }),
    trim: new THREE.MeshStandardMaterial({ color: '#c18b49', roughness: .64, metalness: .2 }),
    paper: new THREE.MeshStandardMaterial({ color: '#ffdf9d', map: paperTexture, emissiveMap: paperTexture, emissive: '#ffc66b', emissiveIntensity: .7, roughness: .92, side: THREE.DoubleSide }),
    roof: new THREE.MeshStandardMaterial({ color: '#a7a898', map: roofTexture, roughness: .9, side: THREE.DoubleSide }),
    lantern: new THREE.MeshStandardMaterial({ color: '#ffc286', emissive: '#ff7130', emissiveIntensity: 1.4, roughness: .6 }),
    scarlet: new THREE.MeshStandardMaterial({ color: '#b52d2d', emissive: '#b32116', emissiveIntensity: .35, roughness: .7 }),
    glow: new THREE.MeshBasicMaterial({ color: '#ffd59a', transparent: true, opacity: .8 }),
  }
  const geometries = {
    box: new THREE.BoxGeometry(1, 1, 1),
    roof: makeRoofGeometry(),
    gable: makeGableGeometry(),
    orb: new THREE.SphereGeometry(.5, 12, 8),
    cylinder: new THREE.CylinderGeometry(.5, .5, 1, 10),
    diamond: new THREE.OctahedronGeometry(1),
  }
  const farArchitecture = new THREE.Group()
  scene.add(farArchitecture)
  const batches = new Map()
  const transform = new THREE.Object3D()
  const localMatrix = new THREE.Matrix4()
  const tempPosition = new THREE.Vector3()
  const tempScale = new THREE.Vector3()
  const tempRotation = new THREE.Quaternion()
  const euler = new THREE.Euler()

  function instance(geometry, material, position, scale, rotation = [0, 0, 0], parentMatrix) {
    const key = `${geometry}:${material}`
    if (!batches.has(key)) batches.set(key, [])
    tempPosition.set(...position)
    tempScale.set(...scale)
    tempRotation.setFromEuler(euler.set(...rotation))
    localMatrix.compose(tempPosition, tempRotation, tempScale)
    if (parentMatrix) localMatrix.premultiply(parentMatrix)
    batches.get(key).push(localMatrix.clone())
  }

  function building(x, y, z, width = 9, depth = 8, height = 4, rotation = [0, 0, 0], floors = 1) {
    // Keep a genuine open volume around each walkable chamber, including a
    // margin for the bounded biwa transformation. Decorative buildings must
    // never turn into an opaque wall through a visitor's arrival point.
    const buffer = 17 + Math.max(width, depth) * .7 + Math.hypot(x, z) * .13
    const buildingHeight = floors * (height + .65) + width * .2
    if (Object.values(ROOM_DATA).some(room => (
      Math.abs(x - room.position[0]) < buffer
      && Math.abs(z - room.position[2]) < buffer
      && y + buildingHeight > room.position[1] - 2
      && y - (Math.abs(rotation[2]) > 1 ? buildingHeight : 1) < room.position[1] + 11
    ))) return
    transform.position.set(x, y, z)
    transform.rotation.set(...rotation)
    transform.scale.set(1, 1, 1)
    transform.updateMatrix()
    const matrix = transform.matrix.clone()
    const box = (mat, p, s, r) => instance('box', mat, p, s, r, matrix)
    for (let floor = 0; floor < floors; floor++) {
      const level = floor * (height + .65)
      box('wood', [0, level - .2, 0], [width + 1.4, .4, depth + 1.2])
      box('dark', [0, level - .48, 0], [width + 1, .2, depth + 1])
      for (const side of [-1, 1]) {
        // Luminous screens extend around all four faces; their black lattices
        // retain the unmistakable shōji silhouette even in the distant abyss.
        box('paper', [0, level + height * .49, side * depth * .5], [width - .35, height * .83, .075])
        box('paper', [side * width * .5, level + height * .49, 0], [.075, height * .83, depth - .35])
        for (let j = 0; j <= 8; j++) {
          const p = -width / 2 + width * j / 8
          box('red', [p, level + height / 2, side * (depth / 2 + .08)], [j % 2 ? .045 : .13, height, .14])
        }
        for (let j = 0; j <= 6; j++) {
          box('red', [side * (width / 2 + .08), level + height / 2, -depth / 2 + depth * j / 6], [.14, height, j % 2 ? .045 : .13])
        }
        for (const barY of [.25, height * .42, height * .69, height]) {
          box('dark', [0, level + barY, side * (depth / 2 + .1)], [width, .065, .17])
          box('dark', [side * (width / 2 + .1), level + barY, 0], [.17, .065, depth])
        }
        box('red', [0, level + height + .08, side * depth * .5], [width + .8, .32, .35])
        box('trim', [0, level + height + .29, side * (depth / 2 + .07)], [width + .95, .07, .15])
        for (const corner of [-1, 1]) {
          box('red', [corner * width / 2, level + height / 2, side * depth / 2], [.34, height + .3, .34])
          box('dark', [corner * width / 2, level + .08, side * depth / 2], [.48, .35, .48])
        }
      }
      instance('roof', 'roof', [0, level + height + .4, 0], [width + 1.3, width * .58, depth + 1.5], [0, 0, 0], matrix)
      instance('gable', 'wood', [0, level + height + .4, 0], [width + 1.3, width * .58, depth + 1.5], [0, 0, 0], matrix)
      box('dark', [0, level + height + .4 + width * .174, 0], [.26, .24, depth + 2])
      box('trim', [0, level + height + .54 + width * .174, 0], [.12, .055, depth + 2])
      for (const side of [-1, 1]) {
        box('dark', [side * (width + 1.3) * .6, level + height + .42, 0], [.17, .2, (depth + 1.5) * 1.24])
      }
    }
    // A few visible supports let the chambers feel suspended, not simply pasted
    // into a skybox. Their ends disappear into the fog far below the galleries.
    for (const side of [-1, 1]) box('red', [side * width * .35, -3.5, 0], [.3, 6.8, .3])
  }

  function bridge(x, y, z, length, angle = 0, width = 2.6, stairs = false) {
    const extentX = Math.abs(Math.sin(angle)) * length / 2 + width / 2
    const extentZ = Math.abs(Math.cos(angle)) * length / 2 + width / 2
    const drift = Math.hypot(x, z) * .13
    const rise = stairs ? Math.ceil(length / .7) * .25 : 0
    if (Object.values(ROOM_DATA).some(room => (
      Math.abs(x - room.position[0]) < 13 + extentX + drift
      && Math.abs(z - room.position[2]) < 13 + extentZ + drift
      && y + rise + 1.3 > room.position[1] - .5
      && y - .5 < room.position[1] + 7
    ))) return
    transform.position.set(x, y, z)
    transform.rotation.set(0, angle, 0)
    transform.scale.set(1, 1, 1)
    transform.updateMatrix()
    const matrix = transform.matrix.clone()
    const count = Math.ceil(length / .7)
    for (let i = 0; i < count; i++) {
      const pz = -length / 2 + i * length / count
      const py = stairs ? i * .25 : 0
      instance('box', 'wood', [0, py, pz], [width, .18, length / count - .04], [0, 0, 0], matrix)
      if (i % 4 === 0) {
        for (const side of [-1, 1]) instance('box', 'red', [side * width / 2, py + .55, pz], [.14, 1.25, .14], [0, 0, 0], matrix)
      }
    }
    for (const side of [-1, 1]) {
      instance('box', 'red', [side * width / 2, .95 + rise / 2, 0], [.17, .15, Math.hypot(length, rise)], [-Math.atan2(rise, length), 0, 0], matrix)
      instance('box', 'dark', [side * width / 2, -.3 + rise / 2, 0], [.23, .35, Math.hypot(length, rise)], [-Math.atan2(rise, length), 0, 0], matrix)
    }
  }

  // The composition is deliberately layered: a hanging district below the
  // camera, upright towers at either side and gravity-defying rooms overhead.
  for (let layer = 0; layer < 8; layer++) {
    const z = 15 - layer * 23
    for (let row = 0; row < 7; row++) {
      const y = -67 + row * 20 + random() * 5
      for (const side of [-1, 1]) {
        const x = side * (32 + random() * 42)
        const width = 7 + random() * 6
        const depth = 6 + random() * 6
        let rotation = [0, (random() - .5) * .25, 0]
        if (row >= 5 && layer % 2 === 0) rotation = [0, 0, Math.PI]
        if (row === 3 && layer % 3 === 1) rotation = [0, 0, side * Math.PI / 2]
        building(x, y, z, width, depth, 3.8 + random(), rotation, random() > .65 ? 2 : 1)
        if (row < 5 && layer % 2 === 0) bridge(x - side * 8, y, z - 9, 15, side * .45, 2.4, random() > .55)
      }
    }
    for (let row = 0; row < 3; row++) {
      building((random() - .5) * 42, -52 - row * 17, z - 5, 10 + random() * 5, 10, 4.5, [0, random() * .7, 0], 2)
    }
  }
  // Foreground silhouettes frame the overview. Their warm screens are visible
  // immediately, including on low-brightness mobile displays.
  building(25, 8, 19, 14, 12, 5, [0, -.14, 0], 3)
  building(-32, 13, 13, 12, 11, 4.5, [0, .18, 0], 3)
  building(15, -25, -20, 15, 13, 5, [0, -.12, 0], 3)
  bridge(-8, -4, -23, 56, Math.PI / 2, 4)
  bridge(9, 21, -68, 63, Math.PI / 2, 3.3, true)
  bridge(42, -8, -4, 42, -.7, 3, true)
  bridge(-25, 27, -98, 60, .6, 3, true)
  for (let row = 0; row < 6; row++) {
    for (let column = 0; column < 5; column++) {
      building(-34 + column * 17, -38 + row * 18, -179 - random() * 9, 11 + random() * 3, 9, 4.3, [0, (random() - .5) * .15, row > 3 ? Math.PI : 0], 2)
    }
  }
  for (const [key, matrices] of batches) {
    const [geometry, material] = key.split(':')
    const mesh = new THREE.InstancedMesh(geometries[geometry], materials[material], matrices.length)
    matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
    farArchitecture.add(mesh)
  }
  batches.clear()

  const targets = []
  const animatedObjects = []
  const roomGroups = {}
  const disposableMaterials = []
  const interactiveMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  disposableMaterials.push(interactiveMaterial)

  function mesh(parent, geometry, material, position, scale, rotation) {
    const object = new THREE.Mesh(geometries[geometry], typeof material === 'string' ? materials[material] : material)
    if (position) object.position.set(...position)
    if (scale) object.scale.set(...scale)
    if (rotation) object.rotation.set(...rotation)
    parent.add(object)
    return object
  }

  function makeSign(parent, text, x, y, z, width = 4, height = .75) {
    const texture = canvasTexture((ctx, w, h) => {
      ctx.fillStyle = 'rgba(25,15,17,.94)'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#b88a50'
      ctx.lineWidth = 3
      ctx.strokeRect(8, 8, w - 16, h - 16)
      ctx.fillStyle = '#f8d6a0'
      ctx.font = '500 33px Georgia, serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, w / 2, h / 2, w - 36)
    }, 512, 96)
    textures.push(texture)
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: true })
    disposableMaterials.push(material)
    const sign = new THREE.Sprite(material)
    sign.position.set(x, y, z)
    sign.scale.set(width, height, 1)
    parent.add(sign)
  }

  function lantern(parent, x, y, z, size = 1, red = false) {
    mesh(parent, 'cylinder', 'dark', [x, y + .65 * size, z], [.1 * size, .6 * size, .1 * size])
    const body = mesh(parent, 'orb', red ? 'scarlet' : 'lantern', [x, y, z], [size, size * 1.18, size])
    mesh(parent, 'cylinder', 'dark', [x, y + .55 * size, z], [.4 * size, .13 * size, .4 * size])
    mesh(parent, 'cylinder', 'dark', [x, y - .55 * size, z], [.4 * size, .13 * size, .4 * size])
    mesh(parent, 'cylinder', 'scarlet', [x, y - .89 * size, z], [.055 * size, .6 * size, .055 * size])
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2
      mesh(parent, 'box', 'red', [x + Math.sin(a) * .45 * size, y, z + Math.cos(a) * .45 * size], [.027 * size, .89 * size, .027 * size])
    }
    return body
  }

  function target(parent, roomId, destination, type, position, scale) {
    const collider = mesh(parent, 'box', interactiveMaterial, position, scale)
    collider.userData = { roomId, destination, type }
    targets.push(collider)
    return collider
  }

  function portal(parent, roomId, destination, x, z) {
    const arch = new THREE.Group()
    arch.position.set(x, 0, z)
    parent.add(arch)
    mesh(arch, 'box', 'dark', [0, .05, 0], [4.3, .15, 2.3])
    for (const side of [-1, 1]) {
      mesh(arch, 'box', 'red', [side * 1.55, 2.5, 0], [.35, 5.2, .4])
      mesh(arch, 'box', 'trim', [side * 1.55, 2.5, .24], [.045, 4.9, .05])
      mesh(arch, 'box', 'dark', [side * 1.55, .15, 0], [.6, .35, .7])
    }
    mesh(arch, 'box', 'red', [0, 4.8, 0], [4.1, .36, .6])
    mesh(arch, 'roof', 'roof', [0, 5.07, 0], [4.1, 2.8, 1.4])
    mesh(arch, 'box', 'trim', [0, 4.55, .22], [3.1, .06, .07])
    const veil = new THREE.MeshBasicMaterial({ color: destination === 'heart' ? '#c05b56' : '#efb773', transparent: true, opacity: .09, side: THREE.DoubleSide, depthWrite: false })
    disposableMaterials.push(veil)
    mesh(arch, 'box', veil, [0, 2.3, 0], [2.7, 4.3, .025])
    makeSign(arch, ROOM_DATA[destination].name, 0, 3.65, .45, 3.3, .62)
    makeSign(arch, 'Entrer · E', 0, 1.3, .45, 1.6, .35)
    lantern(arch, -2, 3.3, .1, .6)
    lantern(arch, 2, 3.3, .1, .6)
    target(arch, roomId, destination, 'portal', [0, 2.2, 0], [3, 4.4, 1.2])
  }

  function interactiveObject(parent, roomId, type) {
    const group = new THREE.Group()
    group.position.set(0, 1.25, -2.7)
    parent.add(group)
    mesh(parent, 'box', 'dark', [0, .25, -2.7], [2.3, .5, 2.3])
    mesh(parent, 'box', 'trim', [0, .52, -2.7], [2.1, .05, 2.1])
    if (type === 'biwa') {
      group.rotation.z = -.26
      mesh(group, 'orb', 'wood', [0, .35, 0], [1.3, 1.9, .52])
      mesh(group, 'orb', 'trim', [0, .4, .21], [1.02, 1.49, .1])
      mesh(group, 'box', 'wood', [0, 1.6, 0], [.23, 1.8, .21])
      mesh(group, 'box', 'dark', [0, 2.45, .025], [.6, .25, .3])
      mesh(group, 'box', 'dark', [0, -.18, .3], [.65, .12, .1])
      for (let i = 0; i < 4; i++) mesh(group, 'box', 'glow', [-.075 + i * .05, 1.03, .33], [.011, 2.6, .011])
      makeSign(parent, 'Faire résonner le biwa · E', 0, 3.9, -2.7, 4, .65)
    } else if (type === 'lantern') {
      lantern(group, 0, .65, 0, 1.7)
      makeSign(parent, 'Éveiller les lanternes · E', 0, 3.95, -2.7, 4, .65)
    } else if (type === 'heart') {
      const heart = mesh(group, 'diamond', 'scarlet', [0, 1, 0], [.7, 1.35, .7])
      animatedObjects.push({ object: heart, kind: 'heart', y: 1 })
      for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4
        mesh(group, 'box', 'trim', [Math.cos(angle) * 1.1, .8, Math.sin(angle) * 1.1], [.035, 2.5, .035])
      }
      makeSign(parent, 'Contempler le cœur · E', 0, 4.15, -2.7, 4, .65)
    } else {
      const texture = canvasTexture((ctx, w, h) => {
        ctx.fillStyle = '#edcf95'
        ctx.fillRect(0, 0, w, h)
        ctx.strokeStyle = '#8c2924'
        ctx.lineWidth = 9
        ctx.strokeRect(15, 15, w - 30, h - 30)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#6a2927'
        ctx.font = '100px serif'
        ctx.fillText(roomId === 'stairs' ? '階' : '封', w / 2, h / 2)
      }, 192, 256)
      textures.push(texture)
      const mat = new THREE.MeshStandardMaterial({ map: texture, roughness: .8, emissive: '#bc7e40', emissiveIntensity: .15 })
      disposableMaterials.push(mat)
      const seal = mesh(group, 'box', mat, [0, 1, 0], [.92, 1.3, .12], [0, -.1, -.05])
      animatedObjects.push({ object: seal, kind: 'seal', y: 1 })
      makeSign(parent, roomId === 'threshold' ? 'Franchir le seuil · E' : 'Sceller le passage · E', 0, 3.95, -2.7, 3.8, .65)
    }
    target(parent, roomId, undefined, type, [0, 2, -2.7], [2.4, 3.4, 2.4])
  }

  for (const [id, room] of Object.entries(ROOM_DATA)) {
    const group = new THREE.Group()
    group.position.set(...room.position)
    scene.add(group)
    roomGroups[id] = group
    mesh(group, 'box', 'wood', [0, -.22, 0], [24, .42, 24])
    mesh(group, 'box', 'red', [0, -.65, 0], [24.7, .38, 24.7])
    mesh(group, 'box', 'trim', [0, -.4, 0], [24.6, .065, 24.6])
    // Floor seams and a central carpet guide the visitor to the actual object.
    const floorMaterial = new THREE.MeshStandardMaterial({ color: id === 'heart' ? '#632d2c' : '#5e5240', roughness: 1 })
    disposableMaterials.push(floorMaterial)
    mesh(group, 'box', floorMaterial, [0, .005, 1.5], [3.4, .022, 17])
    for (const side of [-1, 1]) {
      mesh(group, 'box', 'trim', [side * 1.75, .025, 1.5], [.055, .035, 17])
      for (let j = 0; j < 7; j++) {
        const z = -10.5 + j * 3.5
        mesh(group, 'box', 'red', [side * 11.5, .65, z], [.24, 1.5, .24])
      }
      mesh(group, 'box', 'red', [side * 11.5, 1.2, 0], [.2, .16, 23])
      mesh(group, 'box', 'dark', [side * 11.5, .65, 0], [.14, .12, 23])
      for (const z of [-10.5, 10.5]) {
        mesh(group, 'box', 'red', [side * 11.3, 3.7, z], [.48, 7.5, .48])
        mesh(group, 'box', 'dark', [side * 11.3, .1, z], [.74, .4, .74])
        mesh(group, 'box', 'trim', [side * 11.3, 6.2, z], [.62, .2, .62])
      }
      mesh(group, 'box', 'red', [side * 11.3, 7.1, 0], [.48, .48, 23])
      for (const z of [-7, 0, 7]) lantern(group, side * 9.9, 4.5, z, 1, id === 'heart')
    }
    mesh(group, 'box', 'red', [0, 1.15, 11.5], [23, .16, .2])
    mesh(group, 'box', 'red', [0, 7.1, -10.5], [23, .5, .5])
    mesh(group, 'box', 'red', [0, 7.1, 10.5], [23, .5, .5])
    mesh(group, 'box', 'dark', [0, 7.45, -10.5], [25, .22, .8])
    // Open-sided galleries keep the infinite architecture visible while the
    // high central roof gives each arrival a recognisable Japanese chamber.
    mesh(group, 'roof', 'roof', [0, 7.7, -1], [24, 11, 20])
    mesh(group, 'gable', 'wood', [0, 7.7, -1], [24, 11, 20])
    mesh(group, 'box', 'red', [0, 7.2, -1], [.4, .3, 22])
    for (const x of [-6, 0, 6]) mesh(group, 'box', 'red', [x, 7.12, -1], [.22, .3, 22])
    portal(group, id, room.next[0], -7.1, -7.1)
    portal(group, id, room.next[1], 7.1, -7.1)
    interactiveObject(group, id, room.item)
    if (id === 'lanterns') {
      for (let i = 0; i < 13; i++) {
        const angle = i / 13 * Math.PI * 2
        lantern(group, Math.cos(angle) * 8, 5.5 + Math.sin(i * 2) * .8, Math.sin(angle) * 7, .6 + random() * .35, i % 3 === 0)
      }
    }
    // Under-floor supports can be seen from other districts.
    for (const x of [-10, 10]) for (const z of [-10, 10]) mesh(group, 'box', 'red', [x, -8, z], [.45, 15, .45])
  }

  // The five chambers also share GPU batches. Only colliders, lettering and
  // the three gently animated objects remain individual scene objects.
  const movingObjects = new Set(animatedObjects.map(({ object }) => object))
  const hitObjects = new Set(targets)
  for (const group of Object.values(roomGroups)) {
    group.updateMatrixWorld(true)
    const inverse = group.matrixWorld.clone().invert()
    const roomBatches = new Map()
    group.traverse(object => {
      if (!object.isMesh || hitObjects.has(object) || movingObjects.has(object)) return
      const key = `${object.geometry.uuid}:${object.material.uuid}`
      if (!roomBatches.has(key)) roomBatches.set(key, { geometry: object.geometry, material: object.material, objects: [], matrices: [] })
      const batch = roomBatches.get(key)
      batch.objects.push(object)
      batch.matrices.push(object.matrixWorld.clone().premultiply(inverse))
    })
    for (const batch of roomBatches.values()) {
      const instances = new THREE.InstancedMesh(batch.geometry, batch.material, batch.matrices.length)
      batch.matrices.forEach((matrix, index) => instances.setMatrixAt(index, matrix))
      instances.instanceMatrix.needsUpdate = true
      instances.computeBoundingSphere()
      group.add(instances)
      batch.objects.forEach(object => object.removeFromParent())
    }
  }

  const dustGeometry = new THREE.BufferGeometry()
  const dustPositions = new Float32Array(480 * 3)
  for (let i = 0; i < dustPositions.length; i += 3) {
    dustPositions[i] = (random() - .5) * 180
    dustPositions[i + 1] = (random() - .5) * 160
    dustPositions[i + 2] = 40 - random() * 235
  }
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3))
  const dustTexture = canvasTexture((ctx, w, h) => {
    const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
    glow.addColorStop(0, 'rgba(255,224,158,.9)')
    glow.addColorStop(.15, 'rgba(255,175,73,.55)')
    glow.addColorStop(1, 'rgba(255,145,50,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, w, h)
  }, 32, 32)
  textures.push(dustTexture)
  const dustMaterial = new THREE.PointsMaterial({ color: '#ffbb67', map: dustTexture, size: .28, transparent: true, opacity: .68, depthWrite: false, blending: THREE.AdditiveBlending })
  const dust = new THREE.Points(dustGeometry, dustMaterial)
  scene.add(dust)

  let state = { roomId: 'threshold', active: false, paused: false, comfort: false, shift: 0, lanternsOn: true, ...initial }
  let yaw = 0
  let pitch = -.02
  let frame = 0
  let lastTime = 0
  let elapsed = 0
  let architectureAngle = 0
  let desiredArchitectureAngle = Math.sin(Number(state.shift || 0) * 1.8) * .12
  let dragging = null
  const motion = { forward: false, backward: false, left: false, right: false }
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const center = new THREE.Vector2(0, 0)
  const targetPosition = new THREE.Vector3()
  const keyDirections = { w: 'forward', z: 'forward', ArrowUp: 'forward', s: 'backward', ArrowDown: 'backward', a: 'left', q: 'left', ArrowLeft: 'left', d: 'right', ArrowRight: 'right' }
  const validRoom = () => ROOM_DATA[state.roomId] || ROOM_DATA.threshold

  function clearMotion() {
    Object.keys(motion).forEach(key => { motion[key] = false })
    dragging = null
  }

  function resetView() {
    const room = validRoom()
    camera.position.set(room.position[0], room.position[1] + 2.35, room.position[2] + 7.8)
    yaw = 0
    pitch = -.045
    camera.rotation.set(pitch, yaw, 0, 'YXZ')
    clearMotion()
    requestFrame()
  }

  function look(dx, dy) {
    if (!state.active || state.paused || disposed) return
    yaw -= dx * .003
    pitch = THREE.MathUtils.clamp(pitch - dy * .003, -1.18, 1.18)
    camera.rotation.set(pitch, yaw, 0, 'YXZ')
    requestFrame()
  }

  function interact(clientX, clientY) {
    if (!state.active || state.paused || disposed) return
    if (clientX !== undefined) {
      const rect = canvas.getBoundingClientRect()
      pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1)
    } else pointer.copy(center)
    camera.updateMatrixWorld()
    scene.updateMatrixWorld()
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects(targets.filter(object => object.userData.roomId === state.roomId), false)
    const hit = hits.find(item => item.distance < 9)
    let object = hit?.object
    // E also reaches a nearby object when a touch user is not aiming perfectly.
    if (!object && clientX === undefined) {
      let nearest = 5.7
      for (const candidate of targets) {
        if (candidate.userData.roomId !== state.roomId) continue
        candidate.getWorldPosition(targetPosition)
        const distance = camera.position.distanceTo(targetPosition)
        if (distance < nearest) { object = candidate; nearest = distance }
      }
    }
    if (!object) return
    if (object.userData.type === 'portal') initial.onPortal?.(object.userData.destination)
    else initial.onInteract?.(object.userData.type)
  }

  function pointerDown(event) {
    if (!state.active || state.paused || event.button !== 0) return
    canvas.focus({ preventScroll: true })
    dragging = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, distance: 0 }
    canvas.setPointerCapture?.(event.pointerId)
  }
  function pointerMove(event) {
    if (!dragging || dragging.id !== event.pointerId) return
    const dx = event.clientX - dragging.x
    const dy = event.clientY - dragging.y
    dragging.distance += Math.hypot(dx, dy)
    look(dx, dy)
    dragging.x = event.clientX
    dragging.y = event.clientY
  }
  function pointerUp(event) {
    if (!dragging || dragging.id !== event.pointerId) return
    const click = dragging.distance < 8
    dragging = null
    if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    if (click) interact(event.clientX, event.clientY)
  }
  function keyDown(event) {
    if (!state.active || state.paused || event.ctrlKey || event.metaKey || event.altKey) return
    const focused = document.activeElement
    if (focused !== canvas && focused !== document.body && focused !== host) return
    const direction = keyDirections[event.key] || keyDirections[event.key.toLowerCase()]
    if (direction) {
      event.preventDefault()
      motion[direction] = true
      requestFrame()
    } else if (event.key.toLowerCase() === 'e' && !event.repeat) {
      event.preventDefault()
      interact()
    }
  }
  function keyUp(event) {
    const direction = keyDirections[event.key] || keyDirections[event.key.toLowerCase()]
    if (direction) motion[direction] = false
  }
  function resize() {
    if (disposed) return
    const { width, height } = host.getBoundingClientRect()
    if (!width || !height) return
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.fov = state.active ? (width < 600 ? 72 : 65) : (width < 600 ? 76 : 57)
    camera.updateProjectionMatrix()
    requestFrame()
  }
  function visibilityChange() {
    clearMotion()
    if (document.hidden) {
      cancelAnimationFrame(frame)
      frame = 0
    } else {
      lastTime = 0
      requestFrame()
    }
  }
  function contextLost(event) {
    event.preventDefault()
    cancelAnimationFrame(frame)
    frame = 0
    clearMotion()
    initial.onUnavailable?.(new Error('La scène 3D a été suspendue par le navigateur. Vous pouvez poursuivre dans le carnet ou relancer la visite.'))
  }

  function render(now) {
    frame = 0
    if (disposed || document.hidden) return
    const dt = lastTime ? Math.min((now - lastTime) / 1000, .04) : 0
    lastTime = now
    if (!state.paused) elapsed += dt
    if (state.active) {
      if (!state.paused) {
        let dx = Number(motion.right) - Number(motion.left)
        let dz = Number(motion.backward) - Number(motion.forward)
        const magnitude = Math.hypot(dx, dz)
        if (magnitude) {
          dx /= magnitude
          dz /= magnitude
          const speed = (state.comfort ? 3 : 4.7) * dt
          camera.position.x += (dx * Math.cos(yaw) + dz * Math.sin(yaw)) * speed
          camera.position.z += (-dx * Math.sin(yaw) + dz * Math.cos(yaw)) * speed
          const room = validRoom()
          camera.position.x = THREE.MathUtils.clamp(camera.position.x, room.position[0] - 10.65, room.position[0] + 10.65)
          camera.position.z = THREE.MathUtils.clamp(camera.position.z, room.position[2] - 9.8, room.position[2] + 10.65)
        }
      }
      camera.rotation.set(pitch, yaw, 0, 'YXZ')
    } else {
      const sway = state.comfort ? 0 : Math.sin(elapsed * .065)
      camera.position.set(29 + sway * 3.2, 26 + (state.comfort ? 0 : Math.cos(elapsed * .07) * .6), 59)
      camera.lookAt(-4, -9, -65)
    }
    if (!state.paused) {
      architectureAngle = state.comfort ? desiredArchitectureAngle : THREE.MathUtils.damp(architectureAngle, desiredArchitectureAngle, 1.6, dt)
      farArchitecture.rotation.y = architectureAngle
      if (!state.comfort) {
        dust.rotation.y = Math.sin(elapsed * .013) * .035
        dust.position.y = Math.sin(elapsed * .12) * 1.7
        for (const { object, kind, y } of animatedObjects) {
          object.position.y = y + Math.sin(elapsed * (kind === 'heart' ? .8 : .65)) * .07
          if (kind === 'heart') object.rotation.y = elapsed * .12
        }
      }
    }
    renderer.render(scene, camera)
    // Readable camera state supports automated movement checks without exposing
    // an engine instance or requiring screenshots to infer successful input.
    canvas.dataset.position = camera.position.toArray().map(value => value.toFixed(3)).join(',')
    canvas.dataset.orientation = `${yaw.toFixed(3)},${pitch.toFixed(3)}`
    canvas.dataset.room = state.roomId
    canvas.dataset.paused = String(state.paused)
    canvas.dataset.drawCalls = String(renderer.info.render.calls)
    if (!state.paused && (!state.comfort || Object.values(motion).some(Boolean))) requestFrame()
  }
  function requestFrame() {
    if (!disposed && !frame && !document.hidden) frame = requestAnimationFrame(render)
  }

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(host)
  canvas.addEventListener('pointerdown', pointerDown)
  canvas.addEventListener('pointermove', pointerMove)
  canvas.addEventListener('pointerup', pointerUp)
  canvas.addEventListener('pointercancel', clearMotion)
  canvas.addEventListener('webglcontextlost', contextLost)
  canvas.addEventListener('blur', clearMotion)
  window.addEventListener('keydown', keyDown)
  window.addEventListener('keyup', keyUp)
  window.addEventListener('blur', clearMotion)
  document.addEventListener('visibilitychange', visibilityChange)
  resetView()
  resize()
  initial.onReady?.()

  return {
    move(direction, isPressed) {
      if (!(direction in motion)) return
      motion[direction] = !!isPressed && state.active && !state.paused
      requestFrame()
    },
    look,
    resetView,
    setState(next) {
      const previous = state
      state = { ...state, ...next }
      if (!(state.roomId in ROOM_DATA)) state.roomId = 'threshold'
      desiredArchitectureAngle = Math.sin(Number(state.shift || 0) * 1.8) * .12
      if (state.paused || !state.active) clearMotion()
      if (previous.roomId !== state.roomId || (!previous.active && state.active)) resetView()
      materials.lantern.emissiveIntensity = state.lanternsOn ? 1.4 : .18
      materials.paper.emissiveIntensity = state.lanternsOn ? .7 : .35
      materials.lantern.color.set(state.lanternsOn ? '#ffc286' : '#8e604b')
      if (previous.active !== state.active) resize()
      lastTime = 0
      requestFrame()
    },
    dispose() {
      if (disposed) return
      disposed = true
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      canvas.removeEventListener('pointerdown', pointerDown)
      canvas.removeEventListener('pointermove', pointerMove)
      canvas.removeEventListener('pointerup', pointerUp)
      canvas.removeEventListener('pointercancel', clearMotion)
      canvas.removeEventListener('webglcontextlost', contextLost)
      canvas.removeEventListener('blur', clearMotion)
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('keyup', keyUp)
      window.removeEventListener('blur', clearMotion)
      document.removeEventListener('visibilitychange', visibilityChange)
      scene.traverse(object => { if (object.isInstancedMesh) object.dispose() })
      Object.values(geometries).forEach(geometry => geometry.dispose())
      Object.values(materials).forEach(material => material.dispose())
      disposableMaterials.forEach(material => material.dispose())
      textures.forEach(texture => texture.dispose())
      dustGeometry.dispose()
      dustMaterial.dispose()
      renderer.renderLists.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
      scene.clear()
    },
  }
}
