export const PROGRESS_KEY = 'op_otaku_verse_v1'
export const SEAL_ROOMS = ['lanterns', 'stairs', 'biwa']

export const ROOMS = [
  {
    id: 'threshold',
    number: '01',
    kanji: '門',
    title: 'Le seuil de l’infini',
    subtitle: 'Là où le monde bascule',
    accent: '#d9b981',
    description:
      'Sous tes pieds, le vide. Devant toi, des milliers de portes. Le château attend ton premier pas.',
    hint: 'Explore les trois salles et éveille leurs sceaux pour ouvrir le cœur du château.',
    action: 'Rejoindre les lanternes',
  },
  {
    id: 'lanterns',
    number: '02',
    kanji: '灯',
    title: 'Galerie des lanternes',
    subtitle: 'Une lumière dans le vertige',
    accent: '#f0ba74',
    seal: 'Le sceau de la lumière',
    description:
      'Les lanternes veillent sur une galerie suspendue. Leur lueur révèle un premier fragment du passage.',
    hint: 'Éveille les lanternes pour recueillir le sceau de la lumière.',
    action: 'Éveiller les lanternes',
    discovery:
      'Le sceau de la lumière s’éveille. Une porte de plus reconnaît ton passage.',
  },
  {
    id: 'stairs',
    number: '03',
    kanji: '空',
    title: 'Escaliers suspendus',
    subtitle: 'Les chemins n’obéissent plus au ciel',
    accent: '#b4c9be',
    seal: 'Le sceau du passage',
    description:
      'Des escaliers se croisent au-dessus de l’abîme. Ici, ce qui semble être un plafond est peut-être un autre chemin.',
    hint: 'Scelle le passage pour garder un repère dans cette architecture mouvante.',
    action: 'Sceller le passage',
    discovery:
      'Le sceau du passage est à toi. Même dans l’infini, il reste un chemin.',
  },
  {
    id: 'biwa',
    number: '04',
    kanji: '音',
    title: 'Chambre du biwa',
    subtitle: 'Une note. Un autre monde.',
    accent: '#d8a6a0',
    seal: 'Le sceau de la résonance',
    description:
      'Une corde attend dans le silence. Fais-la vibrer : au loin, les pavillons du château changent de place.',
    hint: 'Fais résonner le biwa pour déplacer le décor et éveiller le dernier sceau.',
    action: 'Faire résonner le biwa',
    discovery:
      'Le sceau de la résonance s’éveille. Le château se réorganise autour de toi.',
  },
  {
    id: 'heart',
    number: '05',
    kanji: '無',
    title: 'Le cœur du château',
    subtitle: 'Tu as trouvé le centre de l’infini',
    accent: '#e8d6ad',
    description:
      'Les trois sceaux se répondent. Les portes s’ouvrent sur un instant suspendu, au cœur de ce monde impossible.',
    hint: 'Prends le temps de regarder. Tu peux poursuivre la visite ou retrouver ton monde à tout moment.',
    action: 'Contempler l’infini',
  },
]

export function sanitizeProgress(value) {
  const uniqueKnown = (items, allowed) =>
    Array.isArray(items)
      ? [...new Set(items.filter((id) => allowed.includes(id)))]
      : []
  const seals = uniqueKnown(value?.seals, SEAL_ROOMS)
  const visited = uniqueKnown(
    value?.visited,
    ROOMS.map((room) => room.id)
  ).filter((id) => id !== 'heart' || seals.length === SEAL_ROOMS.length)
  return { seals, visited: [...new Set(['threshold', ...visited])] }
}

export function readProgress() {
  try {
    return sanitizeProgress(JSON.parse(localStorage.getItem(PROGRESS_KEY)))
  } catch {
    return sanitizeProgress(null)
  }
}

export function canEnterRoom(roomId, progress) {
  return (
    ROOMS.some((room) => room.id === roomId) &&
    (roomId !== 'heart' ||
      sanitizeProgress(progress).seals.length === SEAL_ROOMS.length)
  )
}

export function discoverRoom(progress, roomId) {
  const safe = sanitizeProgress(progress)
  return canEnterRoom(roomId, safe)
    ? { ...safe, visited: [...new Set([...safe.visited, roomId])] }
    : safe
}

export function collectSeal(progress, roomId) {
  const safe = sanitizeProgress(progress)
  if (!SEAL_ROOMS.includes(roomId) || !safe.visited.includes(roomId))
    return safe
  return { ...safe, seals: [...new Set([...safe.seals, roomId])] }
}
