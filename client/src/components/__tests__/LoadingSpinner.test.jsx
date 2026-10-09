import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingSpinner from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders without crashing', () => {
    render(<LoadingSpinner />)
    const spinner = screen.getByRole('generic')
    expect(spinner).toBeInTheDocument()
  })

  it('renders with custom message', () => {
    render(<LoadingSpinner message="Loading products..." />)
    expect(screen.getByText('Loading products...')).toBeInTheDocument()
  })

  it('applies correct size classes', () => {
    const { rerender } = render(<LoadingSpinner size="small" />)
    let spinner = screen.getByRole('generic').querySelector('svg')
    expect(spinner).toHaveClass('w-4', 'h-4')

    rerender(<LoadingSpinner size="large" />)
    spinner = screen.getByRole('generic').querySelector('svg')
    expect(spinner).toHaveClass('w-12', 'h-12')
  })
})
