import React, { useCallback, useRef } from 'react'
import type { SplitOrientation } from '../../shared/multi-project-types'

type SplitProjectDividerProps = {
  orientation: SplitOrientation
  ratio: number
  onRatioChange: (ratio: number) => void
  onReset?: () => void
}

export function SplitProjectDivider({
  orientation,
  ratio,
  onRatioChange,
  onReset
}: SplitProjectDividerProps): React.JSX.Element {
  const isDraggingRef = useRef(false)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      isDraggingRef.current = true

      const container =
        e.currentTarget instanceof HTMLElement ? e.currentTarget.parentElement : null
      if (!container) {
        return
      }

      const rect = container.getBoundingClientRect()

      const handleMouseMove = (moveEvent: MouseEvent): void => {
        if (!isDraggingRef.current) {
          return
        }
        let nextRatio: number
        if (orientation === 'horizontal') {
          const offsetX = moveEvent.clientX - rect.left
          nextRatio = (offsetX / rect.width) * 100
        } else {
          const offsetY = moveEvent.clientY - rect.top
          nextRatio = (offsetY / rect.height) * 100
        }
        onRatioChange(nextRatio)
      }

      const handleMouseUp = (): void => {
        isDraggingRef.current = false
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    },
    [orientation, onRatioChange]
  )

  const isHorizontal = orientation === 'horizontal'

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation={orientation}
      aria-valuenow={ratio}
      onMouseDown={handleMouseDown}
      onDoubleClick={onReset}
      className={`absolute z-30 transition-colors select-none ${
        isHorizontal
          ? 'top-0 bottom-0 w-[6px] -ml-[3px] cursor-col-resize hover:bg-primary/40 active:bg-primary'
          : 'left-0 right-0 h-[6px] -mt-[3px] cursor-row-resize hover:bg-primary/40 active:bg-primary'
      }`}
      style={{
        left: isHorizontal ? `${ratio}%` : '0',
        top: isHorizontal ? '0' : `${ratio}%`,
        backgroundColor: 'var(--border)'
      }}
      title="Drag to resize split view (Double-click to reset 50/50)"
    >
      <div
        className={`absolute bg-border ${
          isHorizontal
            ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] h-8 rounded-full'
            : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[2px] w-8 rounded-full'
        }`}
      />
    </div>
  )
}
