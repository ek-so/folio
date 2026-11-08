import { MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'

// How every drag in the app starts (@dnd-kit): with a mouse after moving 5px (a click stays a click), on touch after
// holding 0.25s without moving more than 8px (a swipe still scrolls). Board, planner, a note's lists, Edit list
export function useDragSensors() {
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  )
}
