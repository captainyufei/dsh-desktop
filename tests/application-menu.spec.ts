import type { MenuItemConstructorOptions } from 'electron'
import { describe, expect, it, vi } from 'vitest'
import { applicationMenuTemplate } from '../src/application-menu.ts'

function submenuOf(item: MenuItemConstructorOptions): MenuItemConstructorOptions[] {
  if (!Array.isArray(item.submenu)) {
    throw new Error('Expected a menu template submenu')
  }
  return item.submenu
}

describe('application menu', () => {
  it('keeps non-Windows platforms unchanged', () => {
    expect(applicationMenuTemplate('darwin', { openLogs: vi.fn() })).toEqual([])
    expect(applicationMenuTemplate('linux', { openLogs: vi.fn() })).toEqual([])
  })

  it('provides a persistent native Windows menu with working commands', () => {
    const openLogs = vi.fn()
    const template = applicationMenuTemplate('win32', { openLogs })

    expect(template.map((item) => item.label)).toEqual(['文件', '编辑', '视图', '帮助'])
    expect(submenuOf(template[0]!)).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: '关闭窗口', role: 'close' }),
      expect.objectContaining({ label: '退出', role: 'quit' }),
    ]))
    expect(submenuOf(template[1]!)).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: '复制', role: 'copy' }),
      expect.objectContaining({ label: '粘贴', role: 'paste' }),
    ]))
    expect(submenuOf(template[2]!)).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: '实际大小', role: 'resetZoom' }),
      expect.objectContaining({ label: '切换全屏', role: 'togglefullscreen' }),
    ]))

    const openLogsItem = submenuOf(template[3]!)[0]!
    expect(openLogsItem.label).toBe('打开日志')
    expect(openLogsItem.click).toBe(openLogs)
  })
})
