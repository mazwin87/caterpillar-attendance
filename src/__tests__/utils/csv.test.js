import { describe, it, expect, vi, beforeEach } from 'vitest'
import { downloadCSV } from '../../lib/utils/csv'

describe('downloadCSV', () => {
  let clickSpy, createElementSpy, createObjectURL, revokeObjectURL

  beforeEach(() => {
    clickSpy = vi.fn()
    createObjectURL = vi.fn().mockReturnValue('blob:fake-url')
    revokeObjectURL = vi.fn()
    global.URL.createObjectURL = createObjectURL
    global.URL.revokeObjectURL = revokeObjectURL
    createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
      href: '', download: '', click: clickSpy,
    })
  })

  it('triggers a download with the given filename', () => {
    downloadCSV(['Name', 'Status'], [['Alice', 'PRESENT']], 'report.csv')
    expect(clickSpy).toHaveBeenCalledOnce()
    expect(createElementSpy).toHaveBeenCalledWith('a')
    const anchor = createElementSpy.mock.results[0].value
    expect(anchor.download).toBe('report.csv')
  })

  it('wraps every cell in double quotes', () => {
    let capturedBlob
    global.Blob = class {
      constructor(parts) { capturedBlob = parts[0] }
    }
    downloadCSV(['Col A', 'Col B'], [['val1', 'val2']], 'out.csv')
    expect(capturedBlob).toContain('"Col A","Col B"')
    expect(capturedBlob).toContain('"val1","val2"')
  })

  it('puts header row first', () => {
    let capturedBlob
    global.Blob = class {
      constructor(parts) { capturedBlob = parts[0] }
    }
    downloadCSV(['H1', 'H2'], [['r1c1', 'r1c2'], ['r2c1', 'r2c2']], 'f.csv')
    const lines = capturedBlob.split('\n')
    expect(lines[0]).toBe('"H1","H2"')
    expect(lines[1]).toBe('"r1c1","r1c2"')
    expect(lines[2]).toBe('"r2c1","r2c2"')
  })

  it('revokes the object URL after click', () => {
    downloadCSV(['A'], [['1']], 'f.csv')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake-url')
  })
})
