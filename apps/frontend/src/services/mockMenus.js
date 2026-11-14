import { buildSimojangMenuTree } from '../config/simojangNavigation'

const simojangMenuTree = buildSimojangMenuTree()

export const MOCK_ROLE_MENUS = {
  admin: simojangMenuTree,
  pegawai: simojangMenuTree,
  pimpinan: simojangMenuTree,
  user: simojangMenuTree,
}

export function getSimojangMenuTree() {
  return simojangMenuTree
}
