export const BRANCH_SLUGS = ['KLTS', 'SNTL', 'WGMJ', 'MXIM']

export const BRANCH_COLORS = {
  'Caterpillar Playtime KL Traders':  '#2d7a4f',
  'Caterpillar Playtime Sentul':      '#9a6b1a',
  'Caterpillar Playtime Wangsa Maju': '#4a6fa5',
  'Caterpillar Playtime One Maxim':   '#7a4a8a',
}

export function shortBranchName(name) {
  if (!name) return ''
  return name.replace('Caterpillar Playtime ', '')
}
